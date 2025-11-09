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
        :disabled="disabled"
        class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keydown="handleInputKeydown"
        @input="handleInput"
      />

      <!-- Dropdown -->
      <div
        v-if="showDropdown && (filteredPayees.length > 0 || searchQuery.trim())"
        class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
      >
        <!-- Filtered payees -->
        <button
          v-for="(payee, index) in filteredPayees"
          :key="payee.id"
          :ref="el => setPayeeRef(el, index)"
          @click="selectPayee(payee)"
          @keydown.enter="selectPayee(payee)"
          :class="[
            'w-full px-4 py-2 text-left text-sm focus:outline-none transition-colors',
            isHighlighted(index)
              ? 'bg-accent/50 text-white'
              : 'hover:bg-accent/30'
          ]"
        >
          {{ payee.name }}
        </button>

        <!-- New payee option when typing -->
        <button
          v-if="searchQuery.trim() && !exactMatch"
          :ref="el => setPayeeRef(el, filteredPayees.length)"
          @click="selectNewPayee"
          @keydown.enter="selectNewPayee"
          :class="[
            'w-full px-4 py-2 text-left text-sm focus:outline-none transition-colors border-t border-border',
            isHighlighted(filteredPayees.length)
              ? 'bg-accent/50 text-white'
              : 'hover:bg-accent/30'
          ]"
        >
          <span class="text-muted-foreground">Create: </span>
          <span class="font-medium">{{ searchQuery.trim() }}</span>
        </button>

        <!-- No results message -->
        <div v-if="filteredPayees.length === 0 && !searchQuery.trim()" class="px-3 py-2 text-sm text-muted-foreground">
          Start typing to add a payee
        </div>
      </div>
    </div>
    <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { PayeeResponse } from '@/types/DTO/payee.dto'
import { usePayeeStore } from '@/stores/payee.store'
import { useBudgetStore } from '@/stores/budget.store'

interface Props {
  modelValue?: string | null
  payeeName?: string // The actual payee name to display
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  payeeName: '',
  label: '',
  placeholder: 'Select or add payee...',
  error: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'select', payee: PayeeResponse | null, payeeName: string): void
}>()

const payeeStore = usePayeeStore()
const budgetStore = useBudgetStore()

// Reactive state
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(-999)
const payeeRefs = ref<(HTMLElement | null)[]>([])

// Get payees for current budget, excluding transfer payees
const availablePayees = computed(() => {
  const budgetId = budgetStore.currentBudget?.id
  if (!budgetId) return []
  
  return payeeStore.getPayeesForBudget(budgetId)
    .filter(payee => !payee.is_transfer) // Exclude transfer payees
})

// Filter payees based on search query
const filteredPayees = computed(() => {
  if (!searchQuery.value.trim()) {
    return availablePayees.value
  }

  const query = searchQuery.value.toLowerCase()
  return availablePayees.value.filter(payee =>
    payee.name.toLowerCase().includes(query)
  )
})

// Check if there's an exact match
const exactMatch = computed(() => {
  if (!searchQuery.value.trim()) return false
  const query = searchQuery.value.trim().toLowerCase()
  return filteredPayees.value.some(payee => payee.name.toLowerCase() === query)
})

// Get selected payee display text
const displayText = computed(() => {
  // First try to use the payeeName prop (for new payees or when explicitly set)
  if (props.payeeName) return props.payeeName

  // Otherwise try to find by ID
  if (!props.modelValue) return ''

  const payee = availablePayees.value.find(p => p.id === props.modelValue)
  return payee?.name || ''
})

// Watch for external model value or payeeName changes
watch(() => [props.modelValue, props.payeeName], () => {
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

  // Keep dropdown open even if blur happens
  setTimeout(() => {
    if (isSearching.value) {
      showDropdown.value = true
    }
  }, 50)
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
    // Only close if we're not actively searching
    if (!isSearching.value) {
      showDropdown.value = false
      searchQuery.value = displayText.value
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
      selectHighlightedPayee()
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
  }
}

// Navigation functions
const navigateDown = () => {
  const totalItems = filteredPayees.value.length + (searchQuery.value.trim() && !exactMatch.value ? 1 : 0)
  
  if (highlightedIndex.value < totalItems - 1) {
    highlightedIndex.value++
  } else {
    highlightedIndex.value = 0
  }
  
  scrollToHighlighted()
}

const navigateUp = () => {
  const totalItems = filteredPayees.value.length + (searchQuery.value.trim() && !exactMatch.value ? 1 : 0)
  
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  } else {
    highlightedIndex.value = totalItems - 1
  }
  
  scrollToHighlighted()
}

const resetHighlight = () => {
  // Start with first item highlighted
  highlightedIndex.value = 0
}

const selectPayee = (payee: PayeeResponse) => {
  emit('update:modelValue', payee.id)
  emit('select', payee, payee.name)
  closeDropdown()
}

const selectNewPayee = () => {
  const payeeName = searchQuery.value.trim()
  emit('update:modelValue', null) // No ID yet for new payee
  emit('select', null, payeeName)
  closeDropdown()
}

const selectHighlightedPayee = () => {
  // If nothing is highlighted or highlight is invalid, select first item
  if (highlightedIndex.value === -999 || highlightedIndex.value < 0) {
    if (filteredPayees.value.length > 0) {
      selectPayee(filteredPayees.value[0])
    } else if (searchQuery.value.trim()) {
      selectNewPayee()
    }
    return
  }

  // Select highlighted payee
  if (highlightedIndex.value < filteredPayees.value.length) {
    selectPayee(filteredPayees.value[highlightedIndex.value])
  }
  // Select new payee option
  else if (searchQuery.value.trim() && !exactMatch.value) {
    selectNewPayee()
  }
}

const closeDropdown = () => {
  showDropdown.value = false
  isSearching.value = false
  searchQuery.value = displayText.value
  searchInput.value?.blur()
}

// Helper functions
const setPayeeRef = (el: HTMLElement | null, index: number) => {
  if (el) {
    payeeRefs.value[index] = el
  }
}

const isHighlighted = (index: number) => {
  return highlightedIndex.value === index
}

const scrollToHighlighted = () => {
  nextTick(() => {
    const element = payeeRefs.value[highlightedIndex.value]
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
    if (searchInput.value) {
      // Directly set the state to open
      isSearching.value = true
      showDropdown.value = true
      searchQuery.value = ''
      resetHighlight()

      // Then focus the input
      searchInput.value.focus()
    }
  }
})
</script>

