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
        <CategorySelector
          ref="categorySelector"
          v-model="selectedSourceId"
          :available-categories="availableCategories"
          label="Pull From Category"
          placeholder="Select category..."
          :include-ready-to-assign="budgetStore.readyToAssign > 0"
          :error="sourceError"
          @select="handleSourceSelect"
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
import { ref, computed, watch, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import { useBudgetStore } from '@/stores/budget.store'
import CategorySelector from '@/components/shared/CategorySelector.vue'

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

const budgetStore = useBudgetStore()

// Form state
const selectedSourceId = ref('')
const hasInteracted = ref(false)

// Special ID for Ready to Assign option
const READY_TO_ASSIGN_ID = 'ready-to-assign'

// Error states
const sourceError = ref('')

// Refs
const pullButton = ref<HTMLButtonElement>()
const categorySelector = ref()

// Computed properties
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

// Source selection handler
const handleSourceSelect = (category: CategoryResponse | null) => {
  hasInteracted.value = true
  validateSource()

  // Focus pull button after selection
  nextTick(() => {
    pullButton.value?.focus()
  })
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



const close = () => {
  emit('close')
}

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedSourceId.value = ''
    hasInteracted.value = false
    sourceError.value = ''

    // Focus the category selector and trigger dropdown opening with a small delay
    nextTick(() => {
      setTimeout(() => {
        categorySelector.value?.focus()
      }, 50)
    })
  }
})

// Watch for validation
watch(selectedSourceId, () => {
  if (hasInteracted.value) {
    validateSource()
  }
})
</script>
