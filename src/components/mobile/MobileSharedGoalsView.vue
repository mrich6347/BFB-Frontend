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
      <!-- Error State -->
      <div v-if="refreshError" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
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
          class="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        >
          <!-- Edit button (revealed on swipe) - only show if user is the creator -->
          <div v-if="isGoalCreator(goal)" class="absolute inset-y-0 right-0 flex items-center">
            <button
              @click.stop="handleEditGoal(goal)"
              class="h-full px-6 bg-blue-500 text-white font-medium flex items-center justify-center"
            >
              Edit
            </button>
          </div>

          <!-- Swipeable goal content -->
          <div
            :ref="el => setGoalRef(goal.id, el)"
            class="w-full touch-pan-y bg-card"
            :class="{ 'transition-transform duration-200 ease-out': !isSwiping(goal.id) }"
            :style="{ transform: `translateX(${getSwipeOffset(goal.id)}px)` }"
            @touchstart="isGoalCreator(goal) ? handleTouchStart($event, goal.id) : null"
            @touchmove="isGoalCreator(goal) ? handleTouchMove($event, goal.id) : null"
            @touchend="isGoalCreator(goal) ? handleTouchEnd(goal.id) : null"
            @click.stop="handleGoalClick(goal)"
          >
          <!-- Loading Skeleton Overlay -->
          <div v-if="isRefreshing" class="p-4">
            <!-- Header skeleton -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex-1 min-w-0 space-y-2">
                <div class="h-5 bg-muted rounded animate-pulse w-3/4"></div>
                <div class="h-3 bg-muted rounded animate-pulse w-1/2"></div>
              </div>
              <div class="h-4 w-8 bg-muted rounded animate-pulse"></div>
            </div>

            <!-- Progress bar skeleton -->
            <div class="mb-3">
              <div class="flex items-center justify-between mb-1.5">
                <div class="h-3 w-16 bg-muted rounded animate-pulse"></div>
                <div class="h-3 w-10 bg-muted rounded animate-pulse"></div>
              </div>
              <div class="h-2 bg-muted rounded-full animate-pulse"></div>
            </div>

            <!-- Amounts skeleton -->
            <div class="flex items-center justify-between mb-3">
              <div class="space-y-1">
                <div class="h-3 w-12 bg-muted rounded animate-pulse"></div>
                <div class="h-8 w-24 bg-muted rounded animate-pulse"></div>
              </div>
              <div class="space-y-1 items-end flex flex-col">
                <div class="h-3 w-12 bg-muted rounded animate-pulse"></div>
                <div class="h-6 w-20 bg-muted rounded animate-pulse"></div>
              </div>
            </div>

            <!-- Contributions skeleton -->
            <div class="pt-3 border-t border-border">
              <div class="h-3 w-24 bg-muted rounded animate-pulse mb-2"></div>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <div class="h-3 w-20 bg-muted rounded animate-pulse"></div>
                  <div class="h-3 w-24 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actual Goal Content -->
          <div v-else class="p-4">
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

            <!-- Recent Activity -->
            <div class="pt-3 border-t border-border">
              <p class="text-xs text-muted-foreground mb-2">Recent Activity</p>
              <GoalActivityTimeline :goal-id="goal.id" :days-back="7" />
            </div>

            <!-- Participant Contributions -->
            <div v-if="goal.participants && goal.participants.length > 0" class="pt-3 border-t border-border">
              <p class="text-xs text-muted-foreground mb-2">Contributions</p>
              <div class="space-y-1.5 pb-2">
                <div
                  v-for="participant in getSortedParticipants(goal.participants)"
                  :key="participant.id"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="text-muted-foreground truncate pr-2">
                    {{ participant.user_profile?.display_name || 'Unknown' }}
                    <span v-if="participant.monthly_contribution" class="text-muted-foreground/70">
                      ({{ formatCurrency(participant.monthly_contribution) }}/mo)
                    </span>
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

            <!-- Estimated Completion Date -->
            <div v-if="getProjectedDate(goal)" class="pt-3 border-t border-border">
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">Estimated Completion</span>
                <div class="flex items-center gap-1">
                  <span class="mr-0.5">🔮</span>
                  <span class="font-medium text-foreground">{{ formatDate(getProjectedDate(goal)) }}</span>
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
          class="rounded-lg border border-border bg-card/50 shadow-sm opacity-75"
        >
          <!-- Loading Skeleton for Completed Goal -->
          <div v-if="isRefreshing" class="p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0 space-y-2">
                <div class="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                <div class="h-3 bg-muted rounded animate-pulse w-1/3"></div>
              </div>
            </div>
          </div>

          <!-- Actual Completed Goal Content -->
          <div v-else class="p-4">
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

    <!-- Mobile Edit Goal Modal -->
    <MobileEditGoalModal
      :show="showEditGoal"
      :goal="editingGoal"
      @close="closeEditGoal"
      @updated="handleGoalUpdated"
    />

    <!-- Mobile Transaction Flow -->
    <MobileTransactionFlow
      ref="transactionFlowRef"
      @save-transaction="handleSaveTransaction"
      @save-transfer="handleSaveTransfer"
      @save-payment="handleSavePayment"
      @update-balance="handleUpdateBalance"
      @category-balance-change="handleCategoryBalanceChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TargetIcon, UsersIcon, AlertCircleIcon, MailIcon, TrophyIcon } from 'lucide-vue-next'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import { useBudgetStore } from '../../stores/budget.store'
