import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { SharedGoalResponse, InvitationResponse } from '../types/DTO/shared-goal.dto'

export const useSharedGoalsStore = defineStore('sharedGoals', () => {
  // State
  const goals = ref<SharedGoalResponse[]>([])
  const currentGoal = ref<SharedGoalResponse | null>(null)
  const invitations = ref<InvitationResponse[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Basic state management only (following architecture pattern)
  const setGoals = (newGoals: SharedGoalResponse[]) => {
    goals.value = newGoals
  }

  const addGoal = (goal: SharedGoalResponse) => {
    goals.value.unshift(goal)
  }

  const updateGoal = (goalId: string, updates: Partial<SharedGoalResponse>) => {
    const index = goals.value.findIndex(g => g.id === goalId)
    if (index !== -1) {
      goals.value[index] = { ...goals.value[index], ...updates }
    }

    // Also update currentGoal if it's the same one
    if (currentGoal.value?.id === goalId) {
      currentGoal.value = { ...currentGoal.value, ...updates }
    }
  }

  const updateGoalProgress = (goalId: string, updatedGoal: SharedGoalResponse) => {
    // Update the goal with new progress data
    updateGoal(goalId, {
      current_amount: updatedGoal.current_amount,
      progress_percentage: updatedGoal.progress_percentage,
      participants: updatedGoal.participants
    })
  }

  const removeGoal = (goalId: string) => {
    const index = goals.value.findIndex(g => g.id === goalId)
    if (index !== -1) {
      goals.value.splice(index, 1)
    }

    // Clear currentGoal if it was the removed goal
    if (currentGoal.value?.id === goalId) {
      currentGoal.value = null
    }
  }

  const setCurrentGoal = (goal: SharedGoalResponse | null) => {
    currentGoal.value = goal
  }

  const setInvitations = (newInvitations: InvitationResponse[]) => {
    invitations.value = newInvitations
  }

  const addInvitation = (invitation: InvitationResponse) => {
    invitations.value.unshift(invitation)
  }

  const updateInvitation = (invitationId: string, updates: Partial<InvitationResponse>) => {
    const index = invitations.value.findIndex(i => i.id === invitationId)
    if (index !== -1) {
      invitations.value[index] = { ...invitations.value[index], ...updates }
    }
  }

  const removeInvitation = (invitationId: string) => {
    const index = invitations.value.findIndex(i => i.id === invitationId)
    if (index !== -1) {
      invitations.value.splice(index, 1)
    }
  }



  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    goals.value = []
    currentGoal.value = null
    invitations.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // State (readonly)
    goals: readonly(goals),
    currentGoal: readonly(currentGoal),
    invitations: readonly(invitations),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    setGoals,
    addGoal,
    updateGoal,
    updateGoalProgress,
    removeGoal,
    setCurrentGoal,
    setInvitations,
    addInvitation,
    updateInvitation,
    removeInvitation,
    setLoading,
    setError,
    clearError,
    reset
  }
})
