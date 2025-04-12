import { defineStore } from 'pinia'
import type { Budget } from '@/types/models/budget'
import BudgetService from '@/services/budgetService'

export const useBudgetStore = defineStore('budget', {
  state: () => ({
    budgets: [] as Budget[],
    isLoading: false
  }),

  actions: {
    async fetchAllBudgets() {
      this.isLoading = true
      
      try {
        this.budgets = await BudgetService.getAllBudgets()
      } finally {
        this.isLoading = false
      }
    },
    async createBudget(budget: Budget) {
      try {
        const newBudget = await BudgetService.createBudget(budget)
        this.budgets.push(newBudget)
      } catch (error) {
        console.error('Error creating budget:', error)
      }
    }
  }
})
