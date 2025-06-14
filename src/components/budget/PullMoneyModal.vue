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
          <h3 class="text-base font-semibold">Pull Money From</h3>
          <button
            @click="close"
            class="text-muted-foreground hover:text-foreground"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Amount display -->
        <div v-if="selectedSourceId" class="space-y-2">
          <div class="text-sm text-muted-foreground">
            Will pull: {{ formatCurrency(pullAmount) }}
          </div>
        </div>

        <!-- Source category dropdown -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Pull From Category</label>
          <div class="relative">
            <button
              ref="dropdownButton"
              @click="showDropdown = !showDropdown"
              @keydown="handleCategoryKeydown"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-left focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent flex items-center justify-between"
            >
              <span class="truncate">
                {{ selectedSourceName || 'Select category...' }}
              </span>
              <ChevronDown class="h-4 w-4 text-muted-foreground" />
            </button>

            <!-- Dropdown -->
            <div
              v-if="showDropdown"
              class="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
            >
              <!-- Ready to Assign option (only show if positive balance) -->
              <div v-if="budgetStore.readyToAssign > 0" class="border-b border-border/50">
                <button
                  @click="selectReadyToAssignAndFocusPull"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                  :class="[
                    selectedSourceId === READY_TO_ASSIGN_ID
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  ]"
                >
                  <span class="font-medium">Ready to Assign</span>
                  <span class="text-xs text-muted-foreground">{{ formatCurrency(budgetStore.readyToAssign) }}</span>
                </button>
              </div>

              <!-- Category list -->
              <div class="max-h-48 overflow-y-auto">
                <div
                  v-for="(group, groupIndex) in groupedCategories"
                  :key="group.id"
                  class="border-b border-border/50 last:border-b-0"
                >
                  <div class="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/30">
                    {{ group.name }}
                  </div>
                  <div
                    v-for="(category, categoryIndex) in group.categories"
                    :key="category.id"
                    :ref="el => setCategoryRef(el, groupIndex, categoryIndex)"
                  >
                    <button
                      @click="selectCategoryAndFocusPull(category)"
                      class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                      :class="[
                        isHighlighted(groupIndex, categoryIndex)
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      ]"
                    >
                      <span>{{ category.name }}</span>
                      <span class="text-xs text-muted-foreground">{{ formatCurrency(category.available || 0) }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="sourceError" class="text-sm text-red-500">{{ sourceError }}</div>
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
            ref="pullButton"
            @click="handlePull"
            :disabled="!canPull"
            class="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pull
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
import { useBudgetStore } from '@/stores/budget.store'

interface Props {
  isOpen: boolean
  destinationCategory: CategoryResponse | null
  availableCategories: CategoryResponse[]
  position: { x: number; y: number }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'pull', sourceCategoryId: string, amount: number): void
  (e: 'pull-from-ready-to-assign', amount: number): void
}>()

const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()

// Form state
const selectedSourceId = ref('')
const showDropdown = ref(false)
const hasInteracted = ref(false)

// Special ID for Ready to Assign option
const READY_TO_ASSIGN_ID = 'ready-to-assign'

// Error states
const sourceError = ref('')

// Refs
const dropdownButton = ref<HTMLButtonElement>()
const pullButton = ref<HTMLButtonElement>()
const categoryRefs = ref<(HTMLElement | null)[][]>([])

// Highlighted index for keyboard navigation
const highlightedIndex = ref({ group: 0, category: 0 })

const setCategoryRef = (el: HTMLElement | null, groupIndex: number, categoryIndex: number) => {
  if (!categoryRefs.value[groupIndex]) {
    categoryRefs.value[groupIndex] = []
  }
  categoryRefs.value[groupIndex][categoryIndex] = el
}

// Computed properties
const selectedSourceName = computed(() => {
  if (!selectedSourceId.value) return ''

  if (selectedSourceId.value === READY_TO_ASSIGN_ID) {
    return `Ready to Assign (${formatCurrency(budgetStore.readyToAssign)})`
  }

  const category = props.availableCategories.find(cat => cat.id === selectedSourceId.value)
  return category ? `${category.name} (${formatCurrency(category.available || 0)})` : ''
})

const pullAmount = computed(() => {
  if (!selectedSourceId.value || !props.destinationCategory) return 0

  const neededAmount = Math.abs(props.destinationCategory.available || 0)

  if (selectedSourceId.value === READY_TO_ASSIGN_ID) {
    return Math.min(budgetStore.readyToAssign, neededAmount)
  }

  const sourceCategory = props.availableCategories.find(cat => cat.id === selectedSourceId.value)
  const sourceAvailable = sourceCategory?.available || 0

  return Math.min(sourceAvailable, neededAmount)
})

