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
        currentMonth: new Date().getMonth() + 1
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
        },
        setCurrentMonth(year: number, month: number) {
            this.currentYear = year
            this.currentMonth = month
        },
        navigateMonth(direction: 'prev' | 'next') {
            if (direction === 'next') {
                // Check if we can go forward (max 2 months into future)
                const now = new Date()
                const currentRealYear = now.getFullYear()
                const currentRealMonth = now.getMonth() + 1

                let nextYear = this.currentYear
                let nextMonth = this.currentMonth + 1

                if (nextMonth > 12) {
                    nextMonth = 1
                    nextYear += 1
                }

                // Calculate months difference from current real month
                const monthsDiff = (nextYear - currentRealYear) * 12 + (nextMonth - currentRealMonth)

                // Only allow up to 2 months into the future
                if (monthsDiff <= 2) {
                    this.currentYear = nextYear
                    this.currentMonth = nextMonth
                }
            } else {
                // No restriction on going backwards
                if (this.currentMonth === 1) {
                    this.currentMonth = 12
                    this.currentYear -= 1
                } else {
                    this.currentMonth -= 1
                }
            }
        }
    },
})
