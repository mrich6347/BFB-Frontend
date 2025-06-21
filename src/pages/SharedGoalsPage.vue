<template>
  <div class="flex h-screen">
    <Sidebar :budgetId="currentBudgetId" />
    <div class="flex-1 bg-background overflow-auto">
      <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-foreground">Shared Goals</h1>
            <p class="mt-2 text-muted-foreground">
              Collaborate with others to achieve your financial goals together.
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="handleRefreshData"
              :disabled="isRefreshing"
              class="inline-flex items-center px-3 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh shared goals data"
            >
              <RefreshCwIcon :class="['h-4 w-4 mr-2', { 'animate-spin': isRefreshing }]" />
              Refresh
            </button>
            <button
              v-if="invitations.length > 0"
              @click="showInvitations = !showInvitations"
              class="relative inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
            >
              <MailIcon class="h-4 w-4 mr-2" />
              Invitations
              <span class="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                {{ invitations.length }}
              </span>
            </button>
            <button
              @click="isCreateModalOpen = true"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              Create Goal
            </button>
          </div>
        </div>
      </div>

      <!-- Invitations Panel -->
      <div v-if="showInvitations" class="mb-8">
        <div class="bg-card rounded-lg border border-border shadow-sm p-6">
          <InvitationManager
            @invitation-accepted="handleInvitationAccepted"
            @invitation-declined="handleInvitationDeclined"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span class="ml-3 text-muted-foreground">Loading goals...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error || refreshError" class="rounded-md bg-destructive/10 border border-destructive/20 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <AlertCircleIcon class="h-5 w-5 text-destructive" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-destructive">Error</h3>
            <p class="mt-1 text-sm text-destructive/80">{{ error || refreshError }}</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!goals || goals.length === 0" class="text-center py-12">
        <TargetIcon class="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 class="mt-2 text-sm font-medium text-foreground">No shared goals</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Get started by creating your first shared goal.
        </p>
        <div class="mt-6">
          <button
            @click="isCreateModalOpen = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Create Goal
          </button>
        </div>
      </div>

      <!-- Goals Grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="goal in goals"
          :key="goal.id"
          class="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="p-6">
            <!-- Goal Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 cursor-pointer" @click="handleGoalClick(goal)">
                <h3 class="text-lg font-medium text-card-foreground truncate">
                  {{ goal.name }}
                </h3>
                <p v-if="goal.description" class="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {{ goal.description }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0 flex items-center space-x-2">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClasses(goal.status)"
                >
                  {{ goal.status }}
                </span>
                <!-- Invite Button for Goal Creator -->
                <button
                  v-if="isGoalCreator(goal)"
                  @click.stop="openInviteModal(goal)"
                  class="inline-flex items-center p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title="Invite users"
                >
                  <UserPlusIcon class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Progress -->
            <div class="mt-4 cursor-pointer" @click="handleGoalClick(goal)">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Progress</span>
                <span class="font-medium text-card-foreground">
                  {{ formatCurrency(goal.current_amount || 0) }} / {{ formatCurrency(goal.target_amount) }}
                </span>
              </div>
              <div class="mt-2 bg-secondary rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${Math.min((goal.progress_percentage || 0), 100)}%` }"
                ></div>
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                {{ Math.round(goal.progress_percentage || 0) }}% complete
              </div>
            </div>

            <!-- Goal Info -->
            <div class="mt-4 flex items-center justify-between text-sm text-muted-foreground cursor-pointer" @click="handleGoalClick(goal)">
              <div class="flex items-center">
                <UsersIcon class="h-4 w-4 mr-1" />
                {{ goal.participants?.length || 0 }} participant{{ (goal.participants?.length || 0) !== 1 ? 's' : '' }}
              </div>
              <div v-if="goal.target_date" class="flex items-center">
                <CalendarIcon class="h-4 w-4 mr-1" />
                {{ formatDate(goal.target_date) }}
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <button
                  v-if="!isGoalCreator(goal)"
                  @click.stop="handleLeaveGoal(goal)"
                  class="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Leave Goal
                </button>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click.stop="handleGoalClick(goal)"
                  class="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>

  <!-- Create Goal Modal -->
  <CreateGoalModal
    :is-open="isCreateModalOpen"
    @update:is-open="isCreateModalOpen = $event"
    @goal-created="handleGoalCreated"
  />

  <!-- Goal Details Modal -->
  <GoalDetailsModal
    :is-open="isGoalDetailsModalOpen"
    :goal="selectedGoal"
    @update:is-open="isGoalDetailsModalOpen = $event"
    @goal-updated="handleGoalUpdated"
    @goal-left="handleGoalLeft"
    @goal-deleted="handleGoalDeleted"
  />

  <!-- Invite User Modal -->
  <InviteUserModal
    :is-open="isInviteModalOpen"
    :goal="selectedGoalForInvite"
    @update:is-open="isInviteModalOpen = $event"
    @invitation-sent="handleInvitationSent"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon, TargetIcon, UsersIcon, CalendarIcon, AlertCircleIcon, MailIcon, UserPlusIcon, RefreshCwIcon } from 'lucide-vue-next'
