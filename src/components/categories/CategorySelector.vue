<template>
  <div class="space-y-2">
    <label v-if="label" class="text-sm font-medium">{{ label }}</label>
    <div class="relative">
      <!-- Search input -->
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keydown="handleInputKeydown"
        @input="handleInput"
      />

      <!-- Dropdown -->
      <div
        v-if="showDropdown && (showReadyToAssign || filteredCategories.length > 0)"
        class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
      >
        <!-- Ready to Assign option -->
        <div v-if="showReadyToAssign" class="border-b border-border">
          <div class="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
            Special
          </div>
          <button
            :ref="el => setCategoryRef(el, -1, 0)"
            @click="selectReadyToAssign"
            @keydown.enter="selectReadyToAssign"
            :class="[
              'w-full px-4 py-2 text-left text-sm focus:outline-none',
              isHighlighted(-1, 0)
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            ]"
          >
            Ready to Assign
          </button>
        </div>

        <!-- Regular categories -->
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
            @keydown.enter="selectCategory(category)"
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

        <!-- No results message -->
        <div v-if="filteredCategories.length === 0 && !showReadyToAssign" class="px-3 py-2 text-sm text-muted-foreground">
          No categories found
        </div>
      </div>
    </div>
    <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import { useCategoryStore } from '@/stores/category.store'

interface CategoryGroup {
  groupId: string
  groupName: string
  categories: CategoryResponse[]
}

interface Props {
  modelValue?: string | null
  availableCategories?: CategoryResponse[]
  label?: string
  placeholder?: string
  includeReadyToAssign?: boolean
  includeUncategorized?: boolean
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  availableCategories: undefined,
  label: '',
  placeholder: 'Select category...',
  includeReadyToAssign: false,
  includeUncategorized: false,
  error: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'select', category: CategoryResponse | null): void
}>()

const categoryStore = useCategoryStore()

// Reactive state
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref({ group: 0, category: 0 })
const categoryRefs = ref<(HTMLElement | null)[][]>([])

// Get categories to use
const categoriesToUse = computed(() => {
  return props.availableCategories || categoryStore.categories
})

// Group categories by category group
const groupedCategories = computed(() => {
  const groups: Record<string, CategoryGroup> = {}

  categoriesToUse.value.forEach(category => {
    const groupId = category.category_group_id
    const group = categoryStore.categoryGroups.find(g => g.id === groupId)
    const groupName = group?.name || 'Uncategorized'

    if (!groups[groupId]) {
      groups[groupId] = {
        groupId,
        groupName,
        categories: []
      }
    }

    groups[groupId].categories.push(category)
  })

  return Object.values(groups).sort((a, b) => a.groupName.localeCompare(b.groupName))
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

// Show Ready to Assign option
const showReadyToAssign = computed(() => {
  return props.includeReadyToAssign && (
    !searchQuery.value.trim() ||
    'ready to assign'.includes(searchQuery.value.toLowerCase())
  )
})

// Get selected category display text
const displayText = computed(() => {
  if (!props.modelValue) return ''

  if (props.modelValue === 'ready-to-assign') {
    return 'Ready to Assign'
  }

  if (props.modelValue === '') {
    return 'Uncategorized'
  }

  const category = categoriesToUse.value.find(c => c.id === props.modelValue)
  return category?.name || ''
})

// Watch for external model value changes
watch(() => props.modelValue, (newValue) => {
  if (!isSearching.value) {
    searchQuery.value = displayText.value
  }
})

// Initialize display text
onMounted(() => {
  searchQuery.value = displayText.value
})

// Event handlers
const handleInputFocus = () => {
  isSearching.value = true
  showDropdown.value = true
  searchQuery.value = '' // Clear for typing
  resetHighlight()
}

const handleInputBlur = (event: FocusEvent) => {
  // Don't close if focus is moving to a dropdown item
  const relatedTarget = event.relatedTarget as HTMLElement
  const container = searchInput.value?.closest('.relative')

  if (container && relatedTarget && container.contains(relatedTarget)) {
    return // Keep dropdown open if focus is moving within the component
  }

  // Delay to allow click events on dropdown items
  setTimeout(() => {
    if (!showDropdown.value) {
      isSearching.value = false
      searchQuery.value = displayText.value // Restore display text
    }
  }, 150)
}

const handleInput = () => {
  resetHighlight()
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      navigateDown()
      break
    case 'ArrowUp':
      event.preventDefault()
      navigateUp()
      break
    case 'Enter':
      event.preventDefault()
      selectHighlightedCategory()
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
  }
}

// Navigation functions
const navigateDown = () => {
  const categories = filteredCategories.value
  const { group, category } = highlightedIndex.value

  // Handle Ready to Assign navigation
  if (showReadyToAssign.value && group === -1) {
    if (categories.length > 0) {
      highlightedIndex.value = { group: 0, category: 0 }
    }
    return
  }

  // Navigate within current group
  if (categories[group] && category < categories[group].categories.length - 1) {
    highlightedIndex.value.category++
  }
  // Move to next group
  else if (group < categories.length - 1) {
    highlightedIndex.value = { group: group + 1, category: 0 }
  }

  scrollToHighlighted()
}

const navigateUp = () => {
  const categories = filteredCategories.value
  const { group, category } = highlightedIndex.value

  // Navigate within current group
  if (category > 0) {
    highlightedIndex.value.category--
  }
  // Move to previous group
  else if (group > 0) {
    highlightedIndex.value = {
      group: group - 1,
      category: categories[group - 1].categories.length - 1
    }
  }
  // Move to Ready to Assign if available
  else if (showReadyToAssign.value) {
    highlightedIndex.value = { group: -1, category: 0 }
  }

  scrollToHighlighted()
}

const resetHighlight = () => {
  if (showReadyToAssign.value) {
    highlightedIndex.value = { group: -1, category: 0 }
  } else if (filteredCategories.value.length > 0) {
    highlightedIndex.value = { group: 0, category: 0 }
  }
}

const selectCategory = (category: CategoryResponse) => {
  emit('update:modelValue', category.id)
  emit('select', category)
  closeDropdown()
}

const selectReadyToAssign = () => {
  emit('update:modelValue', 'ready-to-assign')
  emit('select', null)
  closeDropdown()
}

const selectHighlightedCategory = () => {
  const { group, category } = highlightedIndex.value

  // Handle Ready to Assign selection
  if (group === -1 && category === 0) {
    selectReadyToAssign()
  }
  // Handle regular category selection
  else if (filteredCategories.value[group]?.categories[category]) {
    selectCategory(filteredCategories.value[group].categories[category])
  }
}

const closeDropdown = () => {
  showDropdown.value = false
  isSearching.value = false
  searchQuery.value = displayText.value
  searchInput.value?.blur()
}

// Helper functions
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

const scrollToHighlighted = () => {
  nextTick(() => {
    const { group, category } = highlightedIndex.value
    const element = categoryRefs.value[group]?.[category]
    if (element) {
      element.scrollIntoView({ block: 'nearest' })
    }
  })
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const container = searchInput.value?.closest('.relative')
  if (container && !container.contains(target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Expose focus method for parent components
defineExpose({
  focus: () => {
    searchInput.value?.focus()
    // Manually trigger the focus handler to open dropdown
    handleInputFocus()
  }
})
</script>
