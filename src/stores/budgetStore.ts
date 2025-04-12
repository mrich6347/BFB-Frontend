import { defineStore } from 'pinia'
import type { Budget } from '@/types/models/budget'
import type { CreateBudgetRequest } from '@/types/api/budgets/createBudget/createBudget'
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
    async createBudget(request: CreateBudgetRequest) {
      const response = await BudgetService.createBudget(request)
      this.budgets.unshift(response)
      return response
    }
  }
})
