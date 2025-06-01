<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center"
    @click="close"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/20"></div>

    <!-- Modal positioned near the clicked element -->
    <div
      class="relative bg-background border border-border rounded-lg shadow-lg p-4 w-72 max-w-[calc(100vw-2rem)]"
      :style="modalStyle"
      @click.stop
    >
      <div class="space-y-3">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold">Assign Money</h3>
          <button
            @click="close"
            class="text-muted-foreground hover:text-foreground"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Amount input -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Amount</label>
          <input
            ref="amountInput"
            v-model="amount"
            type="number"
            min="0.01"
            :max="maxAmount"
            step="0.01"
            placeholder="0.00"
            class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            @keydown.enter="handleAssign"
            @keydown.escape="close"
            @input="hasInteracted = true"
          />
          <div v-if="amountError" class="text-sm text-red-500">{{ amountError }}</div>
        </div>

        <!-- Category selection -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Category</label>
          <div class="relative">
            <button
              ref="categoryButton"
              @click="toggleDropdown"
              @keydown.enter="toggleDropdown"
              @keydown.space.prevent="toggleDropdown"
              @keydown.escape="showDropdown = false"
              @keydown.arrow-down.prevent="focusFirstOption"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent flex items-center justify-between"
            >
              <span class="truncate">
                {{ selectedCategory ? selectedCategory.name : 'Select category' }}
              </span>
              <ChevronDown class="h-4 w-4 text-muted-foreground" />
            </button>

            <!-- Dropdown -->
            <div
              v-if="showDropdown"
              class="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
            >
              <!-- Search input -->
              <div class="p-2 border-b border-border">
                <input
                  ref="searchInput"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search categories..."
                  class="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  @keydown.escape="showDropdown = false"
                  @keydown.arrow-down.prevent="focusFirstOption"
                  @keydown.enter.prevent="selectFirstFilteredCategory"
                />
              </div>

              <!-- Category options -->
              <div class="py-1">
                <button
                  v-for="(category, index) in filteredCategories"
                  :key="category.id"
                  :ref="el => setOptionRef(el, index)"
                  @click="selectCategoryAndFocusAssign(category)"
                  @keydown.enter="selectCategoryAndFocusAssign(category)"
                  @keydown.escape="showDropdown = false"
                  @keydown.arrow-down.prevent="focusNextOption(index)"
                  @keydown.arrow-up.prevent="focusPrevOption(index)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  {{ category.name }}
                </button>
                <div v-if="filteredCategories.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
                  No categories found
                </div>
              </div>
            </div>
          </div>
          <div v-if="categoryError" class="text-sm text-red-500">{{ categoryError }}</div>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="close"
            class="px-3 py-1.5 text-sm border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </button>
          <button
            ref="assignButton"
            @click="handleAssign"
            :disabled="!canAssign"
            :class="[
              'px-3 py-1.5 text-sm rounded-md font-medium',
              canAssign
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            ]"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { X, ChevronDown } from 'lucide-vue-next'
import type { CategoryResponse } from '@/types/DTO/category.dto'

interface Props {
  isOpen: boolean
  availableCategories: CategoryResponse[]
  position: { x: number; y: number }
  maxAmount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assign', categoryId: string, amount: number): void
}>()

// Form state
const amount = ref<number | string>('')
const selectedCategory = ref<CategoryResponse | null>(null)
const hasInteracted = ref(false)
const amountError = ref('')
const categoryError = ref('')

// Dropdown state
const showDropdown = ref(false)
const searchQuery = ref('')
const isSearching = ref(false)

// Refs
const amountInput = ref<HTMLInputElement>()
const categoryButton = ref<HTMLButtonElement>()
const searchInput = ref<HTMLInputElement>()
const assignButton = ref<HTMLButtonElement>()
const optionRefs = ref<(HTMLElement | null)[]>([])

