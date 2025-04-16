import { defineStore } from 'pinia'
import BudgetService from '@/services/budgetService'
import type { BudgetResponse, CreateBudgetRequest } from '@/types/DTO/budget.dto'


export const useBudgetStore = defineStore('budgetStore', {
    state: () => ({
        budgets: [] as BudgetResponse[],
        currentBudget: null as BudgetResponse | null,
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
        setBudgets(budgets: BudgetResponse[]) {
            this.budgets = budgets
        },
        setCurrentBudget(budget: BudgetResponse) {
            this.currentBudget = budget
        },
        reset() {
            this.budgets = []
            this.currentBudget = null
            this.isLoading = true
        }
    },
})
