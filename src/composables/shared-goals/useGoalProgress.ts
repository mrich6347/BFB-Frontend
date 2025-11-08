import { ref } from 'vue'
import { useToast } from 'vue-toast-notification'
import { SharedGoalsService } from '../../services/shared-goals.service'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import type {
  UpdateParticipantDto,
  GoalProgressResponse,
  ParticipantWithProgressResponse
} from '../../types/DTO/shared-goal.dto'

export function useGoalProgress() {
  const toast = useToast()
  const sharedGoalsStore = useSharedGoalsStore()

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

  const updateParticipant = async (goalId: string, updateData: UpdateParticipantDto): Promise<boolean> => {
    try {
      isLoading.value = true
      clearError()

      await SharedGoalsService.updateParticipant(goalId, updateData)

      // Update will be reflected in the next main data refresh
      toast.success('Participant settings updated successfully!')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update participant settings'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error updating participant:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const loadGoalProgress = async (goalId: string): Promise<GoalProgressResponse | null> => {
    try {
      isLoading.value = true
      clearError()

      const progressData = await SharedGoalsService.getGoalProgress(goalId)
      return progressData
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load goal progress'
      setError(errorMessage)
      console.error('Error loading goal progress:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const calculateProjections = (
    targetAmount: number,
    currentAmount: number,
    participants: ParticipantWithProgressResponse[]
  ): { monthsToCompletion: number | null; projectedDate: Date | null; totalMonthlyContribution: number } => {
    const totalMonthlyContribution = participants.reduce((sum, participant) => {
      return sum + (participant.monthly_contribution || 0)
    }, 0)

    if (currentAmount >= targetAmount) {
      return { monthsToCompletion: 0, projectedDate: new Date(), totalMonthlyContribution }
    }

    if (totalMonthlyContribution <= 0) {
      return { monthsToCompletion: null, projectedDate: null, totalMonthlyContribution }
    }

    const remainingAmount = targetAmount - currentAmount
    const monthsToCompletion = Math.ceil(remainingAmount / totalMonthlyContribution)

    const projectedDate = new Date()
    projectedDate.setMonth(projectedDate.getMonth() + monthsToCompletion)

    return { monthsToCompletion, projectedDate, totalMonthlyContribution }
  }

  const formatProgressPercentage = (percentage: number): string => {
    return Math.min(percentage, 100).toFixed(1)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    if (percentage >= 25) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return {
    // State
    isLoading,
    error,

    // Actions
    updateParticipant,
    loadGoalProgress,
    calculateProjections,

    // Utilities
    formatProgressPercentage,
    formatCurrency,
    getProgressColor,
    getProgressBarColor,
    clearError
  }
}
