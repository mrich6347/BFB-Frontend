import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { ScheduledTransactionResponse } from '@/types/DTO/scheduled-transaction.dto'

export const useScheduledTransactionStore = defineStore('scheduledTransactionStore', () => {
  // State
  const scheduledTransactions = ref<ScheduledTransactionResponse[]>([])

  // Getters
  const getScheduledTransactionsByAccount = computed(() => (accountId: string) => {
    return scheduledTransactions.value.filter(st => st.account_id === accountId)
  })

  const getScheduledTransactionById = computed(() => (id: string) => {
    return scheduledTransactions.value.find(st => st.id === id)
  })

  const getActiveScheduledTransactions = computed(() => {
    return scheduledTransactions.value.filter(st => st.is_active)
  })

  // State mutations
  const setScheduledTransactions = (newScheduledTransactions: ScheduledTransactionResponse[]) => {
    scheduledTransactions.value = newScheduledTransactions
  }

  const addScheduledTransaction = (scheduledTransaction: ScheduledTransactionResponse) => {
    scheduledTransactions.value.push(scheduledTransaction)
  }

  const updateScheduledTransaction = (id: string, updates: Partial<ScheduledTransactionResponse>) => {
    const index = scheduledTransactions.value.findIndex(st => st.id === id)
    if (index !== -1) {
      scheduledTransactions.value[index] = { ...scheduledTransactions.value[index], ...updates }
    }
  }

  const removeScheduledTransaction = (id: string) => {
    const index = scheduledTransactions.value.findIndex(st => st.id === id)
    if (index !== -1) {
      scheduledTransactions.value.splice(index, 1)
    }
  }

  const reset = () => {
    scheduledTransactions.value = []
  }

  return {
    // State (readonly)
    scheduledTransactions: readonly(scheduledTransactions),

    // Getters
    getScheduledTransactionsByAccount,
    getScheduledTransactionById,
    getActiveScheduledTransactions,

    // Mutations
    setScheduledTransactions,
    addScheduledTransaction,
    updateScheduledTransaction,
    removeScheduledTransaction,
    reset
  }
})

