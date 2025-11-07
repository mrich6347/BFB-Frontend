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
        <CategorySelector
          ref="categorySelector"
          v-model="selectedCategoryId"
          :available-categories="availableCategories"
          label="Category"
          placeholder="Select category..."
          :error="categoryError"
          @select="handleCategorySelect"
        />

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
import { ref, computed, watch, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import CategorySelector from '@/components/categories/CategorySelector.vue'

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
const selectedCategoryId = ref<string | null>(null)
const selectedCategory = ref<CategoryResponse | null>(null)
const hasInteracted = ref(false)
const amountError = ref('')
const categoryError = ref('')

// Refs
const amountInput = ref<HTMLInputElement>()
const assignButton = ref<HTMLButtonElement>()
const categorySelector = ref()

// Computed properties
const canAssign = computed(() => {
  const numAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value
  return (
    numAmount > 0 &&
    numAmount <= props.maxAmount &&
    selectedCategoryId.value &&
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
    position: 'fixed' as const
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

  if (!selectedCategoryId.value) {
    categoryError.value = 'Please select a category'
    return false
  }

  return true
}

// Category selection handler
const handleCategorySelect = (category: CategoryResponse | null) => {
  selectedCategory.value = category
  hasInteracted.value = true
  validateCategory()

  // Focus assign button after selection
  nextTick(() => {
    assignButton.value?.focus()
  })
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

  emit('assign', selectedCategoryId.value!, numAmount)
}



// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Reset form when modal opens
    amount.value = ''
    selectedCategoryId.value = null
    selectedCategory.value = null
    hasInteracted.value = false
    amountError.value = ''
    categoryError.value = ''

    // Focus amount input
    nextTick(() => {
      amountInput.value?.focus()
    })
  }
})

watch([amount], () => {
  validateAmount()
})

watch([selectedCategoryId], () => {
  validateCategory()
})


</script>
