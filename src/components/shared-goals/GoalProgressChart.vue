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
        <div class="space-y-2">
          <div
            v-for="participant in participantsWithContributions"
            :key="participant.id"
            class="flex items-center justify-between py-2"
          >
            <div class="flex items-center space-x-2 flex-1 min-w-0">
              <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-medium text-primary">
                  {{ participant.user_profile.display_name?.charAt(0) || participant.user_profile.username.charAt(0) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-foreground truncate">
                  {{ participant.user_profile.display_name || participant.user_profile.username }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ formatCurrency(participant.contribution_amount) }}
                  <span v-if="participant.monthly_contribution" class="ml-1">
                    ({{ formatCurrency(participant.monthly_contribution) }}/mo)
                  </span>
                </div>
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-2">
              <div class="text-sm font-bold text-foreground">
                {{ participant.contribution_percentage.toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircleIcon } from 'lucide-vue-next'
import { useGoalProgress } from '../../composables/shared-goals/useGoalProgress'
import type { SharedGoalResponse } from '../../types/DTO/shared-goal.dto'

interface Props {
  goal: SharedGoalResponse
  isLoading?: boolean
  error?: string | null
}

const props = defineProps<Props>()

const {
  formatProgressPercentage,
  formatCurrency,
  getProgressColor,
  getProgressBarColor,
  calculateProjections
} = useGoalProgress()

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
</script>
