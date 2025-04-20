import type { BudgetResponse } from '@/types/DTO/budget.dto'
import { useBudgetStore } from '@/stores/budget.store'

export const usePatchStoreBudget = () => {
    const updateBudgetInStore = (id: string, updatedBudget: BudgetResponse) => {
        const budgetStore = useBudgetStore()
        const index = budgetStore.budgets.findIndex(b => b.id === id)
        
        if (index !== -1) {
            budgetStore.budgets[index] = updatedBudget
        }
        
        if (budgetStore.currentBudget?.id === id) {
            budgetStore.currentBudget = updatedBudget
        }
    }

    return {
        updateBudgetInStore
    }
}
