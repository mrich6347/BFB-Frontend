import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CategoryBalanceResponse } from '@/types/DTO/category-balance.dto'

interface OptimisticState {
  originalReadyToAssign: number
  originalCategoryBalances: CategoryBalanceResponse[]
}

export const usePullFromReadyToAssign = () => {
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

  const pullFromReadyToAssignOptimistic = async (
    destinationCategoryId: string,
    amount: number,
    serverOperation: () => Promise<void>
  ) => {
    error.value = null

    try {
      // Step 1: Save original state for potential rollback
      saveOriginalState()
      isOptimisticUpdate.value = true

      // Step 2: Apply optimistic updates specific to pulling money from ready to assign
      
      // Validate that Ready to Assign has enough money
      if (budgetStore.readyToAssign < amount) {
        throw new Error('Insufficient Ready to Assign balance')
      }

      // Update Ready to Assign (subtract the amount being pulled)
      const newReadyToAssign = budgetStore.readyToAssign - amount
      budgetStore.setReadyToAssign(newReadyToAssign)

      // Update destination category balance (add amount to both available and assigned)
      const updatedBalances = categoryStore.categoryBalances.map(balance => {
        if (balance.category_id === destinationCategoryId) {
          return {
            ...balance,
            assigned: (balance.assigned || 0) + amount,
            available: (balance.available || 0) + amount,
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
      console.error('Pull from ready to assign optimistic operation failed, rolling back:', err)
      rollbackOptimisticUpdate()

      error.value = err instanceof Error ? err.message : 'Failed to pull money from ready to assign'
      throw err
    }
  }

  return {
    // State
    isOptimisticUpdate: readonly(isOptimisticUpdate),
    error: readonly(error),

    // Operations
    pullFromReadyToAssignOptimistic,
    rollbackOptimisticUpdate,
    clearOptimisticState
  }
}
