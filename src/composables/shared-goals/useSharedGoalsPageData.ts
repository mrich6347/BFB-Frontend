import { ref } from 'vue'
import { useSharedGoalOperations } from './useSharedGoalOperations'
import { useGoalInvitations } from './useGoalInvitations'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import type { SharedGoalResponse, InvitationResponse } from '../../types/DTO/shared-goal.dto'

/**
 * Composable for managing shared goals page data refresh
 * Provides dedicated data loading for the shared goals page to ensure fresh data
 */
export function useSharedGoalsPageData() {
  const isRefreshing = ref(false)
  const refreshError = ref<string | null>(null)
  
  const { refreshGoals } = useSharedGoalOperations()
  const { loadInvitations } = useGoalInvitations()
  const sharedGoalsStore = useSharedGoalsStore()

  const clearRefreshError = () => {
    refreshError.value = null
  }

  const setRefreshError = (error: string) => {
    refreshError.value = error
  }

  /**
   * Refresh all shared goals page data
   * This includes goals and invitations for the current budget
   */
  const refreshPageData = async (budgetId: string): Promise<{
    goals: SharedGoalResponse[]
    invitations: InvitationResponse[]
  } | null> => {
    try {
      isRefreshing.value = true
      clearRefreshError()

      // Refresh both goals and invitations in parallel
      const [goals, invitations] = await Promise.all([
        refreshGoals(budgetId),
        loadInvitations()
      ])

      console.log('Shared goals page data refreshed successfully', {
        goalsCount: goals.length,
        invitationsCount: invitations.length
      })

      return { goals, invitations }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh shared goals data'
      setRefreshError(errorMessage)
      console.error('Error refreshing shared goals page data:', error)
      return null
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Refresh only goals data (useful for specific operations)
   */
  const refreshGoalsOnly = async (budgetId: string): Promise<SharedGoalResponse[]> => {
    try {
      isRefreshing.value = true
      clearRefreshError()

      const goals = await refreshGoals(budgetId)
      console.log('Goals data refreshed successfully', { goalsCount: goals.length })
      
      return goals
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh goals'
      setRefreshError(errorMessage)
      console.error('Error refreshing goals:', error)
      return []
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Refresh only invitations data (useful for specific operations)
   */
  const refreshInvitationsOnly = async (): Promise<InvitationResponse[]> => {
    try {
      isRefreshing.value = true
      clearRefreshError()

      const invitations = await loadInvitations()
      console.log('Invitations data refreshed successfully', { invitationsCount: invitations.length })
      
      return invitations
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh invitations'
      setRefreshError(errorMessage)
      console.error('Error refreshing invitations:', error)
      return []
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Check if page data needs refresh based on store state
   * This can be used to determine if a refresh is needed
   */
  const needsRefresh = (): boolean => {
    const goals = sharedGoalsStore.goals
    const invitations = sharedGoalsStore.invitations
    
    // Consider refresh needed if we have no data or very old data
    // This is a simple heuristic - could be enhanced with timestamps
    return goals.length === 0 && invitations.length === 0
  }

  return {
    // State
    isRefreshing,
    refreshError,

    // Operations
    refreshPageData,
    refreshGoalsOnly,
    refreshInvitationsOnly,
    needsRefresh,
    clearRefreshError,

    // Store reference for convenience
    sharedGoalsStore
  }
}