import { useUserProfileStore } from '../../stores/user-profile.store'
import { useSharedGoalsPageData } from '../../composables/shared-goals/useSharedGoalsPageData'
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
import { useGoalProgress } from '../../composables/shared-goals/useGoalProgress'
import MobileBottomNav from './MobileBottomNav.vue'
import GoalOnboardingModal from '../shared-goals/GoalOnboardingModal.vue'
import MobileEditGoalModal from './MobileEditGoalModal.vue'
import GoalActivityTimeline from '../shared-goals/GoalActivityTimeline.vue'
import MobileTransactionFlow from './MobileTransactionFlow.vue'
import type { SharedGoalResponse, InvitationResponse, InvitationStatus, GoalParticipantResponse } from '../../types/DTO/shared-goal.dto'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import { useMakeCreditCardPayment } from '@/composables/accounts/account-write/useMakeCreditCardPayment'
import { useToast } from 'vue-toast-notification'

const router = useRouter()
const sharedGoalsStore = useSharedGoalsStore()
const budgetStore = useBudgetStore()
const userProfileStore = useUserProfileStore()
const { refreshPageData, isRefreshing, refreshError } = useSharedGoalsPageData()
const { acceptInvitation, declineInvitation } = useGoalInvitations()
const { formatProgressPercentage, formatCurrency, getProgressBarColor } = useGoalProgress()
const { createTransaction } = useTransactionOperations()
const { makeCreditCardPayment } = useMakeCreditCardPayment()
const $toast = useToast()

const transactionFlowRef = ref<InstanceType<typeof MobileTransactionFlow> | null>(null)

// State
const showOnboarding = ref(false)
const selectedInvitationGoal = ref<InvitationResponse | null>(null)
const showEditGoal = ref(false)
const editingGoal = ref<SharedGoalResponse | null>(null)

// Swipe state management
const swipeStates = ref<Record<string, { offset: number, startX: number, startTime: number, isSwiping: boolean }>>({})
const goalRefs = ref<Record<string, HTMLElement>>({})
const SWIPE_THRESHOLD = -80 // How far to swipe to reveal edit button
const SWIPE_VELOCITY_THRESHOLD = 0.3 // Minimum velocity to trigger swipe

// Computed
const currentBudget = computed(() => budgetStore.currentBudget)
const currentUserProfileId = computed(() => userProfileStore.currentProfile?.id)
const goals = computed(() => sharedGoalsStore.goals)
const activeGoals = computed(() => goals.value.filter(goal => goal.status !== 'COMPLETED'))
const completedGoals = computed(() => goals.value.filter(goal => goal.status === 'COMPLETED'))
const invitations = computed(() => sharedGoalsStore.invitations)
const pendingInvitations = computed(() =>
  invitations.value.filter(inv => inv.status === 'PENDING' as InvitationStatus)
)

// Swipe functions
const setGoalRef = (id: string, el: any) => {
  if (el) {
    goalRefs.value[id] = el
  }
}

const getSwipeOffset = (id: string) => {
  return swipeStates.value[id]?.offset || 0
}

const isSwiping = (id: string) => {
  return swipeStates.value[id]?.isSwiping || false
}

const closeOtherSwipes = (exceptId?: string) => {
  Object.keys(swipeStates.value).forEach(id => {
    if (id !== exceptId) {
      swipeStates.value[id] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }
    }
  })
}

const handleTouchStart = (event: TouchEvent, id: string) => {
  // Close other open swipes when starting a new swipe
  closeOtherSwipes(id)

  const touch = event.touches[0]
  swipeStates.value[id] = {
    offset: swipeStates.value[id]?.offset || 0,
    startX: touch.clientX,
    startTime: Date.now(),
    isSwiping: true
  }
}

const handleTouchMove = (event: TouchEvent, id: string) => {
  const state = swipeStates.value[id]
  if (!state) return

  const touch = event.touches[0]
  const deltaX = touch.clientX - state.startX
  const currentOffset = state.offset || 0

  // Only allow swiping left (negative direction)
  const newOffset = Math.min(0, Math.max(SWIPE_THRESHOLD, currentOffset + deltaX))

  swipeStates.value[id] = {
    ...state,
    offset: newOffset,
    startX: touch.clientX,
    isSwiping: true
  }
}

const handleTouchEnd = (id: string) => {
  const state = swipeStates.value[id]
  if (!state) return

  const duration = Date.now() - state.startTime
  const distance = state.offset
  const velocity = Math.abs(distance) / duration

  // Snap to open or closed based on threshold or velocity
  if (state.offset < SWIPE_THRESHOLD / 2 || velocity > SWIPE_VELOCITY_THRESHOLD) {
    // Snap to open (reveal edit button)
    swipeStates.value[id] = { ...state, offset: SWIPE_THRESHOLD, isSwiping: false }
  } else {
    // Snap to closed
    swipeStates.value[id] = { ...state, offset: 0, isSwiping: false }
  }
}

