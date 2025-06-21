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
      <!-- Progress Overview -->
      <div class="bg-card rounded-lg p-6 border">
        <div class="space-y-4">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground">Goal Progress</h3>
            <span :class="getProgressColor(goal.progress_percentage || 0)" class="text-lg font-bold">
              {{ formatProgressPercentage(goal.progress_percentage || 0) }}%
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-3">
            <div class="bg-secondary rounded-full h-3">
              <div
                :class="getProgressBarColor(goal.progress_percentage || 0)"
                class="h-3 rounded-full transition-all duration-500 ease-out"
                :style="{ width: `${Math.min((goal.progress_percentage || 0), 100)}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-sm text-muted-foreground">
              <span>{{ formatCurrency(goal.current_amount || 0) }}</span>
              <span>{{ formatCurrency(goal.target_amount) }}</span>
            </div>
          </div>

          <!-- Key Stats -->
          <div class="grid grid-cols-2 gap-6 pt-2">
            <div class="text-center">
              <div class="text-xl font-bold text-foreground">
                {{ formatCurrency(goal.current_amount || 0) }}
              </div>
              <div class="text-xs text-muted-foreground">Current</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-foreground">
                {{ formatCurrency(goal.target_amount - (goal.current_amount || 0)) }}
              </div>
              <div class="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>

          <!-- Completion Estimate -->
          <div v-if="projectionData?.projectedDate" class="pt-3 border-t border-border">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-muted-foreground">Estimated Completion</span>
              <span class="text-sm font-medium text-foreground">
                {{ formatDate(projectionData.projectedDate) }}
              </span>
            </div>
          </div>

          <div v-else-if="projectionData?.monthsToCompletion === null" class="pt-3 border-t border-border">
            <p class="text-sm text-muted-foreground text-center">
              Set monthly contributions to see completion estimate
            </p>
          </div>
        </div>
      </div>

      <!-- Participant Contributions -->
      <div v-if="goal.participants && goal.participants.length > 0" class="bg-card rounded-lg p-6 border">
        <h4 class="text-lg font-semibold text-foreground mb-4">Contribution Breakdown</h4>
        <div class="space-y-3">
          <div
            v-for="participant in participantsWithContributions"
            :key="participant.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-primary">
                  {{ participant.user_profile.display_name?.charAt(0) || participant.user_profile.username.charAt(0) }}
                </span>
              </div>
              <div>
                <div class="text-sm font-medium text-foreground">
                  {{ participant.user_profile.display_name || participant.user_profile.username }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ formatCurrency(participant.contribution_amount) }} contributed
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-foreground">
                {{ participant.contribution_percentage.toFixed(1) }}%
              </div>
              <div class="text-xs text-muted-foreground">
                of total
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

// Use participant data with backend-calculated percentages
const participantsWithContributions = computed(() => {
  if (!props.goal.participants) return []

  return props.goal.participants.map(participant => ({
    ...participant,
    contribution_amount: participant.current_contribution || 0,
    contribution_percentage: participant.contribution_percentage || 0
  }))
})

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
