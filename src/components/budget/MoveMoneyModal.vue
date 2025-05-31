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
          />
          <div v-if="amountError" class="text-sm text-red-500">{{ amountError }}</div>
        </div>

        <!-- Destination category dropdown -->
        <div class="space-y-2">
          <label class="text-sm font-medium">To Category</label>
          <select
            v-model="selectedDestinationId"
            class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="">Select a category...</option>
            <optgroup
              v-for="group in groupedCategories"
              :key="group.groupId"
              :label="group.groupName"
            >
              <option
                v-for="category in group.categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </optgroup>
          </select>
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
const amount = ref<number | string>('')
const selectedDestinationId = ref('')
const amountError = ref('')
const destinationError = ref('')

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

// Position the modal near the clicked element
const modalStyle = computed(() => {
  const { x, y } = props.position

  // Calculate position to keep modal on screen
  const modalWidth = 320 // 20rem (w-80)
  const modalHeight = 400 // approximate height
  const padding = 16

  let left = x - modalWidth / 2
  let top = y

  // Keep modal within viewport bounds
  if (left < padding) left = padding
  if (left + modalWidth > window.innerWidth - padding) {
    left = window.innerWidth - modalWidth - padding
  }

  if (top + modalHeight > window.innerHeight - padding) {
    top = y - modalHeight - 16 // Position above the element instead
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
  destinationError.value = ''

  if (!selectedDestinationId.value) {
    destinationError.value = 'Please select a destination category'
    return false
  }

  return true
}

const handleMove = () => {
  if (!validateAmount() || !validateDestination()) return

  const numAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value
  emit('move', selectedDestinationId.value, numAmount)
}

const close = () => {
  emit('close')
}

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    amount.value = ''
    selectedDestinationId.value = ''
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