const groupedCategories = computed(() => {
  // Group categories by category group
  const groupedCategories = new Map<string, { id: string; name: string; categories: CategoryResponse[] }>()

  props.availableCategories.forEach(category => {
    const group = categoryStore.categoryGroups.find(g => g.id === category.category_group_id)
    if (!group) return

    if (!groupedCategories.has(group.id)) {
      groupedCategories.set(group.id, {
        id: group.id,
        name: group.name,
        categories: []
      })
    }

    groupedCategories.get(group.id)!.categories.push(category)
  })

  // Convert to array and filter out empty groups
  return Array.from(groupedCategories.values())
    .filter(group => group.categories.length > 0)
    .map(group => ({
      ...group,
      categories: group.categories.sort((a, b) => a.display_order - b.display_order)
    }))
    .sort((a, b) => {
      const groupA = categoryStore.categoryGroups.find(g => g.id === a.id)
      const groupB = categoryStore.categoryGroups.find(g => g.id === b.id)
      return (groupA?.display_order || 0) - (groupB?.display_order || 0)
    })
})

const isHighlighted = (groupIndex: number, categoryIndex: number) => {
  return highlightedIndex.value.group === groupIndex && highlightedIndex.value.category === categoryIndex
}

// Position the modal to the left of the clicked element
const modalStyle = computed(() => {
  const { x, y } = props.position

  // Calculate position to keep modal on screen
  const modalWidth = 288 // 18rem (w-72)
  const modalHeight = 400 // approximate height
  const padding = 16
  const offsetFromElement = 80 // Space between modal and budget list

  // Position to the left of the clicked element
  let left = x - modalWidth - offsetFromElement
  let top = y - modalHeight / 2 // Center vertically relative to clicked element

  // Keep modal on screen
  if (left < padding) {
    left = x + offsetFromElement // Position to the right instead
  }
  if (left + modalWidth > window.innerWidth - padding) {
    left = window.innerWidth - modalWidth - padding
  }
  if (top < padding) {
    top = padding
  }
  if (top + modalHeight > window.innerHeight - padding) {
    top = window.innerHeight - modalHeight - padding
  }

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 60
  }
})

const canPull = computed(() => {
  return selectedSourceId.value && pullAmount.value > 0 && !sourceError.value
})

const validateSource = () => {
  if (!hasInteracted.value) return true

  sourceError.value = ''

  if (!selectedSourceId.value) {
    sourceError.value = 'Please select a source category'
    return false
  }

  return true
}

const handlePull = () => {
  // Force validation on submit
  hasInteracted.value = true

  if (!validateSource()) return

  // Clear errors on successful submission
  sourceError.value = ''

  if (selectedSourceId.value === READY_TO_ASSIGN_ID) {
    emit('pull-from-ready-to-assign', pullAmount.value)
  } else {
    emit('pull', selectedSourceId.value, pullAmount.value)
  }
}

// Navigation functions
const navigateDown = (categories: typeof groupedCategories.value) => {
  const { group, category } = highlightedIndex.value

  if (category < categories[group].categories.length - 1) {
    highlightedIndex.value.category++
  } else if (group < categories.length - 1) {
    highlightedIndex.value.group++
    highlightedIndex.value.category = 0
  }

  scrollToHighlighted()
}

const navigateUp = (categories: typeof groupedCategories.value) => {
  const { group, category } = highlightedIndex.value

  if (category > 0) {
    highlightedIndex.value.category--
  } else if (group > 0) {
    highlightedIndex.value.group--
    highlightedIndex.value.category = categories[highlightedIndex.value.group].categories.length - 1
  }

  scrollToHighlighted()
}

const selectCategory = (category: CategoryResponse) => {
  selectedSourceId.value = category.id
  showDropdown.value = false
}

const selectCategoryAndFocusPull = (category: CategoryResponse) => {
  selectCategory(category)
  nextTick(() => {
    pullButton.value?.focus()
  })
}

const selectReadyToAssign = () => {
  selectedSourceId.value = READY_TO_ASSIGN_ID
  showDropdown.value = false
}

const selectReadyToAssignAndFocusPull = () => {
  selectReadyToAssign()
  nextTick(() => {
    pullButton.value?.focus()
  })
}

const handleCategoryKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return

  const categories = groupedCategories.value
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

const selectHighlightedCategory = (categories: typeof groupedCategories.value) => {
  const { group, category } = highlightedIndex.value
  if (categories[group]?.categories[category]) {
    selectCategoryAndFocusPull(categories[group].categories[category])
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
    selectedSourceId.value = ''
    showDropdown.value = false
    hasInteracted.value = false
    highlightedIndex.value = { group: 0, category: 0 }
    categoryRefs.value = []
    sourceError.value = ''

    // Focus the dropdown button
    nextTick(() => {
      dropdownButton.value?.focus()
    })
  }
})

// Add/remove event listeners for clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for validation
watch(selectedSourceId, () => {
  if (hasInteracted.value) {
    validateSource()
  }
})
</script>
