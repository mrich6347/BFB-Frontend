<template>
  <div class="flex flex-col" @click="closeAllSwipes">
    <h3 class="text-sm font-medium text-muted-foreground px-2 mb-3">Recent Unreconciled</h3>

    <div v-if="isLoading" class="text-center py-4 text-sm text-muted-foreground">
      Loading transactions...
    </div>

    <div v-else-if="recentTransactions.length === 0" class="text-center py-4 text-sm text-muted-foreground">
      No recent transactions
    </div>

    <div v-else class="overflow-y-auto max-h-[400px] space-y-2 pr-1">
      <div
        v-for="transaction in recentTransactions"
        :key="transaction.id"
        class="relative overflow-hidden rounded-lg"
      >
        <!-- Edit button (revealed on swipe) -->
        <div class="absolute inset-y-0 right-0 flex items-center">
          <button
            @click.stop="handleEdit(transaction)"
            class="h-full px-6 bg-blue-500 text-white font-medium flex items-center justify-center"
          >
            Edit
          </button>
        </div>

        <!-- Swipeable transaction content -->
        <div
          :ref="el => setTransactionRef(transaction.id, el)"
          class="w-full bg-card border border-border touch-pan-y"
          :class="{ 'transition-transform duration-200 ease-out': !isSwiping(transaction.id) }"
          :style="{ transform: `translateX(${getSwipeOffset(transaction.id)}px)` }"
          @touchstart="handleTouchStart($event, transaction.id)"
          @touchmove="handleTouchMove($event, transaction.id)"
          @touchend="handleTouchEnd(transaction.id)"
          @click.stop="handleTransactionClick(transaction)"
        >
          <div class="flex items-center gap-3 p-4">
            <!-- Cleared indicator -->
            <div
              class="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
              :class="transaction.is_cleared
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-gray-300 dark:border-gray-600'"
            >
              <svg
                v-if="transaction.is_cleared"
                class="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <!-- Transaction details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline justify-between gap-2 mb-1">
                <span class="text-sm font-medium text-foreground truncate">
                  {{ transaction.payee || getCategoryName(transaction.category_id) }}
                </span>
                <span
                  class="text-sm font-semibold whitespace-nowrap flex-shrink-0"
                  :class="getAmountColorClass(transaction.amount)"
                >
                  {{ formatCurrency(Math.abs(transaction.amount)) }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-muted-foreground truncate">
                  {{ getCategoryName(transaction.category_id) }}
                </span>
                <span class="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {{ formatDate(transaction.date) }}
                </span>
              </div>
              <div v-if="transaction.memo" class="text-xs text-muted-foreground truncate mt-1">
                {{ transaction.memo }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import { formatCurrency } from '@/utils/currencyUtil'
import type { TransactionResponse } from '@/types/DTO/transaction.dto'

const props = defineProps<{
  accountId: string
}>()

const emit = defineEmits<{
  edit: [transaction: TransactionResponse]
  delete: [transactionId: string]
}>()

const categoryStore = useCategoryStore()
const { loadTransactionsByAccount, toggleCleared, isLoading } = useTransactionOperations()
const transactions = ref<TransactionResponse[]>([])

// Get all unreconciled transactions
const recentTransactions = computed(() => {
  return transactions.value
    .filter(t => !t.is_reconciled)
})

const getCategoryName = (categoryId?: string) => {
  if (!categoryId) return 'Uncategorized'
  if (categoryId === 'ready-to-assign') return 'Ready to Assign'

  const category = categoryStore.categories.find(c => c.id === categoryId)
  return category?.name || 'Unknown'
}

const getAmountColorClass = (amount: number) => {
  if (amount > 0) {
    return 'text-emerald-600 dark:text-emerald-400'
  } else if (amount < 0) {
    return 'text-red-600 dark:text-red-400'
  }
  return 'text-muted-foreground'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Reset time parts for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today'
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

// Swipe state management
const swipeStates = ref<Record<string, { offset: number, startX: number, startTime: number, isSwiping: boolean }>>({})
const transactionRefs = ref<Record<string, HTMLElement>>({})
const SWIPE_THRESHOLD = -80 // How far to swipe to reveal edit button
const SWIPE_VELOCITY_THRESHOLD = 0.3 // Minimum velocity to trigger swipe

const setTransactionRef = (id: string, el: any) => {
  if (el) {
    transactionRefs.value[id] = el
  }
}

const getSwipeOffset = (id: string) => {
  return swipeStates.value[id]?.offset || 0
}

const isSwiping = (id: string) => {
  return swipeStates.value[id]?.isSwiping || false
}

const closeAllSwipes = () => {
  // Close all open swipes
  Object.keys(swipeStates.value).forEach(id => {
    if (swipeStates.value[id]?.offset !== 0) {
      swipeStates.value[id] = {
        ...swipeStates.value[id],
        offset: 0,
        isSwiping: false
      }
    }
  })
}

const closeOtherSwipes = (currentId: string) => {
  // Close all swipes except the current one
  Object.keys(swipeStates.value).forEach(id => {
    if (id !== currentId && swipeStates.value[id]?.offset !== 0) {
      swipeStates.value[id] = {
        ...swipeStates.value[id],
        offset: 0,
        isSwiping: false
      }
    }
  })
}

const handleTouchStart = (event: TouchEvent, id: string) => {
  // Close other open swipes when starting a new swipe
  closeOtherSwipes(id)

  const touch = event.touches[0]
  swipeStates.value[id] = {
    offset: swipeStates.value[id]?.offset || 0,
    startX: touch.clientX,
    startTime: Date.now(),
    isSwiping: true
  }
}

const handleTouchMove = (event: TouchEvent, id: string) => {
  const state = swipeStates.value[id]
  if (!state) return

  const touch = event.touches[0]
  const deltaX = touch.clientX - state.startX
  const currentOffset = state.offset || 0

  // Only allow swiping left (negative direction)
  const newOffset = Math.min(0, Math.max(SWIPE_THRESHOLD, currentOffset + deltaX))

  swipeStates.value[id] = {
    ...state,
    offset: newOffset,
    startX: touch.clientX,
    isSwiping: true
  }
}

const handleTouchEnd = (id: string) => {
  const state = swipeStates.value[id]
  if (!state) return

  const duration = Date.now() - state.startTime
  const distance = state.offset
  const velocity = Math.abs(distance) / duration

  // Snap to open or closed based on threshold or velocity
  if (state.offset < SWIPE_THRESHOLD / 2 || velocity > SWIPE_VELOCITY_THRESHOLD) {
    // Snap to open (reveal edit button)
    swipeStates.value[id] = { ...state, offset: SWIPE_THRESHOLD, isSwiping: false }
  } else {
    // Snap to closed
    swipeStates.value[id] = { ...state, offset: 0, isSwiping: false }
  }
}

const handleTransactionClick = (transaction: TransactionResponse) => {
  // If the transaction is swiped open, close it instead of toggling cleared
  if (swipeStates.value[transaction.id]?.offset !== 0) {
    swipeStates.value[transaction.id] = {
      ...swipeStates.value[transaction.id],
      offset: 0,
      isSwiping: false
    }
    return
  }

  // Otherwise, toggle cleared status
  handleToggleCleared(transaction)
}

const handleEdit = (transaction: TransactionResponse) => {
  // Close the swipe
  swipeStates.value[transaction.id] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }
  // Emit edit event
  emit('edit', transaction)
}

const handleToggleCleared = async (transaction: TransactionResponse) => {
  // Prevent toggling cleared status on reconciled transactions
  if (transaction.is_reconciled) {
    return
  }

  // Optimistically update the UI immediately
  const originalClearedStatus = transaction.is_cleared
  const newClearedStatus = !originalClearedStatus

  // Update local state instantly
  const index = transactions.value.findIndex(t => t.id === transaction.id)
  if (index !== -1) {
    transactions.value[index] = {
      ...transactions.value[index],
      is_cleared: newClearedStatus
    }
  }

  try {
    // Then sync with server in the background
    await toggleCleared(transaction.id)
  } catch (error) {
    console.error('Failed to toggle cleared status:', error)
    // Rollback on error
    if (index !== -1) {
      transactions.value[index] = {
        ...transactions.value[index],
        is_cleared: originalClearedStatus
      }
    }
  }
}

const loadTransactions = async () => {
  try {
    await loadTransactionsByAccount(props.accountId)
    // Get transactions from store after loading
    const { useTransactionStore } = await import('@/stores/transaction.store')
    const transactionStore = useTransactionStore()
    transactions.value = transactionStore.getTransactionsByAccount(props.accountId)
  } catch (error) {
    console.error('Failed to load transactions:', error)
  }
}

onMounted(async () => {
  await loadTransactions()
})

// Expose loadTransactions so parent can refresh the list
defineExpose({
  loadTransactions
})
</script>

