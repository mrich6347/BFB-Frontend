import { ref, readonly } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import BudgetService from '@/services/budget.service'

export const useFetchBudget = () => {
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchBudget = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const budget = await BudgetService.getBudget(id)
      budgetStore.setCurrentBudget(budget)
      return budget
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load budget'
      console.error('Error loading budget:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchBudget
  }
}