import { useSharedGoalOperations } from '../composables/shared-goals/useSharedGoalOperations'
import { useGoalInvitations } from '../composables/shared-goals/useGoalInvitations'
import { useSharedGoalsPageData } from '../composables/shared-goals/useSharedGoalsPageData'
import { useSharedGoalsStore } from '../stores/shared-goals.store'
import { useBudgetStore } from '../stores/budget.store'
import Sidebar from '../components/Sidebar.vue'
import CreateGoalModal from '../components/shared-goals/CreateGoalModal.vue'
import GoalDetailsModal from '../components/shared-goals/GoalDetailsModal.vue'
import { useAuthStore } from '../stores/auth.store'
import InviteUserModal from '../components/shared-goals/InviteUserModal.vue'
import InvitationManager from '../components/shared-goals/InvitationManager.vue'
import type { SharedGoalResponse, GoalStatus, InvitationResponse } from '../types/DTO/shared-goal.dto'

const router = useRouter()
const { isLoading, error } = useSharedGoalOperations()
const { leaveGoal } = useGoalInvitations()
const { refreshPageData, isRefreshing, refreshError, clearRefreshError } = useSharedGoalsPageData()
const sharedGoalsStore = useSharedGoalsStore()
const budgetStore = useBudgetStore()
const authStore = useAuthStore()

const isCreateModalOpen = ref(false)
const isGoalDetailsModalOpen = ref(false)
const selectedGoal = ref<SharedGoalResponse | null>(null)
const isInviteModalOpen = ref(false)
const selectedGoalForInvite = ref<SharedGoalResponse | null>(null)
const showInvitations = ref(false)

// Computed
const goals = computed(() => sharedGoalsStore.goals)
const invitations = computed(() => sharedGoalsStore.invitations)
const currentBudgetId = computed(() => budgetStore.currentBudget?.id || '')

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getStatusClasses = (status: GoalStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-primary/10 text-primary'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'PAUSED':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'CANCELLED':
      return 'bg-destructive/10 text-destructive'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}

const isGoalCreator = (goal: any): boolean => {
  return goal.created_by === authStore.userProfile?.id
}

const handleGoalClick = (goal: any) => {
  selectedGoal.value = goal
  isGoalDetailsModalOpen.value = true
}

const handleGoalCreated = (goal: SharedGoalResponse) => {
  console.log('Goal created:', goal)
  // Goal is already added to store by the composable
}

const handleGoalUpdated = (goal: SharedGoalResponse) => {
  console.log('Goal updated:', goal)
  // Goal is already updated in store by the composable
}

const handleGoalLeft = (goalId: string) => {
  console.log('Left goal:', goalId)
  // Goal is already removed from store by the composable
}

const handleGoalDeleted = (goalId: string) => {
  console.log('Goal deleted:', goalId)
  // Goal is already removed from store by the composable
}

const openInviteModal = (goal: any) => {
  // Convert readonly goal to mutable object for the modal
  selectedGoalForInvite.value = {
    id: goal.id,
    name: goal.name,
    description: goal.description,
    target_amount: goal.target_amount,
    target_date: goal.target_date,
    created_by: goal.created_by,
    budget_id: goal.budget_id,
    status: goal.status,
    created_at: goal.created_at,
    updated_at: goal.updated_at,
    creator_profile: goal.creator_profile,
    participants: goal.participants,
    current_amount: goal.current_amount,
    progress_percentage: goal.progress_percentage
  }
  isInviteModalOpen.value = true
}

const handleInvitationSent = (invitation: InvitationResponse) => {
  console.log('Invitation sent:', invitation)
  // Invitation is already added to store by the composable
}

const handleInvitationAccepted = (invitation: InvitationResponse) => {
  console.log('Invitation accepted:', invitation)
  showInvitations.value = false
  // Refresh goals data to show the user as a participant
  // This will happen automatically via main data service
}

const handleInvitationDeclined = (invitation: InvitationResponse) => {
  console.log('Invitation declined:', invitation)
}

const handleLeaveGoal = async (goal: any) => {
  if (confirm(`Are you sure you want to leave "${goal.name}"? You won't be able to rejoin unless invited again.`)) {
    const success = await leaveGoal(goal.id)
    if (success) {
      console.log('Left goal:', goal.name)
    }
  }
}

const handleRefreshData = async () => {
  const currentBudgetId = budgetStore.currentBudget?.id
  if (currentBudgetId) {
    // Clear any previous refresh errors
    clearRefreshError()

    // Refresh page data to get the latest goals and invitations
    const result = await refreshPageData(currentBudgetId)

    if (result) {
      console.log('Shared goals page data refreshed manually', {
        goalsCount: result.goals.length,
        invitationsCount: result.invitations.length
      })
    } else {
      console.error('Failed to refresh shared goals page data manually')
    }
  }
}

// Refresh shared goals data when page is mounted to ensure fresh data
onMounted(async () => {
  const currentBudgetId = budgetStore.currentBudget?.id
  if (currentBudgetId) {
    // Clear any previous refresh errors
    clearRefreshError()

    // Refresh page data to get the latest goals and invitations
    const result = await refreshPageData(currentBudgetId)

    if (result) {
      console.log('Shared goals page data refreshed successfully on mount', {
        goalsCount: result.goals.length,
        invitationsCount: result.invitations.length
      })
    } else {
      console.error('Failed to refresh shared goals page data on mount')
    }
  }
})
</script>
