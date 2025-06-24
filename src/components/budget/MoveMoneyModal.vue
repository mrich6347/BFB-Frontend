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
        <CategorySelector
          v-model="selectedDestinationId"
          :available-categories="availableCategories"
          label="To Category"
          placeholder="Search categories..."
          :include-ready-to-assign="true"
          :error="destinationError"
          @select="handleDestinationSelect"
        />

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
import { ref, computed, watch, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import CategorySelector from '@/components/categories/CategorySelector.vue'

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
  (e: 'moveToReadyToAssign', amount: number): void
}>()

const amountInput = ref<HTMLInputElement>()
const moveButton = ref<HTMLButtonElement>()
const amount = ref<number | string>('')
const selectedDestinationId = ref('')
const amountError = ref('')
const destinationError = ref('')
const hasInteracted = ref(false)

// Destination selection handler
const handleDestinationSelect = (category: CategoryResponse | null) => {
  hasInteracted.value = true
  validateDestination()

  // Focus move button after selection
  nextTick(() => {
    moveButton.value?.focus()
  })
}

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
    position: 'fixed' as const,
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

  // Check if moving to Ready to Assign
  if (selectedDestinationId.value === 'ready-to-assign') {
    emit('moveToReadyToAssign', numAmount)
  } else {
    emit('move', selectedDestinationId.value, numAmount)
  }
}



const close = () => {
  emit('close')
}

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    amount.value = ''
    selectedDestinationId.value = ''
    hasInteracted.value = false
    amountError.value = ''
    destinationError.value = ''

    // Focus the amount input
    nextTick(() => {
      amountInput.value?.focus()
    })
  }
})

// Validate on input changes
watch(amount, validateAmount)
watch(selectedDestinationId, validateDestination)
</script>
