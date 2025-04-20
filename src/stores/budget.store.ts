import { defineStore } from 'pinia'
import BudgetService from '@/services/budget.service'
import type { BudgetResponse, CreateBudgetDto } from '@/types/DTO/budget.dto'
import { usePatchStoreBudget } from '@/composables/budgets/usePatchStoreBudget'


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
                const budgets = await BudgetService.getAllBudgets()
                console.log(budgets)
                this.budgets = budgets
            } finally {
                this.isLoading = false
            }
        },
        async createBudget(request: CreateBudgetDto) {
            const response = await BudgetService.createBudget(request)
            this.budgets.unshift(response)
            return response
        },
        async updateBudget(id: string, request: CreateBudgetDto) {
            const response = await BudgetService.updateBudget(id, request)
            const { updateBudgetInStore } = usePatchStoreBudget()
            updateBudgetInStore(id, response)
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
