import { defineStore } from 'pinia'
import type { Budget } from '@/types/models/budget'
import BudgetService from '@/services/budgetService'
import type { CreateBudgetRequest } from '@/types/DTO/budget.dto'
export const useBudgetStore = defineStore('budgetStore', {
    state: () => ({
        budgets: [] as Budget[],
        currentBudget: null as Budget | null,
        isLoading: true
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
        },
        setIsLoading(isLoading: boolean) {
            this.isLoading = isLoading
        },
        setCurrentBudget(budget: Budget) {
            this.currentBudget = budget
        }
    }
})