const setOptionRef = (el: HTMLElement | null, index: number) => {
  optionRefs.value[index] = el
}

// Computed properties
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return props.availableCategories
  }
  return props.availableCategories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const canAssign = computed(() => {
  const numAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value
  return (
    numAmount > 0 &&
    numAmount <= props.maxAmount &&
    selectedCategory.value &&
    !amountError.value &&
    !categoryError.value
  )
})

// Position the modal below the Ready to Assign button
const modalStyle = computed(() => {
  const { x, y } = props.position

  // Calculate position to keep modal on screen
  const modalWidth = 288 // 18rem (w-72)
  const modalHeight = 400 // approximate height
  const padding = 16

  // Position below the Ready to Assign button
  let left = x - modalWidth / 2 // Center horizontally relative to clicked element
  let top = y + 8 // Position below with small gap

  // Keep modal on screen horizontally
  if (left < padding) {
    left = padding
  }
  if (left + modalWidth > window.innerWidth - padding) {
    left = window.innerWidth - modalWidth - padding
  }

  // Keep modal on screen vertically
  if (top + modalHeight > window.innerHeight - padding) {
    top = y - modalHeight - 8 // Position above instead
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
    position: 'fixed'
  }
})

// Validation
const validateAmount = () => {
  if (!hasInteracted.value) return true

  amountError.value = ''

  const numAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value

  if (!numAmount || numAmount <= 0) {
    amountError.value = 'Amount must be greater than 0'
    return false
  }

  if (numAmount > props.maxAmount) {
    amountError.value = `Amount cannot exceed ${props.maxAmount.toFixed(2)}`
    return false
  }

  return true
}

const validateCategory = () => {
  if (!hasInteracted.value) return true

  categoryError.value = ''

  if (!selectedCategory.value) {
    categoryError.value = 'Please select a category'
    return false
  }

  return true
}

// Event handlers
const close = () => {
  emit('close')
}

const handleAssign = () => {
  // Force validation on submit
  hasInteracted.value = true

  if (!validateAmount() || !validateCategory()) return

  const numAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value

  // Clear errors on successful submission
  amountError.value = ''
  categoryError.value = ''

  emit('assign', selectedCategory.value!.id, numAmount)
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
}

const selectCategory = (category: CategoryResponse) => {
  selectedCategory.value = category
  searchQuery.value = ''
  isSearching.value = false
  showDropdown.value = false
}

const selectCategoryAndFocusAssign = (category: CategoryResponse) => {
  selectCategory(category)
  nextTick(() => {
    assignButton.value?.focus()
  })
}

const selectFirstFilteredCategory = () => {
  if (filteredCategories.value.length > 0) {
    selectCategoryAndFocusAssign(filteredCategories.value[0])
  }
}

const focusFirstOption = () => {
  if (optionRefs.value[0]) {
    optionRefs.value[0].focus()
  }
}

const focusNextOption = (currentIndex: number) => {
  const nextIndex = currentIndex + 1
  if (nextIndex < optionRefs.value.length && optionRefs.value[nextIndex]) {
    optionRefs.value[nextIndex]!.focus()
  }
}

const focusPrevOption = (currentIndex: number) => {
  if (currentIndex > 0) {
    const prevIndex = currentIndex - 1
    if (optionRefs.value[prevIndex]) {
      optionRefs.value[prevIndex]!.focus()
    }
  } else {
    // Focus back to search input
    searchInput.value?.focus()
  }
}

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Reset form when modal opens
    amount.value = ''
    selectedCategory.value = null
    hasInteracted.value = false
    amountError.value = ''
    categoryError.value = ''
    searchQuery.value = ''
    showDropdown.value = false

    // Focus amount input
    nextTick(() => {
      amountInput.value?.focus()
    })
  }
})

watch([amount], () => {
  validateAmount()
})

watch([selectedCategory], () => {
  validateCategory()
})

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (showDropdown.value && !categoryButton.value?.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
