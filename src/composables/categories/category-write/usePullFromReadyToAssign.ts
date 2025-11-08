import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'
import { usePullFromReadyToAssign as usePullFromReadyToAssignOptimistic } from '../optimistic/usePullFromReadyToAssign'

export const usePullFromReadyToAssign = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const pullFromReadyToAssignOptimistic = usePullFromReadyToAssignOptimistic()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const pullFromReadyToAssign = async (destinationCategoryId: string, amount: number) => {
    console.log('Pulling money from ready to assign with optimistic update:', destinationCategoryId, amount)

    // Use specific optimistic composable to handle optimistic updates and call server operation
    await pullFromReadyToAssignOptimistic.pullFromReadyToAssignOptimistic(destinationCategoryId, amount, async () => {
      // This is the actual server operation that gets called by the optimistic composable
      isLoading.value = true
      error.value = null

      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        const response = await CategoryService.pullFromReadyToAssign(destinationCategoryId, amount, year, month)

        // Update with server data
        budgetStore.setReadyToAssign(response.readyToAssign)
        categoryStore.updateCategoryBalance(destinationCategoryId, response.categoryBalance)

        // Update affected payment category balances (credit card logic)
        if (response.affectedCategoryBalances && response.affectedCategoryBalances.length > 0) {
          response.affectedCategoryBalances.forEach(balance => {
            categoryStore.updateCategoryBalance(balance.category_id, balance)
          })
        }

      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to pull money from Ready to Assign'
        console.error('Error pulling money from Ready to Assign:', err)
        throw err
      } finally {
        isLoading.value = false
      }
    })
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    pullFromReadyToAssign
  }
}
