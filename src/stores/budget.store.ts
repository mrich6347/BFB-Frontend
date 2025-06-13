import { defineStore } from 'pinia'
import BudgetService from '@/services/budget.service'
import type { BudgetResponse, CreateBudgetDto } from '@/types/DTO/budget.dto'
import { usePatchStoreBudget } from '@/composables/budgets/usePatchStoreBudget'


export const useBudgetStore = defineStore('budgetStore', {
    state: () => ({
        budgets: [] as BudgetResponse[],
        currentBudget: null as BudgetResponse | null,
        isLoading: true,
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        readyToAssign: 0
    }),

    getters: {
        budgetExistsByName: (state) => (name: string) => {
            return state.budgets.find(b => b.name.toLowerCase() === name.toLowerCase())
        },
        currentMonthName: (state) => {
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ]
            return `${monthNames[state.currentMonth - 1]} ${state.currentYear}`
        }
    },

    actions: {
        async fetchAllBudgets() {
            this.isLoading = true

            try {
                const budgets = await BudgetService.getAllBudgets()
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
            this.readyToAssign = 0
        },
        setReadyToAssign(amount: number) {
            this.readyToAssign = amount
        },
        // Ensure we're always showing the current month
        ensureCurrentMonth() {
            const now = new Date()
            this.currentYear = now.getFullYear()
            this.currentMonth = now.getMonth() + 1
        },

        // Check if we need to roll over to a new month and handle it
        async checkAndHandleMonthRollover() {
            const now = new Date()
            const realYear = now.getFullYear()
            const realMonth = now.getMonth() + 1

            // Update our current month to the real current month
            this.currentYear = realYear
            this.currentMonth = realMonth

            // The backend will handle creating new month balances when needed
            // This is just to ensure the frontend is showing the current month
        }
    },
})
