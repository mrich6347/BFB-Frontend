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
      <button
        v-for="transaction in recentTransactions"
        :key="transaction.id"
        @click="$emit('edit', transaction)"
        class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium truncate">
                {{ getCategoryName(transaction.category_id) }}
              </span>
              <span
                v-if="transaction.is_cleared"
                class="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded"
              >
                C
              </span>
            </div>
            <div v-if="transaction.memo" class="text-xs text-muted-foreground truncate mt-0.5">
              {{ transaction.memo }}
            </div>
            <div class="text-xs text-muted-foreground mt-0.5">
              {{ formatDate(transaction.date) }}
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span
              class="text-sm font-semibold whitespace-nowrap"
              :class="getAmountColorClass(transaction.amount)"
            >
              {{ formatCurrency(Math.abs(transaction.amount)) }}
            </span>
          </div>
        </div>
      </button>
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
const { loadTransactionsByAccount, isLoading } = useTransactionOperations()
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

