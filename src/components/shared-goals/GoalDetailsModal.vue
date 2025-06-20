<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center justify-between">
          <span>{{ goal?.name || 'Goal Details' }}</span>
          <div class="flex items-center space-x-2">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getStatusBadgeClass(goal?.status)"
            >
              {{ goal?.status || 'active' }}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription v-if="goal?.description">
          {{ goal.description }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="goal" class="space-y-6">
        <!-- Progress Section -->
        <div class="space-y-3">
          <h3 class="text-lg font-medium text-foreground">Progress</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Current Progress</span>
              <span class="font-medium text-foreground">
                {{ formatCurrency(goal.current_amount || 0) }} / {{ formatCurrency(goal.target_amount) }}
              </span>
            </div>
            <div class="bg-secondary rounded-full h-3">
              <div
                class="bg-primary h-3 rounded-full transition-all duration-300"
                :style="{ width: `${Math.min((goal.progress_percentage || 0), 100)}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ Math.round(goal.progress_percentage || 0) }}% complete</span>
              <span v-if="goal.target_date">
                Target: {{ formatDate(goal.target_date) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Participants Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-foreground">Participants</h3>
            <Button
              v-if="isGoalCreator"
              @click="openInviteModal"
              size="sm"
              variant="outline"
              class="flex items-center space-x-2"
            >
              <UserPlusIcon class="h-4 w-4" />
              <span>Invite User</span>
            </Button>
          </div>

          <ParticipantList
            :goal="goal"
            :participants="allParticipants"
            @invite-user="openInviteModal"
            @update-participant="handleUpdateParticipant"
            @participant-removed="handleParticipantRemoved"
            @left-goal="handleLeftGoal"
          />
        </div>

        <!-- Goal Info Section -->
        <div class="space-y-3">
          <h3 class="text-lg font-medium text-foreground">Goal Information</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">Created by:</span>
              <p class="font-medium">{{ goal.creator_profile?.display_name || 'Unknown' }}</p>
            </div>
            <div>
              <span class="text-muted-foreground">Created on:</span>
              <p class="font-medium">{{ formatDate(goal.created_at) }}</p>
            </div>
            <div>
              <span class="text-muted-foreground">Target Amount:</span>
              <p class="font-medium">{{ formatCurrency(goal.target_amount) }}</p>
            </div>
            <div v-if="goal.target_date">
              <span class="text-muted-foreground">Target Date:</span>
              <p class="font-medium">{{ formatDate(goal.target_date) }}</p>
            </div>
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
    :goal="goal"
    @update:is-open="isInviteModalOpen = $event"
    @invitation-sent="handleInvitationSent"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserPlusIcon } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../shadcn-ui'
import Button from '../shadcn-ui/button.vue'
import ParticipantList from './ParticipantList.vue'
import InviteUserModal from './InviteUserModal.vue'
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
import { useAuthStore } from '../../stores/auth.store'
import type { SharedGoalResponse, InvitationResponse, GoalParticipantResponse } from '../../types/DTO/shared-goal.dto'

interface Props {
  isOpen: boolean
  goal: SharedGoalResponse | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'goalUpdated', goal: SharedGoalResponse): void
  (e: 'goalLeft', goalId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { leaveGoal } = useGoalInvitations()
const authStore = useAuthStore()

const isInviteModalOpen = ref(false)

// Computed
const currentUserId = computed(() => authStore.userProfile?.id)

const isGoalCreator = computed(() => {
  return props.goal?.created_by === currentUserId.value
})

const allParticipants = computed(() => {
  if (!props.goal) return []

  const participants: GoalParticipantResponse[] = []

  // Add creator as first participant
  if (props.goal.creator_profile) {
    participants.push({
      id: `creator-${props.goal.created_by}`,
      goal_id: props.goal.id,
      user_profile_id: props.goal.created_by,
      joined_at: props.goal.created_at,
      user_profile: props.goal.creator_profile,
      monthly_contribution: null,
      category: null
    })
  }

  // Add other participants
  if (props.goal.participants) {
    participants.push(...props.goal.participants)
  }

  return participants
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
  console.log('Update participant:', participant)
  // TODO: Implement update participant functionality
}

const handleParticipantRemoved = (participant: GoalParticipantResponse) => {
  console.log('Participant removed:', participant)
  // Participant removal is handled by the ParticipantList component
}

const handleLeftGoal = () => {
  console.log('Left goal from participant list')
  emit('goalLeft', props.goal?.id || '')
  handleClose()
}

const handleLeaveGoal = async () => {
  if (!props.goal) return

  if (confirm(`Are you sure you want to leave "${props.goal.name}"? You won't be able to rejoin unless invited again.`)) {
    const success = await leaveGoal(props.goal.id)
    if (success) {
      emit('goalLeft', props.goal.id)
      handleClose()
    }
  }
}

const handleEditGoal = () => {
  console.log('Edit goal:', props.goal)
  // TODO: Implement edit goal functionality
}

const handleClose = () => {
  emit('update:isOpen', false)
}
</script>
