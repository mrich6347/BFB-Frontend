<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center justify-between pr-8">
          <div class="flex items-center space-x-3">
            <span>{{ displayGoal?.name || 'Goal Details' }}</span>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getStatusBadgeClass(displayGoal?.status)"
            >
              {{ displayGoal?.status || 'active' }}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription>
          <div v-if="displayGoal?.description" class="mb-1">
            {{ displayGoal.description }}
          </div>
          <div v-if="displayGoal?.target_date" class="text-sm text-muted-foreground">
            Target Date: {{ formatDate(displayGoal.target_date) }}
          </div>
        </DialogDescription>
      </DialogHeader>

      <div v-if="displayGoal" class="space-y-6">
        <!-- Progress Section -->
        <GoalProgressChart :goal="displayGoal" />

        <!-- Participant Settings Section (for current user) -->
        <div v-if="currentUserParticipant && showParticipantSettings" class="space-y-3">
          <div class="border border-border rounded-lg p-4 bg-muted/30">
            <ParticipantSettings
              :participant="currentUserParticipant"
              :goal-id="displayGoal.id"
              @updated="handleParticipantUpdated"
            />
          </div>
        </div>

        <!-- Participants Section -->
        <div class="space-y-3">
          <button
            @click="showParticipantsList = !showParticipantsList"
            class="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-center space-x-2">
              <component
                :is="showParticipantsList ? ChevronDownIcon : ChevronRightIcon"
                class="h-4 w-4 text-muted-foreground"
              />
              <h3 class="text-sm font-medium text-foreground">Participants ({{ allParticipants.length }})</h3>
            </div>
            <Button
              v-if="isGoalCreator"
              @click.stop="openInviteModal"
              size="sm"
              variant="outline"
              class="flex items-center space-x-2"
            >
              <UserPlusIcon class="h-4 w-4" />
              <span>Invite User</span>
            </Button>
          </button>

          <div v-if="showParticipantsList" class="pl-2">
            <ParticipantList
              :goal="displayGoal"
              :participants="allParticipants"
              @update-participant="handleUpdateParticipant"
              @participant-removed="handleParticipantRemoved"
              @left-goal="handleLeftGoal"
            />
          </div>
        </div>



        <!-- Actions Section -->
        <div class="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <Button
              v-if="!isGoalCreator"
              @click="handleLeaveGoal"
              variant="outline"
              size="sm"
              class="text-destructive hover:text-destructive"
            >
              Leave Goal
            </Button>
            <Button
              v-if="isGoalCreator"
              @click="handleDeleteGoal"
              variant="outline"
              size="sm"
              class="text-destructive hover:text-destructive"
            >
              <TrashIcon class="h-4 w-4 mr-2" />
              Delete Goal
            </Button>
          </div>
          <div class="flex items-center space-x-2">
            <Button
              v-if="isGoalCreator"
              @click="handleEditGoal"
              variant="outline"
              size="sm"
            >
              Edit Goal
            </Button>
            <Button @click="handleClose" variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Invite User Modal -->
  <InviteUserModal
    :is-open="isInviteModalOpen"
    :goal="displayGoal"
    @update:is-open="isInviteModalOpen = $event"
    @invitation-sent="handleInvitationSent"
  />

  <!-- Edit Goal Modal -->
  <EditGoalModal
    :is-open="isEditModalOpen"
    :goal="displayGoal"
    @update:is-open="isEditModalOpen = $event"
    @goal-updated="handleGoalUpdated"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { UserPlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../shadcn-ui'
import Button from '../shadcn-ui/button.vue'
import ParticipantList from './ParticipantList.vue'
import ParticipantSettings from './ParticipantSettings.vue'
import InviteUserModal from './InviteUserModal.vue'
import EditGoalModal from './EditGoalModal.vue'
import GoalProgressChart from './GoalProgressChart.vue'
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
import { useSharedGoalOperations } from '../../composables/shared-goals/useSharedGoalOperations'
import { useAuthStore } from '../../stores/auth.store'
import { useUserProfileStore } from '../../stores/user-profile.store'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import type { SharedGoalResponse, InvitationResponse, GoalParticipantResponse } from '../../types/DTO/shared-goal.dto'

interface Props {
  isOpen: boolean
  goal: SharedGoalResponse | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'goalUpdated', goal: SharedGoalResponse): void
  (e: 'goalLeft', goalId: string): void
  (e: 'goalDeleted', goalId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { leaveGoal, loadGoal } = useGoalInvitations()
const { deleteGoal } = useSharedGoalOperations()
const authStore = useAuthStore()
const userProfileStore = useUserProfileStore()
const sharedGoalsStore = useSharedGoalsStore()

const isInviteModalOpen = ref(false)
const isEditModalOpen = ref(false)
const showParticipantSettings = ref(false)
const showParticipantsList = ref(false)

// Reactive goal data that updates from store
const reactiveGoal = ref<SharedGoalResponse | null>(null)

// Watch for goal changes and update reactive goal
watch(
  () => props.goal,
  (newGoal) => {
    if (newGoal) {
      // Find the latest version from store or use the prop
      const storeGoal = sharedGoalsStore.goals.find(g => g.id === newGoal.id)
      reactiveGoal.value = storeGoal || newGoal
    } else {
      reactiveGoal.value = null
    }
  },
  { immediate: true }
)

// Watch for store updates to this specific goal
watch(
  () => sharedGoalsStore.goals,
  (goals) => {
    if (props.goal?.id) {
      const updatedGoal = goals.find(g => g.id === props.goal.id)
      if (updatedGoal) {
        reactiveGoal.value = updatedGoal
      }
    }
  },
  { deep: true }
)

// Computed
const currentUserId = computed(() => userProfileStore.currentProfile?.id)

const isGoalCreator = computed(() => {
  return reactiveGoal.value?.created_by === currentUserId.value
})

// Use reactive goal for all computed properties
const displayGoal = computed(() => reactiveGoal.value || props.goal)

const allParticipants = computed(() => {
  if (!displayGoal.value?.participants) return []

  // Just return the participants from the backend - the creator should already be included
  return displayGoal.value.participants
})

const currentUserParticipant = computed(() => {
  return allParticipants.value.find(p => p.user_profile_id === currentUserId.value)
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const openInviteModal = () => {
  isInviteModalOpen.value = true
}

const handleInvitationSent = (invitation: InvitationResponse) => {
  console.log('Invitation sent from goal details:', invitation)
  // The invitation will be handled by the parent component
}

const handleUpdateParticipant = (participant: GoalParticipantResponse) => {
  // Only allow users to update their own settings
  if (participant.user_profile_id === currentUserId.value) {
    showParticipantSettings.value = !showParticipantSettings.value
  } else {
    console.log('Cannot update other participants settings')
  }
}

const handleParticipantUpdated = () => {
  console.log('Participant settings updated')
  // Hide the settings panel after successful update
  showParticipantSettings.value = false
  // The main data service will automatically refresh the data
}

const handleParticipantRemoved = (participant: GoalParticipantResponse) => {
  console.log('Participant removed:', participant)
  // Refresh the goal data to update the participant list
  if (displayGoal.value?.id) {
    loadGoal(displayGoal.value.id)
  }
}

const handleLeftGoal = () => {
  console.log('Left goal from participant list')
  emit('goalLeft', displayGoal.value?.id || '')
  handleClose()
}

const handleLeaveGoal = async () => {
  if (!displayGoal.value) return

  if (confirm(`Are you sure you want to leave "${displayGoal.value.name}"? You won't be able to rejoin unless invited again.`)) {
    const success = await leaveGoal(displayGoal.value.id)
    if (success) {
      emit('goalLeft', displayGoal.value.id)
      handleClose()
    }
  }
}

const handleEditGoal = () => {
  isEditModalOpen.value = true
}

const handleGoalUpdated = (updatedGoal: SharedGoalResponse) => {
  console.log('Goal updated:', updatedGoal)
  emit('goalUpdated', updatedGoal)
}

const handleDeleteGoal = async () => {
  if (!displayGoal.value) return

  const goalName = displayGoal.value.name
  const confirmMessage = `Are you sure you want to delete "${goalName}"? This will permanently remove the goal for all participants and cannot be undone.`

  if (confirm(confirmMessage)) {
    const success = await deleteGoal(displayGoal.value.id)
    if (success) {
      emit('goalDeleted', displayGoal.value.id)
      handleClose()
    }
  }
}

const handleClose = () => {
  showParticipantSettings.value = false
  isEditModalOpen.value = false
  emit('update:isOpen', false)
}
</script>
