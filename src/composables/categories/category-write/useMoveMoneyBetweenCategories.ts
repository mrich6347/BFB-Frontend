import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'
import { useMoveMoney as useMoveMoneyOptimistic } from '../optimistic/useMoveMoney'

export const useMoveMoneyBetweenCategories = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const moveMoneyOptimistic = useMoveMoneyOptimistic()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const moveMoney = async (sourceCategoryId: string, destinationCategoryId: string, amount: number) => {
    console.log('Moving money between categories with optimistic update:', sourceCategoryId, destinationCategoryId, amount)

    // Use specific optimistic composable to handle optimistic updates and call server operation
    await moveMoneyOptimistic.moveMoneyOptimistic(sourceCategoryId, destinationCategoryId, amount, async () => {
      // This is the actual server operation that gets called by the optimistic composable
      isLoading.value = true
      error.value = null

      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        const response = await CategoryService.moveMoney(sourceCategoryId, destinationCategoryId, amount, year, month)

        // Update with server data
        budgetStore.setReadyToAssign(response.readyToAssign)
        categoryStore.updateCategoryBalance(sourceCategoryId, response.sourceCategoryBalance)
        categoryStore.updateCategoryBalance(destinationCategoryId, response.destinationCategoryBalance)

      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to move money'
        console.error('Error moving money:', err)
        throw err
      } finally {
        isLoading.value = false
      }
    })
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    moveMoney
  }
}
