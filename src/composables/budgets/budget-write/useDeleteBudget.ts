import { ref, readonly } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import BudgetService from '@/services/budget.service'

export const useDeleteBudget = () => {
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const deleteBudget = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      await BudgetService.deleteBudget(id)
      budgetStore.removeBudget(id)

      // Clear localStorage if this was the last visited budget
      const lastVisitedBudgetId = localStorage.getItem('lastVisitedBudgetId')
      if (lastVisitedBudgetId === id) {
        localStorage.removeItem('lastVisitedBudgetId')
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete budget'
      console.error('Error deleting budget:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    deleteBudget
  }
}

