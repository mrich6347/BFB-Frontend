import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { ScheduledTransactionResponse } from '@/types/DTO/scheduled-transaction.dto'

export const useScheduledTransactionStore = defineStore('scheduledTransactionStore', () => {
  // State
  const scheduledTransactions = ref<ScheduledTransactionResponse[]>([])

  // Helper function to calculate next date for a scheduled transaction
  const calculateNextDate = (transaction: ScheduledTransactionResponse): Date => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    let nextDate: Date

    if (transaction.frequency === 'ONCE') {
      if (!transaction.specific_date) return new Date(9999, 11, 31) // Far future if no date
      nextDate = new Date(transaction.specific_date)
    } else if (transaction.frequency === 'MONTHLY') {
      nextDate = new Date(year, month, transaction.day_of_month || 1)
      if (nextDate < today) {
        nextDate = new Date(year, month + 1, transaction.day_of_month || 1)
      }
    } else if (transaction.frequency === 'YEARLY') {
      nextDate = new Date(year, (transaction.month_of_year || 1) - 1, transaction.day_of_month || 1)
      if (nextDate < today) {
        nextDate = new Date(year + 1, (transaction.month_of_year || 1) - 1, transaction.day_of_month || 1)
      }
    } else if (transaction.frequency === 'WEEKLY' || transaction.frequency === 'BIWEEKLY') {
      const currentDay = today.getDay()
      const targetDay = transaction.day_of_week || 0
      let daysUntil = targetDay - currentDay
      if (daysUntil < 0) daysUntil += 7
      nextDate = new Date(today)
      nextDate.setDate(today.getDate() + daysUntil)
    } else {
      return new Date(9999, 11, 31) // Far future for unknown frequency
    }

    return nextDate
  }

  // Getters
  const getScheduledTransactionsByAccount = computed(() => (accountId: string) => {
    const filtered = scheduledTransactions.value.filter(st => st.account_id === accountId)

    // Sort by next date (soonest first)
    return filtered.sort((a, b) => {
      const dateA = calculateNextDate(a)
      const dateB = calculateNextDate(b)
      return dateA.getTime() - dateB.getTime()
    })
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

