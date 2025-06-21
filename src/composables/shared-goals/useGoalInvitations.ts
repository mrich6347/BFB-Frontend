import { ref } from 'vue'
import { useToast } from 'vue-toast-notification'
import { SharedGoalsService } from '../../services/shared-goals.service'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import { useBudgetStore } from '../../stores/budget.store'
import type {
  CreateInvitationDto,
  InvitationResponse,
  GoalParticipantResponse,
  UpdateParticipantDto
} from '../../types/DTO/shared-goal.dto'

export function useGoalInvitations() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()
  const sharedGoalsStore = useSharedGoalsStore()
  const budgetStore = useBudgetStore()

  const setError = (errorMessage: string) => {
    error.value = errorMessage
    sharedGoalsStore.setError(errorMessage)
  }

  const clearError = () => {
    error.value = null
    sharedGoalsStore.clearError()
  }

  // ===== INVITATION OPERATIONS =====

  const inviteUser = async (goalId: string, invitationData: CreateInvitationDto): Promise<InvitationResponse | null> => {
    try {
      isLoading.value = true
      clearError()

      const invitation = await SharedGoalsService.inviteUser(goalId, invitationData)

      // Add to store
      sharedGoalsStore.addInvitation(invitation)

      toast.success(`Invitation sent to ${invitationData.invitee_username}!`)
      return invitation
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send invitation'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error sending invitation:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const loadInvitations = async (): Promise<InvitationResponse[]> => {
    try {
      isLoading.value = true
      clearError()

      const invitations = await SharedGoalsService.getInvitations()

      // Update store
      sharedGoalsStore.setInvitations(invitations)

      return invitations
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load invitations'
      setError(errorMessage)
      console.error('Error loading invitations:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const acceptInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      clearError()

      await SharedGoalsService.acceptInvitation(invitationId)

      // Remove from store (it's no longer pending)
      sharedGoalsStore.removeInvitation(invitationId)

      // Refresh shared goals to show the newly joined goal
      if (budgetStore.currentBudget?.id) {
        try {
          const updatedGoals = await SharedGoalsService.findAll(budgetStore.currentBudget.id)
          sharedGoalsStore.setGoals(updatedGoals)
        } catch (refreshError) {
          console.error('Failed to refresh goals after accepting invitation:', refreshError)
          // Don't fail the whole operation if refresh fails
        }
      }

      toast.success('Invitation accepted! You are now part of the goal.')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to accept invitation'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error accepting invitation:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const declineInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      clearError()

      await SharedGoalsService.declineInvitation(invitationId)

      // Remove from store (it's no longer pending)
      sharedGoalsStore.removeInvitation(invitationId)

      toast.success('Invitation declined.')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to decline invitation'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error declining invitation:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ===== PARTICIPANT OPERATIONS =====

  const loadParticipants = async (goalId: string): Promise<GoalParticipantResponse[]> => {
    try {
      isLoading.value = true
      clearError()

      // Note: Participants are typically loaded as part of the goal data
      // This method is for cases where we need to refresh participant data specifically
      const participants = await SharedGoalsService.findById(goalId)

      return participants.participants || []
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load participants'
      setError(errorMessage)
      console.error('Error loading participants:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const leaveGoal = async (goalId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      clearError()

      await SharedGoalsService.leaveGoal(goalId)

      // Remove goal from store since user is no longer a participant
      sharedGoalsStore.removeGoal(goalId)

      toast.success('You have left the goal.')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to leave goal'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error leaving goal:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const removeParticipant = async (goalId: string, participantId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      clearError()

      await SharedGoalsService.removeParticipant(goalId, participantId)

      toast.success('Participant removed from goal.')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to remove participant'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error removing participant:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateParticipant = async (goalId: string, participantData: UpdateParticipantDto): Promise<boolean> => {
    try {
      isLoading.value = true
      clearError()

      await SharedGoalsService.updateParticipant(goalId, participantData)

      toast.success('Participant settings updated!')
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

  return {
    // State
    isLoading,
    error,

    // Invitation operations
    inviteUser,
    loadInvitations,
    acceptInvitation,
    declineInvitation,

    // Participant operations
    loadParticipants,
    leaveGoal,
    removeParticipant,
    updateParticipant,

    // Utility
    clearError
  }
}
