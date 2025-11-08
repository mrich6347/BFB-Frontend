import { ref, readonly } from 'vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { useAccountStore } from '@/stores/account.store'
import { useUpdateAccountBalance } from '@/composables/accounts/account-write/useUpdateAccountBalance'
import { useSetAccountBalance } from '@/composables/accounts/account-write/useSetAccountBalance'
import { useUpdateAccountBalanceOnClearedToggle } from '@/composables/accounts/account-write/useUpdateAccountBalanceOnClearedToggle'
import { useRemoveAccountBalance } from '@/composables/accounts/account-write/useRemoveAccountBalance'
import { useFetchCategoryBalances } from '@/composables/categories/category-read/useFetchCategoryBalances'
import { TransactionService } from '@/services/transaction.service'
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponse,
} from '@/types/DTO/transaction.dto'

export const useTransactionOperations = () => {
  const transactionStore = useTransactionStore()
  const budgetStore = useBudgetStore()
  const categoryStore = useCategoryStore()
  const accountStore = useAccountStore()
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

      // Update ready to assign value from server response
      budgetStore.setReadyToAssign(result.readyToAssign)

      // Update category balance(s) if provided
      if (result.categoryBalances && result.categoryBalances.length > 0) {
        // Use the new categoryBalances array
        result.categoryBalances.forEach((balance) => {
          categoryStore.updateCategoryBalance(balance.category_id, balance)
        })
      } else if (result.categoryBalance) {
        // Fall back to legacy categoryBalance for backward compatibility
        categoryStore.updateCategoryBalance(result.categoryBalance.category_id, result.categoryBalance)
      }

      // Handle both regular transactions and transfer transactions
      let newTransaction: TransactionResponse
      if ('sourceAccount' in result && 'targetAccount' in result) {
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
        newTransaction = result.transaction

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

      // Update ready to assign value from server response
      budgetStore.setReadyToAssign(result.readyToAssign)

      // Update category balance(s) if provided
      if (result.categoryBalances && result.categoryBalances.length > 0) {
        // Use the new categoryBalances array
        result.categoryBalances.forEach((balance) => {
          categoryStore.updateCategoryBalance(balance.category_id, balance)
        })
      } else if (result.categoryBalance) {
        // Fall back to legacy categoryBalance for backward compatibility
        categoryStore.updateCategoryBalance(result.categoryBalance.category_id, result.categoryBalance)
      }

      // Handle both regular transactions and transfer transactions
      let updatedTransaction: TransactionResponse
      if ('sourceAccount' in result && 'targetAccount' in result) {
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
        updatedTransaction = result.transaction

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

    const transactionSnapshot = { ...originalTransaction }
    const newClearedStatus = !originalTransaction.is_cleared

    // Optimistically update transaction and account balances
    transactionStore.updateTransaction(id, { is_cleared: newClearedStatus })
    updateAccountBalanceOnClearedToggle(
      originalTransaction.account_id,
      originalTransaction.amount,
      newClearedStatus
    )

    try {
      const updatedTransaction = await TransactionService.toggleCleared(id)

      // Update transaction in store with server response
      transactionStore.updateTransaction(id, updatedTransaction)
      return updatedTransaction
    } catch (err) {
      // Roll back optimistic updates on failure
      transactionStore.updateTransaction(id, transactionSnapshot)
      updateAccountBalanceOnClearedToggle(
        originalTransaction.account_id,
        originalTransaction.amount,
        transactionSnapshot.is_cleared
      )

      error.value = err instanceof Error ? err.message : 'Failed to toggle cleared status'
      console.error('Error toggling cleared status:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const bulkDeleteTransactions = async (transactionIds: string[]) => {
    if (!transactionIds || transactionIds.length === 0) {
      return
    }

    // IMPORTANT: Don't set isLoading - we want instant UI feedback with optimistic updates
    // The UI should not show any loading state during bulk delete

    // Store snapshots for rollback in case of error
    const transactionSnapshots = transactionIds
      .map(id => transactionStore.getTransactionById(id))
      .filter(t => t !== undefined) as TransactionResponse[]

    // Calculate optimistic balance changes grouped by account
    const balanceChangesByAccount = new Map<string, { clearedDelta: number; unclearedDelta: number }>()

    transactionSnapshots.forEach(transaction => {
      if (!balanceChangesByAccount.has(transaction.account_id)) {
        balanceChangesByAccount.set(transaction.account_id, { clearedDelta: 0, unclearedDelta: 0 })
      }
      const changes = balanceChangesByAccount.get(transaction.account_id)!

      if (transaction.is_cleared) {
        changes.clearedDelta -= transaction.amount
      } else {
        changes.unclearedDelta -= transaction.amount
      }
    })

    // Optimistically remove transactions from store (instant UI update)
    transactionIds.forEach(id => {
      transactionStore.removeTransaction(id)
    })

    // Optimistically update account balances (instant UI update)
    balanceChangesByAccount.forEach((changes, accountId) => {
      const account = accountStore.accounts.find(acc => acc.id === accountId)
      if (account) {
        const newClearedBalance = account.cleared_balance + changes.clearedDelta
        const newUnclearedBalance = account.uncleared_balance + changes.unclearedDelta
        const newWorkingBalance = newClearedBalance + newUnclearedBalance

        accountStore.updateAccount(accountId, {
          cleared_balance: newClearedBalance,
          uncleared_balance: newUnclearedBalance,
          working_balance: newWorkingBalance
        })
      }
    })

    // Now make the API call in the background (no loading state)
    try {
      const result = await TransactionService.bulkDeleteTransactions(transactionIds)

      // Update ready to assign value from server response
      budgetStore.setReadyToAssign(result.readyToAssign)

      // Reconcile account balances with server response
      if (result.affectedAccounts && result.affectedAccounts.length > 0) {
        result.affectedAccounts.forEach(account => {
          accountStore.updateAccount(account.id, account)
        })
      }

      // Refresh category balances to reflect any credit card debt reversals
      if (budgetStore.currentBudget?.id) {
        // Small delay to ensure backend processing is complete
        await new Promise(resolve => setTimeout(resolve, 100))
        await fetchCategoryBalances(budgetStore.currentBudget.id)
      }
    } catch (err) {
      // Rollback optimistic updates on error
      console.error('Bulk delete failed, rolling back optimistic updates:', err)

      // Restore deleted transactions
      transactionSnapshots.forEach(transaction => {
        transactionStore.addTransaction(transaction)
      })

      // Rollback account balance changes
      balanceChangesByAccount.forEach((changes, accountId) => {
        const account = accountStore.accounts.find(acc => acc.id === accountId)
        if (account) {
          // Reverse the optimistic changes
          const newClearedBalance = account.cleared_balance - changes.clearedDelta
          const newUnclearedBalance = account.uncleared_balance - changes.unclearedDelta
          const newWorkingBalance = newClearedBalance + newUnclearedBalance

          accountStore.updateAccount(accountId, {
            cleared_balance: newClearedBalance,
            uncleared_balance: newUnclearedBalance,
            working_balance: newWorkingBalance
          })
        }
      })

      error.value = err instanceof Error ? err.message : 'Failed to bulk delete transactions'
      throw err
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

      // Update ready to assign value from server response
      budgetStore.setReadyToAssign(result.readyToAssign)

      // Remove transaction from store
      transactionStore.removeTransaction(id)

      // Handle account balance updates
      if (result.sourceAccount || result.targetAccount) {
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
    bulkDeleteTransactions,

    // Transaction-specific operations
    toggleCleared,

    // Utility operations
    setTransactions,
    setCurrentAccountId,
    resetTransactionData,
    setLoading
  }
}
