import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { TransactionResponse } from '@/types/DTO/transaction.dto'

export const useTransactionStore = defineStore('transactionStore', () => {
  // State
  const transactions = ref<TransactionResponse[]>([])
  const currentAccountId = ref<string | null>(null)

  // Getters
  const getTransactionsByAccount = computed(() => (accountId: string) => {
    return transactions.value.filter(transaction => transaction.account_id === accountId)
  })

  const getTransactionById = computed(() => (id: string) => {
    return transactions.value.find(transaction => transaction.id === id)
  })

  const getClearedTransactions = computed(() => {
    return transactions.value.filter(transaction => transaction.is_cleared)
  })

  const getUnclearedTransactions = computed(() => {
    return transactions.value.filter(transaction => !transaction.is_cleared)
  })

  // State mutations
  const setTransactions = (newTransactions: TransactionResponse[]) => {
    transactions.value = newTransactions
  }

  const setCurrentAccountId = (accountId: string | null) => {
    currentAccountId.value = accountId
  }

  const addTransaction = (transaction: TransactionResponse) => {
    transactions.value.unshift(transaction) // Add to beginning of array
  }

  const updateTransaction = (id: string, updates: Partial<TransactionResponse>) => {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value[index] = { ...transactions.value[index], ...updates }
    }
  }

  const removeTransaction = (id: string) => {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value.splice(index, 1)
    }
  }


  const reset = () => {
    transactions.value = []
    currentAccountId.value = null
  }

  return {
    // State (readonly)
    transactions: readonly(transactions),
    currentAccountId: readonly(currentAccountId),

    // Getters
    getTransactionsByAccount,
    getTransactionById,
    getClearedTransactions,
    getUnclearedTransactions,

    // Mutations
    setTransactions,
    setCurrentAccountId,
    addTransaction,
    updateTransaction,
    removeTransaction,
    reset
  }
})
