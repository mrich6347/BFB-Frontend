import { useBudgetStore } from '@/stores/budget.store'
import type { BudgetResponse } from '@/types/DTO/budget.dto'

export const useBudgetUtils = () => {
  const budgetStore = useBudgetStore()

  const setCurrentBudget = (budget: BudgetResponse | null) => {
    budgetStore.setCurrentBudget(budget)
  }

  const setReadyToAssign = (amount: number) => {
    budgetStore.setReadyToAssign(amount)
  }

  const ensureCurrentMonth = () => {
    budgetStore.ensureCurrentMonth()
  }

  const checkAndHandleMonthRollover = () => {
    // Just ensure current month - backend handles the rest
    budgetStore.ensureCurrentMonth()
  }

  const resetBudgetData = () => {
    budgetStore.reset()
  }

  return {
    setCurrentBudget,
    setReadyToAssign,
    ensureCurrentMonth,
    checkAndHandleMonthRollover,
    resetBudgetData
  }
}
