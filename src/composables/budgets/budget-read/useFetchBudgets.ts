import { ref, readonly } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import BudgetService from '@/services/budget.service'

export const useFetchBudgets = () => {
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchBudgets = async () => {
    isLoading.value = true
    error.value = null

    try {
      const budgets = await BudgetService.getAllBudgets()
      budgetStore.setBudgets(budgets)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load budgets'
      console.error('Error loading budgets:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchBudgets
  }
}
