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
        v-if="showDropdown && filteredAccounts.length > 0"
        class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
      >
        <button
          v-for="(account, index) in filteredAccounts"
          :key="account.id"
          :ref="el => setAccountRef(el, index)"
          @click="selectAccount(account)"
          @keydown.enter="selectAccount(account)"
          :class="[
            'w-full px-4 py-2 text-left text-sm focus:outline-none',
            isHighlighted(index)
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          ]"
        >
          {{ account.name }}
        </button>
      </div>

      <!-- Error message -->
      <div v-if="error" class="text-sm text-red-500 mt-1">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { AccountResponse } from '@/types/DTO/account.dto'

interface Props {
  modelValue?: string | null
  availableAccounts: AccountResponse[]
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: '',
  placeholder: 'Select account...',
  error: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'select', account: AccountResponse | null): void
}>()

// Reactive state
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(0)
const accountRefs = ref<(HTMLElement | null)[]>([])
const isProgrammaticFocus = ref(false)

// Filter accounts based on search query
const filteredAccounts = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.availableAccounts
  }

  const query = searchQuery.value.toLowerCase()
  return props.availableAccounts.filter(account =>
    account.name.toLowerCase().includes(query)
  )
})

// Get selected account display text
const displayText = computed(() => {
  if (!props.modelValue) return ''

  const account = props.availableAccounts.find(a => a.id === props.modelValue)
  return account?.name || ''
})

// Watch for external model value changes
watch(() => props.modelValue, () => {
  if (!isSearching.value) {
    searchQuery.value = displayText.value
  }
})

// Initialize display text
onMounted(() => {
  searchQuery.value = displayText.value
})

// Set account ref for keyboard navigation
const setAccountRef = (el: any, index: number) => {
  if (el) {
    accountRefs.value[index] = el
  }
}

// Check if account is highlighted
const isHighlighted = (index: number) => {
  return highlightedIndex.value === index
}

// Scroll to highlighted account
const scrollToHighlighted = () => {
  nextTick(() => {
    const highlightedEl = accountRefs.value[highlightedIndex.value]
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ block: 'nearest' })
    }
  })
}

// Input handlers
const handleInputFocus = () => {
  if (props.disabled) return
  
  if (!isProgrammaticFocus.value) {
    isSearching.value = true
    searchQuery.value = ''
  }
  isProgrammaticFocus.value = false
  showDropdown.value = true
  resetHighlight()
}

const handleInputBlur = () => {
  // Delay to allow click events to fire
  setTimeout(() => {
    showDropdown.value = false
    isSearching.value = false
    searchQuery.value = displayText.value
  }, 200)
}

const handleInput = () => {
  isSearching.value = true
  resetHighlight()
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

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
      selectHighlightedAccount()
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
  }
}

// Close dropdown
const closeDropdown = () => {
  showDropdown.value = false
  isSearching.value = false
  searchQuery.value = displayText.value
  searchInput.value?.blur()
}

// Navigation functions
const navigateDown = () => {
  if (highlightedIndex.value < filteredAccounts.value.length - 1) {
    highlightedIndex.value++
  }
  scrollToHighlighted()
}

const navigateUp = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
  scrollToHighlighted()
}

const resetHighlight = () => {
  highlightedIndex.value = 0
}

const selectAccount = (account: AccountResponse) => {
  emit('update:modelValue', account.id)
  emit('select', account)
  closeDropdown()
}

const selectHighlightedAccount = () => {
  if (filteredAccounts.value[highlightedIndex.value]) {
    selectAccount(filteredAccounts.value[highlightedIndex.value])
  }
}

// Public methods
const focus = () => {
  isProgrammaticFocus.value = true
  searchInput.value?.focus()
}

defineExpose({
  focus
})
</script>

