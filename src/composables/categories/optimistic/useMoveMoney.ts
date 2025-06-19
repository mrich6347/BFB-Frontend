import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CategoryBalanceResponse } from '@/types/DTO/category-balance.dto'

interface OptimisticState {
  originalReadyToAssign: number
  originalCategoryBalances: CategoryBalanceResponse[]
}

export const useMoveMoney = () => {
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

  const moveMoneyOptimistic = async (
    sourceCategoryId: string,
    destinationCategoryId: string,
    amount: number,
    serverOperation: () => Promise<void>
  ) => {
    error.value = null

    try {
      // Step 1: Save original state for potential rollback
      saveOriginalState()
      isOptimisticUpdate.value = true

      // Step 2: Apply optimistic updates specific to moving money between categories
      const sourceBalance = categoryStore.categoryBalances.find(b => b.category_id === sourceCategoryId)
      if (!sourceBalance) {
        throw new Error('Source category balance not found')
      }

      // Validate that source has enough available money
      if ((sourceBalance.available || 0) < amount) {
        throw new Error('Insufficient available balance in source category')
      }

      // Update category balances
      const updatedBalances = categoryStore.categoryBalances.map(balance => {
        if (balance.category_id === sourceCategoryId) {
          // Source category: subtract amount from available
          return {
            ...balance,
            available: (balance.available || 0) - amount,
            is_optimistic: true
          }
        } else if (balance.category_id === destinationCategoryId) {
          // Destination category: add amount to available
          return {
            ...balance,
            available: (balance.available || 0) + amount,
            is_optimistic: true
          }
        }
        return balance
      })

      // If destination category doesn't have a balance yet, we need to create one optimistically
      const destinationExists = categoryStore.categoryBalances.some(b => b.category_id === destinationCategoryId)
      if (!destinationExists) {
        // Find the destination category to get budget_id
        const destinationCategory = categoryStore.categories.find(c => c.id === destinationCategoryId)
        if (destinationCategory) {
          const now = new Date()
          const newBalance: CategoryBalanceResponse = {
            id: `temp-${destinationCategoryId}`, // Temporary ID
            category_id: destinationCategoryId,
            budget_id: destinationCategory.budget_id,
            user_id: '', // Will be set by server
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            assigned: 0,
            activity: 0,
            available: amount,
            created_at: new Date(),
            updated_at: new Date(),
            is_optimistic: true
          }
          updatedBalances.push(newBalance)
        }
      }

      categoryStore.setCategoryBalances(updatedBalances)

      // Ready to Assign should remain the same since we're just moving between categories
      // (no change needed)

      // Step 3: Call the actual server operation (passed as parameter)
      await serverOperation()

      clearOptimisticState()

    } catch (err) {
      console.error('Move money optimistic operation failed, rolling back:', err)
      rollbackOptimisticUpdate()

      error.value = err instanceof Error ? err.message : 'Failed to move money'
      throw err
    }
  }

  return {
    // State
    isOptimisticUpdate: readonly(isOptimisticUpdate),
    error: readonly(error),

    // Operations
    moveMoneyOptimistic,
    rollbackOptimisticUpdate,
    clearOptimisticState
  }
}