// Methods
const isGoalCreator = (goal: SharedGoalResponse): boolean => {
  return goal.created_by === currentUserProfileId.value
}
const getSortedParticipants = (participants: GoalParticipantResponse[]) => {
  return [...participants].sort((a, b) => {
    const aContribution = a.current_contribution || 0
    const bContribution = b.current_contribution || 0
    return bContribution - aContribution // Sort descending (highest first)
  })
}

const getProjectedDate = (goal: SharedGoalResponse): Date | null => {
  // If goal is already completed, don't show projection
  if (goal.status === 'COMPLETED') {
    return null
  }

  const currentAmount = goal.current_amount || 0
  const targetAmount = goal.target_amount

  // If already at or above target, no projection needed
  if (currentAmount >= targetAmount) {
    return null
  }

  // Calculate total monthly contributions from all participants
  const totalMonthlyContribution = (goal.participants || []).reduce((sum, participant) => {
    return sum + (participant.monthly_contribution || 0)
  }, 0)

  // If no monthly contributions set, can't project
  if (totalMonthlyContribution <= 0) {
    return null
  }

  const remainingAmount = targetAmount - currentAmount
  const monthsToCompletion = Math.ceil(remainingAmount / totalMonthlyContribution)

  const projectedDate = new Date()
  projectedDate.setMonth(projectedDate.getMonth() + monthsToCompletion)

  return projectedDate
}

const formatDate = (date: Date | null): string => {
  if (!date) return ''

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
const handleNavigate = (tab: 'budget' | 'accounts' | 'networth' | 'goals' | 'retirement' | 'calendar') => {
  if (tab === 'budget') {
    const budgetId = currentBudget.value?.id
    if (budgetId) {
      router.push(`/budget/${budgetId}`)
    }
  } else if (tab === 'accounts') {
    // Open transaction flow for account selection
    transactionFlowRef.value?.openFlow()
  } else if (tab === 'networth') {
    router.push('/net-worth')
  } else if (tab === 'retirement') {
    router.push('/retirement-plan')
  } else if (tab === 'calendar') {
    router.push('/calendar')
  }
  // Goals tab is already the current view
}

const handleGoalClick = (goal: SharedGoalResponse) => {
  // If the goal is swiped open, close it instead of navigating
  if (swipeStates.value[goal.id]?.offset !== 0) {
    swipeStates.value[goal.id] = {
      ...swipeStates.value[goal.id],
      offset: 0,
      isSwiping: false
    }
    return
  }

  // For mobile, we could show a simple detail modal or navigate to desktop view
  // For now, just log - we can enhance this later
  console.log('Goal clicked:', goal.name)
  // TODO: Could add a simple mobile detail modal here
}

const handleEditGoal = (goal: SharedGoalResponse) => {
  // Close the swipe
  swipeStates.value[goal.id] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }
  // Open edit modal
  editingGoal.value = goal
  showEditGoal.value = true
}

const closeEditGoal = () => {
  showEditGoal.value = false
  editingGoal.value = null
}

const handleGoalUpdated = async () => {
  // Goal is already updated in store by the modal
  // Just close the modal and refresh data
  closeEditGoal()
  const budgetId = currentBudget.value?.id
  if (budgetId) {
    await refreshPageData(budgetId)
  }
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

// Transaction handlers
const handleSaveTransaction = async (data: CreateTransactionDto) => {
  try {
    await createTransaction(data)
    // Optimistic update provides instant feedback, no need to show toast
  } catch (error) {
    console.error('Failed to create transaction:', error)
    $toast.error('Failed to create transaction')
  }
}

const handleSaveTransfer = async (data: CreateTransactionDto) => {
  try {
    await createTransaction(data)
    // Optimistic update provides instant feedback, no need to show toast
  } catch (error) {
    console.error('Failed to create transfer:', error)
    $toast.error('Failed to create transfer')
  }
}

const handleSavePayment = async (creditCardAccountId: string, amount: number, fromAccountId: string, memo?: string) => {
  try {
    await makeCreditCardPayment(creditCardAccountId, amount, fromAccountId, memo)
    // Optimistic update provides instant feedback, no need to show toast
  } catch (error) {
    console.error('Failed to create payment:', error)
    $toast.error('Failed to create payment')
  }
}

const handleUpdateBalance = async (accountId: string, newBalance: number) => {
  // This handler is required by MobileTransactionFlow but not used on this page
  console.log('Update balance:', accountId, newBalance)
}

const handleCategoryBalanceChange = (categoryName: string, oldBalance: number, newBalance: number) => {
  // This handler is required by MobileTransactionFlow but not used on this page
  console.log('Category balance change:', categoryName, oldBalance, newBalance)
}

// Load data on mount
onMounted(async () => {
  const budgetId = currentBudget.value?.id
  if (budgetId) {
    await refreshPageData(budgetId)
  }
})
</script>

