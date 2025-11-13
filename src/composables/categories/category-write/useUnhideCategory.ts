import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'

export const useUnhideCategory = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const unhideCategory = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await CategoryService.unhideCategory(id)

      budgetStore.setReadyToAssign(response.readyToAssign)

      // Update the category with the server response
      categoryStore.updateCategory(id, response.category)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to unhide category'
      console.error('Error unhiding category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    unhideCategory
  }
}
