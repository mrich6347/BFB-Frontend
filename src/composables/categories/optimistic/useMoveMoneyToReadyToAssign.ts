import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CategoryBalanceResponse } from '@/types/DTO/category-balance.dto'

interface OptimisticState {
  originalReadyToAssign: number
  originalCategoryBalances: CategoryBalanceResponse[]
}

export const useMoveMoneyToReadyToAssign = () => {
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

  const moveMoneyToReadyToAssignOptimistic = async (
    sourceCategoryId: string,
    amount: number,
    serverOperation: () => Promise<void>
  ) => {
    error.value = null

    try {
      // Step 1: Save original state for potential rollback
      saveOriginalState()
      isOptimisticUpdate.value = true

      // Step 2: Apply optimistic updates specific to moving money to ready to assign
      const currentBalance = categoryStore.categoryBalances.find(b => b.category_id === sourceCategoryId)
      if (!currentBalance) {
        throw new Error('Source category balance not found')
      }

      // Validate that source has enough available money
      if ((currentBalance.available || 0) < amount) {
        throw new Error('Insufficient available balance in source category')
      }

      // Update Ready to Assign (add the amount being moved)
      const newReadyToAssign = budgetStore.readyToAssign + amount
      budgetStore.setReadyToAssign(newReadyToAssign)

      // Update source category balance (subtract amount from both available and assigned)
      const updatedBalances = categoryStore.categoryBalances.map(balance => {
        if (balance.category_id === sourceCategoryId) {
          return {
            ...balance,
            assigned: (balance.assigned || 0) - amount,
            available: (balance.available || 0) - amount,
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
      console.error('Move money to ready to assign optimistic operation failed, rolling back:', err)
      rollbackOptimisticUpdate()

      error.value = err instanceof Error ? err.message : 'Failed to move money to ready to assign'
      throw err
    }
  }

  return {
    // State
    isOptimisticUpdate: readonly(isOptimisticUpdate),
    error: readonly(error),

    // Operations
    moveMoneyToReadyToAssignOptimistic,
    rollbackOptimisticUpdate,
    clearOptimisticState
  }
}
