<template>
  <div class="w-full space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span class="ml-3 text-muted-foreground">Loading progress...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-destructive/10 border border-destructive/20 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <AlertCircleIcon class="h-5 w-5 text-destructive" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive">Error</h3>
          <p class="mt-1 text-sm text-destructive/80">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Progress Content -->
    <div v-else class="space-y-4">
      <!-- Compact Progress Overview -->
      <div class="bg-card rounded-lg p-4 border">
        <div class="space-y-3">
          <!-- Progress Bar with inline stats -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-foreground">{{ formatCurrency(goal.current_amount || 0) }}</span>
              <span class="text-muted-foreground">of {{ formatCurrency(goal.target_amount) }}</span>
            </div>
            <div class="bg-secondary rounded-full h-2">
              <div
                class="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                :style="{ width: `${Math.min((goal.progress_percentage || 0), 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Remaining and Projection -->
          <div class="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div class="text-sm font-medium text-foreground">
                {{ formatCurrency(goal.target_amount - (goal.current_amount || 0)) }} left
              </div>
              <div v-if="projectionData?.projectedDate" class="space-y-0.5">
                <div class="text-xs text-muted-foreground">
                  Est. {{ formatDate(projectionData.projectedDate) }}
                </div>
                <div class="text-xs text-muted-foreground/70">
                  (based on {{ formatCurrency(projectionData.totalMonthlyContribution) }}/mo total)
                </div>
              </div>
              <div v-else class="text-xs text-muted-foreground">
                Set contributions for estimate
              </div>
            </div>
            <div :class="getProgressColor(goal.progress_percentage || 0)" class="text-2xl font-bold">
              {{ formatProgressPercentage(goal.progress_percentage || 0) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Participant Contributions -->
      <div v-if="goal.participants && goal.participants.length > 0" class="bg-card rounded-lg p-4 border">
        <h4 class="text-sm font-semibold text-foreground mb-3">Contributors</h4>
        <div class="space-y-3">
          <div
            v-for="participant in participantsWithContributions"
            :key="participant.id"
            class="py-2"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-3 flex-1 min-w-0">
                <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-xs font-medium text-primary">
                    {{ participant.user_profile.display_name?.charAt(0) || participant.user_profile.username.charAt(0) }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-foreground truncate">
                      {{ participant.user_profile.display_name || participant.user_profile.username }}
                    </span>
                    <span class="text-lg font-semibold text-green-600">
                      {{ formatCurrency(participant.contribution_amount) }}
                    </span>
                    <button
                      v-if="isCreator"
                      @click="toggleEditParticipant(participant.id)"
                      class="ml-1 p-1 hover:bg-muted rounded transition-colors"
                      title="Edit monthly contribution"
                    >
                      <SettingsIcon class="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>

                  <!-- Inline Edit Form -->
                  <div v-if="editingParticipantId === participant.id" class="mt-2 space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="relative flex-1 max-w-xs">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input
                          v-model="editMonthlyContribution"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          class="w-full pl-8 pr-4 py-1.5 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          :class="{ 'border-destructive': editError }"
                          @keyup.enter="saveEdit(participant)"
                          @keyup.escape="cancelEdit"
                        />
                      </div>
                      <button
                        @click="saveEdit(participant)"
                        :disabled="isSaving"
                        class="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {{ isSaving ? 'Saving...' : 'Save' }}
                      </button>
                      <button
                        @click="cancelEdit"
                        :disabled="isSaving"
                        class="px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p v-if="editError" class="text-xs text-destructive">{{ editError }}</p>
                    <p class="text-xs text-muted-foreground">Monthly contribution estimate for projections</p>
                  </div>

                  <!-- Display monthly contribution when not editing -->
                  <div v-else>
                    <div v-if="participant.monthly_contribution" class="text-xs text-muted-foreground mt-0.5">
                      (Contributing {{ formatCurrency(participant.monthly_contribution) }} a month)
                    </div>
                    <div v-else class="text-xs text-muted-foreground/60 mt-0.5">
                      (No monthly contribution set)
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-2">
                <div class="text-sm font-bold text-foreground">
                  {{ safeToFixed(participant.contribution_percentage, 1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertCircleIcon, SettingsIcon } from 'lucide-vue-next'
import { useGoalProgress } from '../../composables/shared-goals/useGoalProgress'
import { useUserProfileStore } from '../../stores/user-profile.store'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import { SharedGoalsService } from '../../services/shared-goals.service'
import type { SharedGoalResponse, GoalParticipantResponse } from '../../types/DTO/shared-goal.dto'
import { safeToFixed } from '../../utils/numberFormatUtil'

interface Props {
  goal: SharedGoalResponse
  isLoading?: boolean
  error?: string | null
}

const props = defineProps<Props>()

const userProfileStore = useUserProfileStore()
const sharedGoalsStore = useSharedGoalsStore()

// Inline editing state
const editingParticipantId = ref<string | null>(null)
const editMonthlyContribution = ref('')
const editError = ref('')
const isSaving = ref(false)

const {
  formatProgressPercentage,
  formatCurrency,
  getProgressColor,
  getProgressBarColor,
  calculateProjections,
  loadGoalProgress
} = useGoalProgress()

// Check if current user is the creator
const isCreator = computed(() => {
  if (!userProfileStore.currentProfile || !props.goal.creator_profile) return false
  return userProfileStore.currentProfile.username === props.goal.creator_profile.username
})

// Calculate projection data
const projectionData = computed(() => {
  if (!props.goal.participants) return null

  return calculateProjections(
    props.goal.target_amount,
    props.goal.current_amount || 0,
    props.goal.participants.map(p => ({
      ...p,
      current_contribution: p.category?.available_balance || 0,
      contribution_percentage: 0 // This would be calculated if needed
    }))
  )
})

// Use participant data with backend-calculated percentages, sorted by percentage (highest first)
const participantsWithContributions = computed(() => {
  if (!props.goal.participants) return []

  return props.goal.participants
    .map(participant => ({
      ...participant,
      contribution_amount: participant.current_contribution || 0,
      contribution_percentage: participant.contribution_percentage || 0
    }))
    .sort((a, b) => b.contribution_percentage - a.contribution_percentage)
})

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const toggleEditParticipant = (participantId: string) => {
  if (editingParticipantId.value === participantId) {
    cancelEdit()
  } else {
    const participant = props.goal.participants?.find(p => p.id === participantId)
    if (participant) {
      editingParticipantId.value = participantId
      editMonthlyContribution.value = participant.monthly_contribution?.toString() || ''
      editError.value = ''
    }
  }
}

const validateEdit = (): boolean => {
  editError.value = ''

  if (editMonthlyContribution.value === '') {
    return true // Allow clearing the value
  }

  const value = parseFloat(editMonthlyContribution.value)

  if (isNaN(value)) {
    editError.value = 'Please enter a valid number'
    return false
  }

  if (value < 0) {
    editError.value = 'Amount must be 0 or greater'
    return false
  }

  if (value > 999999.99) {
    editError.value = 'Amount is too large'
    return false
  }

  return true
}

const saveEdit = async (participant: GoalParticipantResponse) => {
  if (!validateEdit()) {
    return
  }

  try {
    isSaving.value = true
    editError.value = ''

    const updateData = {
      monthly_contribution: editMonthlyContribution.value ? parseFloat(editMonthlyContribution.value) : undefined
    }

    await SharedGoalsService.updateParticipantByCreator(props.goal.id, participant.id, updateData)

    // Refresh goal progress
    try {
      const progressData = await loadGoalProgress(props.goal.id)
      if (progressData) {
        sharedGoalsStore.updateGoalProgress(props.goal.id, progressData.goal)
      }
    } catch (err) {
      console.error('Failed to refresh goal progress:', err)
    }

    cancelEdit()
  } catch (err: any) {
    editError.value = err.response?.data?.message || 'Failed to update monthly contribution'
    console.error('Error updating participant contribution:', err)
  } finally {
    isSaving.value = false
  }
}

const cancelEdit = () => {
  editingParticipantId.value = null
  editMonthlyContribution.value = ''
  editError.value = ''
}
</script>
