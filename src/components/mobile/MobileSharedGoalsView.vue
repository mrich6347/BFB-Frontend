<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-background border-b border-border" style="padding-top: max(3rem, env(safe-area-inset-top));">
      <div class="px-4 pb-4 space-y-3">
        <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary/80">
          <TargetIcon class="h-3.5 w-3.5" />
          <span>Shared Goals</span>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">
            {{ activeGoals.length }} Active
          </h1>
          <p v-if="currentBudget?.name" class="text-sm text-muted-foreground mt-1">
            {{ currentBudget.name }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 pt-4 space-y-4 pb-24">
      <!-- Loading State -->
      <div v-if="isRefreshing" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="refreshError" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div class="flex items-start gap-3">
          <AlertCircleIcon class="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-destructive font-medium">Error loading goals</p>
            <p class="text-xs text-destructive/80 mt-1">{{ refreshError }}</p>
          </div>
        </div>
      </div>

      <!-- Invitations Section -->
      <div v-if="pendingInvitations.length > 0" class="space-y-2">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Invitations ({{ pendingInvitations.length }})
        </h2>
        <div
          v-for="invitation in pendingInvitations"
          :key="invitation.id"
          class="rounded-lg border border-primary/30 bg-primary/5 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <MailIcon class="h-4 w-4 text-primary flex-shrink-0" />
                <p class="text-sm font-semibold text-foreground truncate">
                  {{ invitation.goal.name }}
                </p>
              </div>
              <p class="text-xs text-muted-foreground">
                From {{ invitation.inviter_profile.display_name }}
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                Target: {{ formatCurrency(invitation.goal.target_amount) }}
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <button
                @click="handleAcceptInvitation(invitation)"
                class="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                Accept
              </button>
              <button
                @click="handleDeclineInvitation(invitation.id)"
                class="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-md hover:bg-muted/80 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Goals Section -->
      <div v-if="activeGoals.length > 0" class="space-y-2">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Active Goals
        </h2>
        <div
          v-for="goal in activeGoals"
          :key="goal.id"
          @click="handleGoalClick(goal)"
          class="rounded-lg border border-border bg-card shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
        >
          <!-- Goal Header -->
          <div class="p-4">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-foreground truncate">
                  {{ goal.name }}
                </h3>
                <p v-if="goal.description" class="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {{ goal.description }}
                </p>
              </div>
              <div class="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <UsersIcon class="h-3.5 w-3.5" />
                <span>{{ goal.participants?.length || 0 }}</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mb-3">
              <div class="flex items-center justify-between text-xs mb-1.5">
                <span class="text-muted-foreground">Progress</span>
                <span class="font-semibold text-foreground">
                  {{ formatProgressPercentage(goal.progress_percentage || 0) }}%
                </span>
              </div>
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full transition-all duration-300 rounded-full"
                  :class="getProgressBarColor(goal.progress_percentage || 0)"
                  :style="{ width: `${Math.min(goal.progress_percentage || 0, 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Amounts -->
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Current</p>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ formatCurrency(goal.current_amount || 0) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs text-muted-foreground mb-1">Target</p>
                <p class="text-lg font-semibold text-foreground">
                  {{ formatCurrency(goal.target_amount) }}
                </p>
              </div>
            </div>

            <!-- Participant Contributions -->
            <div v-if="goal.participants && goal.participants.length > 0" class="pt-3 border-t border-border">
              <p class="text-xs text-muted-foreground mb-2">Contributions</p>
              <div class="space-y-1.5">
                <div
                  v-for="participant in getSortedParticipants(goal.participants)"
                  :key="participant.id"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="text-muted-foreground truncate pr-2">
                    {{ participant.user_profile?.display_name || 'Unknown' }}
                  </span>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="font-medium text-foreground">
                      {{ formatCurrency(participant.current_contribution || 0) }}
                    </span>
                    <span class="text-muted-foreground">
                      ({{ formatProgressPercentage(participant.contribution_percentage || 0) }}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed Goals Section -->
      <div v-if="completedGoals.length > 0" class="space-y-2">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Completed Goals
        </h2>
        <div
          v-for="goal in completedGoals"
          :key="goal.id"
          class="rounded-lg border border-border bg-card/50 shadow-sm p-4 opacity-75"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <TrophyIcon class="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <h3 class="text-sm font-semibold text-foreground truncate">
                  {{ goal.name }}
                </h3>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ formatCurrency(goal.target_amount) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isRefreshing && activeGoals.length === 0 && completedGoals.length === 0 && pendingInvitations.length === 0" class="flex flex-col items-center justify-center min-h-[300px] p-4">
        <TargetIcon class="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p class="text-muted-foreground text-center text-sm">
          No shared goals yet.<br />
          Create one on desktop to get started!
        </p>
      </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav
      active-tab="goals"
      @navigate="handleNavigate"
    />

    <!-- Goal Onboarding Modal -->
    <GoalOnboardingModal
      :show="showOnboarding"
      :goal-name="selectedInvitationGoal?.name || ''"
      @close="closeOnboarding"
      @complete="handleOnboardingComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TargetIcon, UsersIcon, AlertCircleIcon, MailIcon, TrophyIcon } from 'lucide-vue-next'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import { useBudgetStore } from '../../stores/budget.store'
import { useSharedGoalsPageData } from '../../composables/shared-goals/useSharedGoalsPageData'
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
import { useGoalProgress } from '../../composables/shared-goals/useGoalProgress'
import MobileBottomNav from './MobileBottomNav.vue'
import GoalOnboardingModal from '../shared-goals/GoalOnboardingModal.vue'
import type { SharedGoalResponse, InvitationResponse, InvitationStatus, GoalParticipantResponse } from '../../types/DTO/shared-goal.dto'

const router = useRouter()
const sharedGoalsStore = useSharedGoalsStore()
const budgetStore = useBudgetStore()
const { refreshPageData, isRefreshing, refreshError } = useSharedGoalsPageData()
const { acceptInvitation, declineInvitation } = useGoalInvitations()
const { formatProgressPercentage, formatCurrency, getProgressBarColor } = useGoalProgress()

// State
const showOnboarding = ref(false)
const selectedInvitationGoal = ref<InvitationResponse | null>(null)

// Computed
const currentBudget = computed(() => budgetStore.currentBudget)
const goals = computed(() => sharedGoalsStore.goals)
const activeGoals = computed(() => goals.value.filter(goal => goal.status !== 'COMPLETED'))
const completedGoals = computed(() => goals.value.filter(goal => goal.status === 'COMPLETED'))
const invitations = computed(() => sharedGoalsStore.invitations)
const pendingInvitations = computed(() =>
  invitations.value.filter(inv => inv.status === 'PENDING' as InvitationStatus)
)

// Methods
const getSortedParticipants = (participants: GoalParticipantResponse[]) => {
  return [...participants].sort((a, b) => {
    const aContribution = a.current_contribution || 0
    const bContribution = b.current_contribution || 0
    return bContribution - aContribution // Sort descending (highest first)
  })
}
const handleNavigate = (tab: 'budget' | 'accounts' | 'networth' | 'goals' | 'retirement') => {
  if (tab === 'budget') {
    const budgetId = currentBudget.value?.id
    if (budgetId) {
      router.push(`/budget/${budgetId}`)
    }
  } else if (tab === 'accounts') {
    // For now, navigate to net worth and let them access accounts from there
    router.push('/net-worth')
  } else if (tab === 'networth') {
    router.push('/net-worth')
  } else if (tab === 'retirement') {
    router.push('/retirement-plan')
  }
  // Goals tab is already the current view
}

const handleGoalClick = (goal: SharedGoalResponse) => {
  // For mobile, we could show a simple detail modal or navigate to desktop view
  // For now, just log - we can enhance this later
  console.log('Goal clicked:', goal.name)
  // TODO: Could add a simple mobile detail modal here
}

const handleAcceptInvitation = (invitation: InvitationResponse) => {
  selectedInvitationGoal.value = invitation
  showOnboarding.value = true
}

const handleDeclineInvitation = async (invitationId: string) => {
  await declineInvitation(invitationId)
}

const handleOnboardingComplete = async (data: { categoryId: string; monthlyContribution: number }) => {
  if (!selectedInvitationGoal.value) return

  const success = await acceptInvitation(
    selectedInvitationGoal.value.id,
    data.categoryId,
    data.monthlyContribution
  )

  if (success) {
    closeOnboarding()
    // Refresh data to show the newly accepted goal
    const budgetId = currentBudget.value?.id
    if (budgetId) {
      await refreshPageData(budgetId)
    }
  }
}

const closeOnboarding = () => {
  showOnboarding.value = false
  selectedInvitationGoal.value = null
}

// Load data on mount
onMounted(async () => {
  const budgetId = currentBudget.value?.id
  if (budgetId) {
    await refreshPageData(budgetId)
  }
})
</script>

