import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'

export const useHideCategory = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hideCategory = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await CategoryService.hideCategory(id)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign with the accurate value from the backend
      budgetStore.setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to hide the category
      categoryStore.hideCategory(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to hide category'
      console.error('Error hiding category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    hideCategory
  }
}
