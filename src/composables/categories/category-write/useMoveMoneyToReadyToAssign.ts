import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'
import { useMoveMoneyToReadyToAssign as useMoveMoneyToReadyToAssignOptimistic } from '../optimistic/useMoveMoneyToReadyToAssign'

export const useMoveMoneyToReadyToAssign = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const moveMoneyToReadyToAssignOptimistic = useMoveMoneyToReadyToAssignOptimistic()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const moveMoneyToReadyToAssign = async (sourceCategoryId: string, amount: number) => {
    console.log('Moving money to ready to assign with optimistic update:', sourceCategoryId, amount)

    // Use specific optimistic composable to handle optimistic updates and call server operation
    await moveMoneyToReadyToAssignOptimistic.moveMoneyToReadyToAssignOptimistic(sourceCategoryId, amount, async () => {
      // This is the actual server operation that gets called by the optimistic composable
      isLoading.value = true
      error.value = null

      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        const response = await CategoryService.moveMoneyToReadyToAssign(sourceCategoryId, amount, year, month)

        // Update with server data
        budgetStore.setReadyToAssign(response.readyToAssign)
        categoryStore.updateCategoryBalance(sourceCategoryId, response.categoryBalance)

      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to move money to Ready to Assign'
        console.error('Error moving money to Ready to Assign:', err)
        throw err
      } finally {
        isLoading.value = false
      }
    })
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    moveMoneyToReadyToAssign
  }
}
