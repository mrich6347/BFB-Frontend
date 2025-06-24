import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { MainDataService } from '@/services/common/mainData.service'

export const useFetchCategoryBalances = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategoryBalances = async (budgetId: string) => {
    if (!budgetId) {
      error.value = 'Cannot fetch category balances: budgetId is undefined'
      console.error('Cannot fetch category balances: budgetId is undefined')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      // Use the main data service to get fresh category balances
      const mainData = await MainDataService.getMainData(budgetId)
      if (mainData?.categoryBalances) {
        categoryStore.setCategoryBalances(mainData.categoryBalances)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch category balances'
      console.error('Failed to fetch category balances:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchCategoryBalances
  }
}
