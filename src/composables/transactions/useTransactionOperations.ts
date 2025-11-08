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
    // Don't set isLoading - we want instant UI feedback with optimistic updates
    error.value = null

    // Create optimistic transaction with temporary ID
    const optimisticTransaction: TransactionResponse = {
      id: `temp-${Date.now()}-${Math.random()}`,
      user_id: '', // Will be set by server
      account_id: transactionData.account_id,
      date: transactionData.date,
      amount: transactionData.amount,
      memo: transactionData.memo || '',
      payee: transactionData.payee || '',
      category_id: transactionData.category_id === 'ready-to-assign' ? undefined : transactionData.category_id,
      is_cleared: transactionData.is_cleared ?? false,
      is_reconciled: transactionData.is_reconciled ?? false,
      transfer_id: transactionData.transfer_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Optimistically add transaction to store (instant UI update)
    transactionStore.addTransaction(optimisticTransaction)

    // Optimistically update account balance (instant UI update)
    updateAccountBalance(
      optimisticTransaction.account_id,
      optimisticTransaction.amount,
      optimisticTransaction.is_cleared
    )

    try {
      const result = await TransactionService.createTransaction(transactionData)

      // Remove optimistic transaction
      transactionStore.removeTransaction(optimisticTransaction.id)

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
        // Regular transaction - reconcile with server data
        newTransaction = result.transaction

        // Remove optimistic balance update
        removeAccountBalance(
          optimisticTransaction.account_id,
          optimisticTransaction.amount,
          optimisticTransaction.is_cleared
        )

        // Apply actual balance from server
        updateAccountBalance(
          newTransaction.account_id,
          newTransaction.amount,
          newTransaction.is_cleared
        )
      }

      // Add actual transaction from server
      transactionStore.addTransaction(newTransaction)
      return newTransaction
    } catch (err) {
      // Roll back optimistic updates on failure
      transactionStore.removeTransaction(optimisticTransaction.id)
      removeAccountBalance(
        optimisticTransaction.account_id,
        optimisticTransaction.amount,
        optimisticTransaction.is_cleared
      )

      error.value = err instanceof Error ? err.message : 'Failed to create transaction'
      console.error('Error creating transaction:', err)
      throw err
    }
  }

  const updateTransaction = async (id: string, transactionData: UpdateTransactionDto) => {
    // Don't set isLoading - we want instant UI feedback with optimistic updates
    error.value = null

    const originalTransaction = transactionStore.getTransactionById(id)
    if (!originalTransaction) {
      error.value = 'Transaction not found'
      throw new Error('Transaction not found')
    }

    // Create snapshot for rollback
    const transactionSnapshot = { ...originalTransaction }

    // Create optimistic update
    const optimisticUpdate: Partial<TransactionResponse> = {
      ...transactionData,
      category_id: transactionData.category_id === 'ready-to-assign' ? undefined : transactionData.category_id
    }

    // Optimistically update transaction in store (instant UI update)
    transactionStore.updateTransaction(id, optimisticUpdate)

    // Optimistically update account balances (instant UI update)
    // Remove old transaction's effect
    removeAccountBalance(
      originalTransaction.account_id,
      originalTransaction.amount,
      originalTransaction.is_cleared
    )

    // Add new transaction's effect (account_id cannot change in updates)
    const updatedAmount = transactionData.amount ?? originalTransaction.amount
    const updatedIsCleared = transactionData.is_cleared ?? originalTransaction.is_cleared

    updateAccountBalance(
      originalTransaction.account_id,
      updatedAmount,
      updatedIsCleared
    )

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
        // Regular transaction - reconcile with server data
        updatedTransaction = result.transaction

        // Remove optimistic balance update
        removeAccountBalance(
          originalTransaction.account_id,
          updatedAmount,
          updatedIsCleared
        )

        // Apply actual balance from server
        updateAccountBalance(
          updatedTransaction.account_id,
          updatedTransaction.amount,
          updatedTransaction.is_cleared
        )
      }

      // Update transaction with actual server data
      transactionStore.updateTransaction(id, updatedTransaction)
      return updatedTransaction
    } catch (err) {
      // Roll back optimistic updates on failure
      transactionStore.updateTransaction(id, transactionSnapshot)

      // Rollback account balance changes
      // Remove optimistic update
      removeAccountBalance(
        originalTransaction.account_id,
        updatedAmount,
        updatedIsCleared
      )

      // Restore original balance
      updateAccountBalance(
        originalTransaction.account_id,
        originalTransaction.amount,
        originalTransaction.is_cleared
      )

      error.value = err instanceof Error ? err.message : 'Failed to update transaction'
      console.error('Error updating transaction:', err)
      throw err
    }
  }

  const toggleCleared = async (id: string) => {
    // Don't set isLoading - we want instant UI feedback with optimistic updates
    error.value = null

    const originalTransaction = transactionStore.getTransactionById(id)
    if (!originalTransaction) {
      error.value = 'Transaction not found'
      throw new Error('Transaction not found')
    }

    const transactionSnapshot = { ...originalTransaction }
    const newClearedStatus = !originalTransaction.is_cleared

    // Optimistically update transaction and account balances (instant UI update)
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
    // Don't set isLoading - we want instant UI feedback with optimistic updates
    error.value = null

    const transactionToDelete = transactionStore.getTransactionById(id)
    if (!transactionToDelete) {
      error.value = 'Transaction not found'
      throw new Error('Transaction not found')
    }

    // Create snapshot for rollback
    const transactionSnapshot = { ...transactionToDelete }

    // Check if this is a transfer transaction and find the linked transaction
    let linkedTransaction: TransactionResponse | undefined
    let linkedTransactionSnapshot: TransactionResponse | undefined

    if (transactionToDelete.transfer_id) {
      // Find the linked transaction with the same transfer_id but different id
      linkedTransaction = transactionStore.transactions.find(
        t => t.transfer_id === transactionToDelete.transfer_id && t.id !== transactionToDelete.id
      )

      if (linkedTransaction) {
        linkedTransactionSnapshot = { ...linkedTransaction }
      }
    }

    // Optimistically remove transaction from store (instant UI update)
    transactionStore.removeTransaction(id)

    // If this is a transfer, also remove the linked transaction
    if (linkedTransaction) {
      transactionStore.removeTransaction(linkedTransaction.id)
    }

    // Optimistically update account balance (instant UI update)
    removeAccountBalance(
      transactionToDelete.account_id,
      transactionToDelete.amount,
      transactionToDelete.is_cleared
    )

    // If this is a transfer, also update the linked account balance
    if (linkedTransaction) {
      removeAccountBalance(
        linkedTransaction.account_id,
        linkedTransaction.amount,
        linkedTransaction.is_cleared
      )
    }

    try {
      const result = await TransactionService.deleteTransaction(id)

      // Update ready to assign value from server response
      budgetStore.setReadyToAssign(result.readyToAssign)

      // Handle account balance updates from server
      if (result.sourceAccount || result.targetAccount) {
        // Transfer transaction - update both account balances using returned data
        if (result.sourceAccount) {
          setAccountBalance(result.sourceAccount.id, result.sourceAccount)
        }

        if (result.targetAccount) {
          setAccountBalance(result.targetAccount.id, result.targetAccount)
        }
      } else {
        // Regular transaction - server response confirms our optimistic update
        // No additional balance update needed as we already did it optimistically
      }

      // Refresh category balances to reflect any credit card debt reversals
      if (budgetStore.currentBudget?.id) {
        // Small delay to ensure backend processing is complete
        await new Promise(resolve => setTimeout(resolve, 100))
        await fetchCategoryBalances(budgetStore.currentBudget.id)
      }
    } catch (err) {
      // Roll back optimistic updates on failure
      transactionStore.addTransaction(transactionSnapshot)
      updateAccountBalance(
        transactionToDelete.account_id,
        transactionToDelete.amount,
        transactionToDelete.is_cleared
      )

      // If this was a transfer, also roll back the linked transaction
      if (linkedTransactionSnapshot) {
        transactionStore.addTransaction(linkedTransactionSnapshot)
        updateAccountBalance(
          linkedTransactionSnapshot.account_id,
          linkedTransactionSnapshot.amount,
          linkedTransactionSnapshot.is_cleared
        )
      }

      error.value = err instanceof Error ? err.message : 'Failed to delete transaction'
      console.error('Error deleting transaction:', err)
      throw err
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
