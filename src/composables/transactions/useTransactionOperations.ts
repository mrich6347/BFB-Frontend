import { ref, readonly } from 'vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useBudgetStore } from '@/stores/budget.store'
import { useUpdateAccountBalance } from '@/composables/accounts/account-write/useUpdateAccountBalance'
import { useSetAccountBalance } from '@/composables/accounts/account-write/useSetAccountBalance'
import { useUpdateAccountBalanceOnClearedToggle } from '@/composables/accounts/account-write/useUpdateAccountBalanceOnClearedToggle'
import { useRemoveAccountBalance } from '@/composables/accounts/account-write/useRemoveAccountBalance'
import { useFetchCategoryBalances } from '@/composables/categories/category-read/useFetchCategoryBalances'
import { TransactionService } from '@/services/transaction.service'
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponse
} from '@/types/DTO/transaction.dto'

export const useTransactionOperations = () => {
  const transactionStore = useTransactionStore()
  const budgetStore = useBudgetStore()
  const { updateAccountBalance } = useUpdateAccountBalance()
  const { setAccountBalance } = useSetAccountBalance()
  const { updateAccountBalanceOnClearedToggle } = useUpdateAccountBalanceOnClearedToggle()
  const { removeAccountBalance } = useRemoveAccountBalance()
  const { fetchCategoryBalances } = useFetchCategoryBalances()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadTransactionsByAccount = async (accountId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const transactions = await TransactionService.getTransactionsByAccount(accountId)
      transactionStore.setTransactions(transactions)
      transactionStore.setCurrentAccountId(accountId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load transactions'
      console.error('Error loading transactions:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createTransaction = async (transactionData: CreateTransactionDto) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await TransactionService.createTransaction(transactionData)

      // Handle both regular transactions and transfer transactions
      let newTransaction: TransactionResponse
      if ('transaction' in result) {
        // Transfer transaction - update both account balances using returned data
        newTransaction = result.transaction

        // Update source account balance with actual returned data
        if (result.sourceAccount) {
          setAccountBalance(result.sourceAccount.id, result.sourceAccount)
        }

        // Update target account balance with actual returned data
        if (result.targetAccount) {
          setAccountBalance(result.targetAccount.id, result.targetAccount)
        }
      } else {
        // Regular transaction
        newTransaction = result

        // Update account balance
        updateAccountBalance(
          newTransaction.account_id,
          newTransaction.amount,
          newTransaction.is_cleared
        )
      }

      transactionStore.addTransaction(newTransaction)
      return newTransaction
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create transaction'
      console.error('Error creating transaction:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateTransaction = async (id: string, transactionData: UpdateTransactionDto) => {
    isLoading.value = true
    error.value = null

    const originalTransaction = transactionStore.getTransactionById(id)
    if (!originalTransaction) {
      error.value = 'Transaction not found'
      throw new Error('Transaction not found')
    }

    try {
      const result = await TransactionService.updateTransaction(id, transactionData)

      // Handle both regular transactions and transfer transactions
      let updatedTransaction: TransactionResponse
      if ('transaction' in result) {
        // Transfer transaction - update both account balances using returned data
        updatedTransaction = result.transaction

        // Update source account balance with actual returned data
        if (result.sourceAccount) {
          setAccountBalance(result.sourceAccount.id, result.sourceAccount)
        }

        // Update target account balance with actual returned data
        if (result.targetAccount) {
          setAccountBalance(result.targetAccount.id, result.targetAccount)
        }
      } else {
        // Regular transaction
        updatedTransaction = result

        // Remove the old transaction's effect on account balance
        removeAccountBalance(
          originalTransaction.account_id,
          originalTransaction.amount,
          originalTransaction.is_cleared
        )

        // Add the new transaction's effect on account balance
        updateAccountBalance(
          updatedTransaction.account_id,
          updatedTransaction.amount,
          updatedTransaction.is_cleared
        )
      }

      transactionStore.updateTransaction(id, updatedTransaction)
      return updatedTransaction
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update transaction'
      console.error('Error updating transaction:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const toggleCleared = async (id: string) => {
    isLoading.value = true
    error.value = null

    const originalTransaction = transactionStore.getTransactionById(id)
    if (!originalTransaction) {
      error.value = 'Transaction not found'
      throw new Error('Transaction not found')
    }

    const newClearedStatus = !originalTransaction.is_cleared

    try {
      const updatedTransaction = await TransactionService.toggleCleared(id)

      // Update account balance based on cleared status change
      updateAccountBalanceOnClearedToggle(
        originalTransaction.account_id,
        originalTransaction.amount,
        newClearedStatus
      )

      // Update transaction in store with server response
      transactionStore.updateTransaction(id, updatedTransaction)
      return updatedTransaction
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to toggle cleared status'
      console.error('Error toggling cleared status:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteTransaction = async (id: string) => {
    isLoading.value = true
    error.value = null

    const transactionToDelete = transactionStore.getTransactionById(id)
    if (!transactionToDelete) {
      error.value = 'Transaction not found'
      throw new Error('Transaction not found')
    }

    try {
      const result = await TransactionService.deleteTransaction(id)

      // Remove transaction from store
      transactionStore.removeTransaction(id)

      // Handle account balance updates
      if (result && typeof result === 'object' && ('sourceAccount' in result || 'targetAccount' in result)) {
        // Transfer transaction - update both account balances using returned data
        if (result.sourceAccount) {
          setAccountBalance(result.sourceAccount.id, result.sourceAccount)
        }

        if (result.targetAccount) {
          setAccountBalance(result.targetAccount.id, result.targetAccount)
        }
      } else {
        // Regular transaction
        // Update account balance by removing the deleted transaction's effect
        removeAccountBalance(
          transactionToDelete.account_id,
          transactionToDelete.amount,
          transactionToDelete.is_cleared
        )
      }

      // Refresh category balances to reflect any credit card debt reversals
      if (budgetStore.currentBudget?.id) {
        // Small delay to ensure backend processing is complete
        await new Promise(resolve => setTimeout(resolve, 100))
        await fetchCategoryBalances(budgetStore.currentBudget.id)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete transaction'
      console.error('Error deleting transaction:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setTransactions = (transactions: TransactionResponse[]) => {
    transactionStore.setTransactions(transactions)
  }

  const setCurrentAccountId = (accountId: string | null) => {
    transactionStore.setCurrentAccountId(accountId)
  }

  const resetTransactionData = () => {
    transactionStore.reset()
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),

    // CRUD Operations
    loadTransactionsByAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,

    // Transaction-specific operations
    toggleCleared,

    // Utility operations
    setTransactions,
    setCurrentAccountId,
    resetTransactionData,
    setLoading
  }
}
