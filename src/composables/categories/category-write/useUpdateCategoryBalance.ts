import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'
import { useUpdateCategoryBalance as useUpdateCategoryBalanceOptimistic } from '../optimistic/useUpdateCategoryBalance'

export const useUpdateCategoryBalance = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const updateCategoryBalanceOptimistic = useUpdateCategoryBalanceOptimistic()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const updateCategoryBalance = async (categoryId: string, assigned: number) => {
    console.log('Updating category balance with optimistic update:', categoryId, assigned)

    // Use specific optimistic composable to handle optimistic updates and call server operation
    await updateCategoryBalanceOptimistic.updateCategoryBalanceOptimistic(categoryId, assigned, async () => {
      // This is the actual server operation that gets called by the optimistic composable
      isLoading.value = true
      error.value = null

      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        const response = await CategoryService.updateCategoryBalance(categoryId, { assigned }, year, month)

        // update with server data
        budgetStore.setReadyToAssign(response.readyToAssign)
        categoryStore.updateCategoryBalance(categoryId, response.categoryBalance)

      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to update category balance'
        console.error('Error updating category balance:', err)
        throw err
      } finally {
        isLoading.value = false
      }
    })
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    updateCategoryBalance
  }
}
