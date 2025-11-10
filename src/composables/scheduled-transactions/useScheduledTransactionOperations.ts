import { ref, readonly } from 'vue'
import { useScheduledTransactionStore } from '@/stores/scheduled-transaction.store'
import { scheduledTransactionService } from '@/services/scheduled-transaction.service'
import type { CreateScheduledTransactionDto, UpdateScheduledTransactionDto } from '@/types/DTO/scheduled-transaction.dto'

export const useScheduledTransactionOperations = () => {
  const scheduledTransactionStore = useScheduledTransactionStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadScheduledTransactionsByBudget = async (budgetId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const scheduledTransactions = await scheduledTransactionService.findAllByBudget(budgetId)
      scheduledTransactionStore.setScheduledTransactions(scheduledTransactions)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load scheduled transactions'
      console.error('Error loading scheduled transactions:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadScheduledTransactionsByAccount = async (accountId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const scheduledTransactions = await scheduledTransactionService.findAllByAccount(accountId)
      scheduledTransactionStore.setScheduledTransactions(scheduledTransactions)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load scheduled transactions'
      console.error('Error loading scheduled transactions:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createScheduledTransaction = async (data: CreateScheduledTransactionDto) => {
    error.value = null

    try {
      const newScheduledTransaction = await scheduledTransactionService.create(data)
      scheduledTransactionStore.addScheduledTransaction(newScheduledTransaction)
      return newScheduledTransaction
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create scheduled transaction'
      console.error('Error creating scheduled transaction:', err)
      throw err
    }
  }

  const updateScheduledTransaction = async (id: string, data: UpdateScheduledTransactionDto) => {
    error.value = null

    try {
      const updatedScheduledTransaction = await scheduledTransactionService.update(id, data)
      scheduledTransactionStore.updateScheduledTransaction(id, updatedScheduledTransaction)
      return updatedScheduledTransaction
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update scheduled transaction'
      console.error('Error updating scheduled transaction:', err)
      throw err
    }
  }

  const deleteScheduledTransaction = async (id: string) => {
    error.value = null

    try {
      await scheduledTransactionService.remove(id)
      scheduledTransactionStore.removeScheduledTransaction(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete scheduled transaction'
      console.error('Error deleting scheduled transaction:', err)
      throw err
    }
  }

  const bulkDeleteScheduledTransactions = async (ids: string[]) => {
    error.value = null

    try {
      await Promise.all(ids.map(id => scheduledTransactionService.remove(id)))
      ids.forEach(id => scheduledTransactionStore.removeScheduledTransaction(id))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete scheduled transactions'
      console.error('Error deleting scheduled transactions:', err)
      throw err
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),

    // CRUD Operations
    loadScheduledTransactionsByBudget,
    loadScheduledTransactionsByAccount,
    createScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
    bulkDeleteScheduledTransactions
  }
}

