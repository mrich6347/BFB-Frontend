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
          <h3 class="text-base font-semibold">Move Money</h3>
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
            :max="sourceCategory?.available || 0"
            step="0.01"
            placeholder="0.00"
            class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            @keydown.enter="handleMove"
            @keydown.escape="close"
            @input="hasInteracted = true"
          />
          <div v-if="amountError" class="text-sm text-red-500">{{ amountError }}</div>
        </div>

        <!-- Destination category dropdown -->
        <div class="space-y-2">
          <label class="text-sm font-medium">To Category</label>
          <div class="relative">
            <input
              ref="categorySearchInput"
              v-model="displayValue"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
              @keydown="handleCategoryKeydown"
              :placeholder="'Search categories...'"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

            <!-- Custom dropdown -->
            <div
              v-if="showDropdown && filteredCategories.length > 0"
              class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
            >
              <div
                v-for="(group, groupIndex) in filteredCategories"
                :key="group.groupId"
                class="border-b border-border last:border-b-0"
              >
                <div class="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  {{ group.groupName }}
                </div>
                <button
                  v-for="(category, categoryIndex) in group.categories"
                  :key="category.id"
                  :ref="el => setCategoryRef(el, groupIndex, categoryIndex)"
                  @click="selectCategory(category)"
                  @keydown.enter="selectCategoryAndFocusMove(category)"
                  :class="[
                    'w-full px-4 py-2 text-left text-sm focus:outline-none',
                    isHighlighted(groupIndex, categoryIndex)
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  ]"
                >
                  {{ category.name }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="destinationError" class="text-sm text-red-500">{{ destinationError }}</div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 pt-2">
          <button
            @click="close"
            class="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-accent"
          >
            Cancel
          </button>
          <button
            ref="moveButton"
            @click="handleMove"
            :disabled="!canMove"
            class="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { X, ChevronDown } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import { useCategoryStore } from '@/stores/category.store'

interface Props {
  isOpen: boolean
  sourceCategory: CategoryResponse | null
  availableCategories: CategoryResponse[]
  position: { x: number; y: number }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'move', destinationCategoryId: string, amount: number): void
}>()

const categoryStore = useCategoryStore()
const amountInput = ref<HTMLInputElement>()
const categorySearchInput = ref<HTMLInputElement>()
const moveButton = ref<HTMLButtonElement>()
const amount = ref<number | string>('')
const selectedDestinationId = ref('')
const searchQuery = ref('')
const showDropdown = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref({ group: 0, category: 0 })
const categoryRefs = ref<HTMLElement[][]>([])
const amountError = ref('')
const destinationError = ref('')
const hasInteracted = ref(false)

// Group categories by category group for better UX
const groupedCategories = computed(() => {
  const groups = new Map<string, { groupId: string; groupName: string; categories: CategoryResponse[] }>()

  props.availableCategories.forEach(category => {
    const group = categoryStore.categoryGroups.find(g => g.id === category.category_group_id)
    const groupName = group?.name || 'Unknown Group'

    if (!groups.has(category.category_group_id)) {
      groups.set(category.category_group_id, {
        groupId: category.category_group_id,
        groupName,
        categories: []
      })
    }

    groups.get(category.category_group_id)?.categories.push(category)
  })

  // Sort groups by display order and categories by name
  return Array.from(groups.values())
    .sort((a, b) => {
      const groupA = categoryStore.categoryGroups.find(g => g.id === a.groupId)
      const groupB = categoryStore.categoryGroups.find(g => g.id === b.groupId)
      return (groupA?.display_order || 0) - (groupB?.display_order || 0)
    })
    .map(group => ({
      ...group,
      categories: group.categories.sort((a, b) => a.name.localeCompare(b.name))
    }))
})

// Filter categories based on search query
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return groupedCategories.value
  }

  const query = searchQuery.value.toLowerCase()
  return groupedCategories.value
    .map(group => ({
      ...group,
      categories: group.categories.filter(category =>
        category.name.toLowerCase().includes(query)
      )
    }))
    .filter(group => group.categories.length > 0)
})

// Get the name of the selected category
const selectedCategoryName = computed(() => {
  if (!selectedDestinationId.value) return ''

  for (const group of groupedCategories.value) {
    const category = group.categories.find(c => c.id === selectedDestinationId.value)
    if (category) return category.name
  }

  return ''
})

// Display value for the input (either search query or selected category name)
const displayValue = computed({
  get: () => {
    if (isSearching.value) {
      return searchQuery.value
    }
    return selectedCategoryName.value
  },
  set: (value: string) => {
    searchQuery.value = value
    isSearching.value = true
  }
})

// Position the modal to the left of the clicked element
const modalStyle = computed(() => {
  const { x, y } = props.position

  // Calculate position to keep modal on screen
  const modalWidth = 288 // 18rem (w-72)
  const modalHeight = 350 // approximate height (reduced)
  const padding = 16
  const offsetFromElement = 80 // Much more space between modal and budget list

  // Position to the left of the clicked element
  let left = x - modalWidth - offsetFromElement
  let top = y - modalHeight / 2 // Center vertically relative to clicked element

  // Keep modal within viewport bounds
  if (left < padding) {
    // If not enough space on the left, position to the right instead
    left = x + offsetFromElement

    // If still not enough space on the right, center it
    if (left + modalWidth > window.innerWidth - padding) {
      left = Math.max(padding, (window.innerWidth - modalWidth) / 2)
    }
  }

  // Ensure modal doesn't go off the top or bottom of the screen
  if (top < padding) {
    top = padding
  } else if (top + modalHeight > window.innerHeight - padding) {
    top = window.innerHeight - modalHeight - padding
  }

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 60
  }
})

