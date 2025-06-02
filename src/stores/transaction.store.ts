import { defineStore } from 'pinia'
import type { CreateTransactionDto, UpdateTransactionDto, TransactionResponse } from '@/types/DTO/transaction.dto'
import { TransactionService } from '@/services/transaction.service'

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
      try {
        const newTransaction = await TransactionService.createTransaction(transactionData)
        this.transactions.unshift(newTransaction) // Add to beginning of array
        return newTransaction
      } catch (error) {
        console.error('Failed to create transaction:', error)
        throw error
      }
    },

    async updateTransaction(id: string, transactionData: UpdateTransactionDto) {
      try {
        const updatedTransaction = await TransactionService.updateTransaction(id, transactionData)
        const index = this.transactions.findIndex(t => t.id === id)
        if (index !== -1) {
          this.transactions[index] = updatedTransaction
        }
        return updatedTransaction
      } catch (error) {
        console.error('Failed to update transaction:', error)
        throw error
      }
    },

    async toggleCleared(id: string) {
      try {
        const updatedTransaction = await TransactionService.toggleCleared(id)
        const index = this.transactions.findIndex(t => t.id === id)
        if (index !== -1) {
          this.transactions[index] = updatedTransaction
        }
        return updatedTransaction
      } catch (error) {
        console.error('Failed to toggle cleared status:', error)
        throw error
      }
    },

    async deleteTransaction(id: string) {
      try {
        await TransactionService.deleteTransaction(id)
        this.transactions = this.transactions.filter(t => t.id !== id)
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
