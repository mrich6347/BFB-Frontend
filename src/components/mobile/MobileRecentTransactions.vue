<template>
  <div class="space-y-3">
    <h3 class="text-sm font-medium text-muted-foreground px-2">Recent Unreconciled</h3>
    
    <div v-if="isLoading" class="text-center py-4 text-sm text-muted-foreground">
      Loading transactions...
    </div>
    
    <div v-else-if="recentTransactions.length === 0" class="text-center py-4 text-sm text-muted-foreground">
      No recent transactions
    </div>
    
    <div v-else class="space-y-2">
      <div
        v-for="transaction in recentTransactions"
        :key="transaction.id"
        @click="$emit('edit', transaction)"
        class="w-full bg-card rounded-lg border border-border active:bg-accent transition-colors"
      >
        <div class="flex items-center gap-3 p-4">
          <!-- Cleared indicator - tap to toggle -->
          <button
            @click.stop="handleToggleCleared(transaction)"
            :disabled="transaction.is_reconciled"
            class="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
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
          </button>

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

// Get recent unreconciled transactions (limit to 5)
const recentTransactions = computed(() => {
  return transactions.value
    .filter(t => !t.is_reconciled)
    .slice(0, 5)
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

onMounted(async () => {
  try {
    await loadTransactionsByAccount(props.accountId)
    // Get transactions from store after loading
    const { useTransactionStore } = await import('@/stores/transaction.store')
    const transactionStore = useTransactionStore()
    transactions.value = transactionStore.getTransactionsByAccount(props.accountId)
  } catch (error) {
    console.error('Failed to load transactions:', error)
  }
})
</script>

