import { defineStore } from 'pinia'
import type { CreateTransactionDto, UpdateTransactionDto, TransactionResponse } from '@/types/DTO/transaction.dto'
import { TransactionService } from '@/services/transaction.service'
import { useAccountStore } from './account.store'

export const useTransactionStore = defineStore('transactionStore', {
  state: () => ({
    transactions: [] as TransactionResponse[],
    isLoading: false,
    currentAccountId: null as string | null,
  }),

  getters: {
    getTransactionsByAccount: (state) => (accountId: string) => {
      return state.transactions.filter(transaction => transaction.account_id === accountId)
    },

    getTransactionById: (state) => (id: string) => {
      return state.transactions.find(transaction => transaction.id === id)
    },

    getClearedTransactions: (state) => {
      return state.transactions.filter(transaction => transaction.is_cleared)
    },

    getUnclearedTransactions: (state) => {
      return state.transactions.filter(transaction => !transaction.is_cleared)
    }
  },

  actions: {
    setTransactions(transactions: TransactionResponse[]) {
      this.transactions = transactions
    },

    setCurrentAccountId(accountId: string | null) {
      this.currentAccountId = accountId
    },

    setIsLoading(loading: boolean) {
      this.isLoading = loading
    },

    async loadTransactionsByAccount(accountId: string) {
      this.setIsLoading(true)
      try {
        const transactions = await TransactionService.getTransactionsByAccount(accountId)
        this.setTransactions(transactions)
        this.setCurrentAccountId(accountId)
      } catch (error) {
        console.error('Failed to load transactions:', error)
        throw error
      } finally {
        this.setIsLoading(false)
      }
    },

    async createTransaction(transactionData: CreateTransactionDto) {
      const accountStore = useAccountStore()

      try {
        const newTransaction = await TransactionService.createTransaction(transactionData)
        this.transactions.unshift(newTransaction) // Add to beginning of array

        // Update account balance optimistically
        accountStore.updateAccountBalance(
          newTransaction.account_id,
          newTransaction.amount,
          newTransaction.is_cleared
        )

        return newTransaction
      } catch (error) {
        console.error('Failed to create transaction:', error)
        throw error
      }
    },

    async updateTransaction(id: string, transactionData: UpdateTransactionDto) {
      const accountStore = useAccountStore()
      const index = this.transactions.findIndex(t => t.id === id)
      if (index === -1) {
        throw new Error('Transaction not found')
      }

      const originalTransaction = { ...this.transactions[index] }

      try {
        const updatedTransaction = await TransactionService.updateTransaction(id, transactionData)

        // Remove the old transaction's effect on account balance
        accountStore.removeAccountBalance(
          originalTransaction.account_id,
          originalTransaction.amount,
          originalTransaction.is_cleared
        )

        // Add the new transaction's effect on account balance
        accountStore.updateAccountBalance(
          updatedTransaction.account_id,
          updatedTransaction.amount,
          updatedTransaction.is_cleared
        )

        this.transactions[index] = updatedTransaction
        return updatedTransaction
      } catch (error) {
        console.error('Failed to update transaction:', error)
        throw error
      }
    },

    async toggleCleared(id: string) {
      const accountStore = useAccountStore()
      const index = this.transactions.findIndex(t => t.id === id)
      if (index === -1) {
        throw new Error('Transaction not found')
      }

      // Store original state for rollback
      const originalTransaction = { ...this.transactions[index] }
      const newClearedStatus = !originalTransaction.is_cleared

      // Optimistically update the UI
      this.transactions[index].is_cleared = newClearedStatus

      // Optimistically update account balance
      accountStore.updateAccountBalanceOnClearedToggle(
        originalTransaction.account_id,
        originalTransaction.amount,
        newClearedStatus
      )

      try {
        const updatedTransaction = await TransactionService.toggleCleared(id)
        // Update with the actual response from server (in case there are other fields updated)
        this.transactions[index] = updatedTransaction
        return updatedTransaction
      } catch (error) {
        // Rollback transaction state
        this.transactions[index] = originalTransaction

        // Rollback account balance
        accountStore.updateAccountBalanceOnClearedToggle(
          originalTransaction.account_id,
          originalTransaction.amount,
          originalTransaction.is_cleared
        )

        console.error('Failed to toggle cleared status:', error)
        throw error
      }
    },

    async deleteTransaction(id: string) {
      const accountStore = useAccountStore()
      const transactionToDelete = this.transactions.find(t => t.id === id)
      if (!transactionToDelete) {
        throw new Error('Transaction not found')
      }

      try {
        await TransactionService.deleteTransaction(id)
        this.transactions = this.transactions.filter(t => t.id !== id)

        // Update account balance by removing the deleted transaction's effect
        accountStore.removeAccountBalance(
          transactionToDelete.account_id,
          transactionToDelete.amount,
          transactionToDelete.is_cleared
        )
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        throw error
      }
    },

    reset() {
      this.transactions = []
      this.isLoading = false
      this.currentAccountId = null
    }
  }
})
