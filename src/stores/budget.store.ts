import { defineStore } from 'pinia'
import BudgetService from '@/services/budget.service'
import type { BudgetResponse, CreateBudgetDto } from '@/types/DTO/budget.dto'
import { usePatchStoreBudget } from '@/composables/budgets/usePatchStoreBudget'
import { getCurrentMonthYear } from '@/utils/dateContext'


export const useBudgetStore = defineStore('budgetStore', {
    state: () => {
        const { year, month } = getCurrentMonthYear()
        return {
            budgets: [] as BudgetResponse[],
            currentBudget: null as BudgetResponse | null,
            isLoading: true,
            currentYear: year,
            currentMonth: month,
            readyToAssign: 0
        }
    },

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
        // Ensure we're always showing the current month (using user's timezone)
        ensureCurrentMonth() {
            const { year, month } = getCurrentMonthYear()
            this.currentYear = year
            this.currentMonth = month
        },

        // Check if we need to roll over to a new month and handle it
        async checkAndHandleMonthRollover() {
            const { year, month } = getCurrentMonthYear()

            // Update our current month to the real current month (user's timezone)
            this.currentYear = year
            this.currentMonth = month

            // The backend will handle creating new month balances when needed
            // This is just to ensure the frontend is showing the current month
        }
    },
})
