import { ref } from 'vue'
import { useToast } from 'vue-toast-notification'
import { SharedGoalsService } from '../../services/shared-goals.service'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import { useBudgetStore } from '../../stores/budget.store'
import type {
  CreateSharedGoalDto,
  UpdateSharedGoalDto,
  SharedGoalResponse
} from '../../types/DTO/shared-goal.dto'

export function useSharedGoalOperations() {
  const toast = useToast()
  const sharedGoalsStore = useSharedGoalsStore()
  const budgetStore = useBudgetStore()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const clearError = () => {
    error.value = null
    sharedGoalsStore.clearError()
  }

  const setError = (message: string) => {
    error.value = message
    sharedGoalsStore.setError(message)
  }

  const createGoal = async (goalData: CreateSharedGoalDto): Promise<SharedGoalResponse | null> => {
    try {
      isLoading.value = true
      clearError()

      const newGoal = await SharedGoalsService.create(goalData)

      // Add to store
      sharedGoalsStore.addGoal(newGoal)

      toast.success('Goal created successfully!')
      return newGoal
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create goal'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error creating goal:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Note: Goals are loaded via main data service, no need for separate loadGoals function

  const loadGoal = async (goalId: string): Promise<SharedGoalResponse | null> => {
    try {
      isLoading.value = true
      clearError()

      const goal = await SharedGoalsService.findById(goalId)

      // Update store
      sharedGoalsStore.setCurrentGoal(goal)

      return goal
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load goal'
      setError(errorMessage)
      console.error('Error loading goal:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateGoal = async (goalId: string, updates: UpdateSharedGoalDto): Promise<SharedGoalResponse | null> => {
    try {
      isLoading.value = true
      clearError()

      const updatedGoal = await SharedGoalsService.update(goalId, updates)

      // Update store
      sharedGoalsStore.updateGoal(goalId, updatedGoal)

      toast.success('Goal updated successfully!')
      return updatedGoal
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update goal'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error updating goal:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deleteGoal = async (goalId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      clearError()

      await SharedGoalsService.delete(goalId)

      // Remove from store
      sharedGoalsStore.removeGoal(goalId)

      toast.success('Goal deleted successfully!')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete goal'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error deleting goal:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const refreshGoals = async (budgetId: string): Promise<SharedGoalResponse[]> => {
    try {
      isLoading.value = true
      clearError()

      const goals = await SharedGoalsService.findAll(budgetId)

      // Update store
      sharedGoalsStore.setGoals(goals)

      return goals
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to refresh goals'
      setError(errorMessage)
      console.error('Error refreshing goals:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    isLoading,
    error,

    // Actions
    createGoal,
    loadGoal,
    updateGoal,
    deleteGoal,
    refreshGoals,
    clearError
  }
}