const canMove = computed(() => {
  const numAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value
  return (
    numAmount > 0 &&
    numAmount <= (props.sourceCategory?.available || 0) &&
    selectedDestinationId.value &&
    !amountError.value &&
    !destinationError.value
  )
})

const validateAmount = () => {
  if (!hasInteracted.value) return true

  amountError.value = ''

  const numAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value

  if (!numAmount || numAmount <= 0) {
    amountError.value = 'Amount must be greater than 0'
    return false
  }

  if (numAmount > (props.sourceCategory?.available || 0)) {
    amountError.value = 'Amount cannot exceed available balance'
    return false
  }

  return true
}

const validateDestination = () => {
  if (!hasInteracted.value) return true

  destinationError.value = ''

  if (!selectedDestinationId.value) {
    destinationError.value = 'Please select a destination category'
    return false
  }

  return true
}

const handleMove = () => {
  // Force validation on submit
  hasInteracted.value = true

  if (!validateAmount() || !validateDestination()) return

  const numAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value

  // Clear errors on successful submission
  amountError.value = ''
  destinationError.value = ''

  emit('move', selectedDestinationId.value, numAmount)
}

const setCategoryRef = (el: HTMLElement | null, groupIndex: number, categoryIndex: number) => {
  if (!categoryRefs.value[groupIndex]) {
    categoryRefs.value[groupIndex] = []
  }
  if (el) {
    categoryRefs.value[groupIndex][categoryIndex] = el
  }
}

const isHighlighted = (groupIndex: number, categoryIndex: number) => {
  return highlightedIndex.value.group === groupIndex && highlightedIndex.value.category === categoryIndex
}

const handleInputFocus = () => {
  hasInteracted.value = true
  isSearching.value = true
  showDropdown.value = true
}

const handleInputBlur = () => {
  // Delay to allow click events on dropdown items
  setTimeout(() => {
    if (!showDropdown.value) {
      isSearching.value = false
    }
  }, 150)
}

const selectCategory = (category: CategoryResponse) => {
  selectedDestinationId.value = category.id
  searchQuery.value = ''
  isSearching.value = false
  showDropdown.value = false
}

const selectCategoryAndFocusMove = (category: CategoryResponse) => {
  selectCategory(category)
  nextTick(() => {
    moveButton.value?.focus()
  })
}

const handleCategoryKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return

  const categories = filteredCategories.value
  if (categories.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      navigateDown(categories)
      break
    case 'ArrowUp':
      event.preventDefault()
      navigateUp(categories)
      break
    case 'Enter':
      event.preventDefault()
      selectHighlightedCategory(categories)
      break
    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      break
  }
}

const navigateDown = (categories: typeof filteredCategories.value) => {
  const { group, category } = highlightedIndex.value

  if (category < categories[group].categories.length - 1) {
    highlightedIndex.value.category++
  } else if (group < categories.length - 1) {
    highlightedIndex.value.group++
    highlightedIndex.value.category = 0
  }

  scrollToHighlighted()
}

const navigateUp = (categories: typeof filteredCategories.value) => {
  const { group, category } = highlightedIndex.value

  if (category > 0) {
    highlightedIndex.value.category--
  } else if (group > 0) {
    highlightedIndex.value.group--
    highlightedIndex.value.category = categories[highlightedIndex.value.group].categories.length - 1
  }

  scrollToHighlighted()
}

const selectHighlightedCategory = (categories: typeof filteredCategories.value) => {
  const { group, category } = highlightedIndex.value
  if (categories[group]?.categories[category]) {
    selectCategoryAndFocusMove(categories[group].categories[category])
  }
}

const scrollToHighlighted = () => {
  nextTick(() => {
    const { group, category } = highlightedIndex.value
    const element = categoryRefs.value[group]?.[category]
    if (element) {
      element.scrollIntoView({ block: 'nearest' })
    }
  })
}

const close = () => {
  emit('close')
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showDropdown.value = false
  }
}

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    amount.value = ''
    selectedDestinationId.value = ''
    searchQuery.value = ''
    showDropdown.value = false
    isSearching.value = false
    hasInteracted.value = false
    highlightedIndex.value = { group: 0, category: 0 }
    categoryRefs.value = []
    amountError.value = ''
    destinationError.value = ''

    // Focus the amount input
    nextTick(() => {
      amountInput.value?.focus()
    })
  }
})

// Reset highlighted index when search changes
watch(searchQuery, () => {
  highlightedIndex.value = { group: 0, category: 0 }
})

// Add/remove event listeners for clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Validate on input changes
watch(amount, validateAmount)
watch(selectedDestinationId, validateDestination)
</script>
