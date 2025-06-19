import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CategoryBalanceResponse } from '@/types/DTO/category-balance.dto'

interface OptimisticState {
  originalReadyToAssign: number
  originalCategoryBalances: CategoryBalanceResponse[]
}

export const useUpdateCategoryBalance = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()

  const isOptimisticUpdate = ref(false)
  const error = ref<string | null>(null)

  // Store original state for rollback
  const optimisticState = ref<OptimisticState | null>(null)

  const saveOriginalState = () => {
    optimisticState.value = {
      originalReadyToAssign: budgetStore.readyToAssign,
      // Deep copy to preserve original is_optimistic flags
      originalCategoryBalances: categoryStore.categoryBalances.map(balance => ({ ...balance }))
    }
  }

  const rollbackOptimisticUpdate = () => {
    if (optimisticState.value) {
      // Rollback Ready to Assign
      budgetStore.setReadyToAssign(optimisticState.value.originalReadyToAssign)

      // Rollback category balances
      categoryStore.setCategoryBalances(optimisticState.value.originalCategoryBalances)

      // Clear optimistic state
      optimisticState.value = null
    }
    isOptimisticUpdate.value = false
  }

  const clearOptimisticState = () => {
    optimisticState.value = null
    isOptimisticUpdate.value = false
  }

  const updateCategoryBalanceOptimistic = async (
    categoryId: string,
    assigned: number,
    serverOperation: () => Promise<void>
  ) => {
    error.value = null

    try {
      // Step 1: Save original state for potential rollback
      saveOriginalState()
      isOptimisticUpdate.value = true

      // Step 2: Apply optimistic updates specific to category balance update
      const currentBalance = categoryStore.categoryBalances.find(b => b.category_id === categoryId)
      if (!currentBalance) {
        throw new Error('Category balance not found')
      }

      const assignedDifference = assigned - currentBalance.assigned

      const newReadyToAssign = budgetStore.readyToAssign - assignedDifference
      budgetStore.setReadyToAssign(newReadyToAssign)

      const updatedBalances = categoryStore.categoryBalances.map(balance => {
        if (balance.category_id === categoryId) {
          const assignedDifference = assigned - balance.assigned

          return {
            ...balance,
            assigned: assigned,
            available: balance.available + assignedDifference,
            is_optimistic: true
          }
        }
        return balance
      })
      categoryStore.setCategoryBalances(updatedBalances)

      // Step 3: Call the actual server operation (passed as parameter)
      await serverOperation()

      clearOptimisticState()

    } catch (err) {
      console.error('Update category balance optimistic operation failed, rolling back:', err)
      rollbackOptimisticUpdate()

      error.value = err instanceof Error ? err.message : 'Failed to update category balance'
      throw err
    }
  }

  return {
    // State
    isOptimisticUpdate: readonly(isOptimisticUpdate),
    error: readonly(error),

    // Operations
    updateCategoryBalanceOptimistic,
    rollbackOptimisticUpdate,
    clearOptimisticState
  }
}
