<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-foreground">
        Participants ({{ participants.length }})
      </h3>
      <Button
        v-if="isGoalCreator"
        variant="outline"
        size="sm"
        @click="$emit('inviteUser')"
      >
        <UserPlusIcon class="h-4 w-4 mr-2" />
        Invite User
      </Button>
    </div>

    <!-- Participants List -->
    <div class="space-y-3">
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="border border-border rounded-lg p-4 bg-card"
      >
        <div class="flex items-center justify-between">
          <!-- Participant Info -->
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
              {{ participant.user_profile.display_name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <p class="font-medium text-foreground">
                  {{ participant.user_profile.display_name }}
                </p>
                <span v-if="participant.user_profile_id === goal?.created_by" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Creator
                </span>
              </div>
              <p class="text-sm text-muted-foreground">
                @{{ participant.user_profile.username }}
              </p>
              <div class="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                <span>Joined {{ formatDate(participant.joined_at) }}</span>
                <span v-if="participant.monthly_contribution" class="flex items-center space-x-1">
                  <DollarSignIcon class="h-3 w-3" />
                  <span>{{ formatCurrency(participant.monthly_contribution) }}/month</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2">
            <!-- Category Status -->
            <div class="text-right">
              <div v-if="participant.category" class="text-xs text-muted-foreground">
                Tracking: {{ participant.category.name }}
              </div>
              <div v-else class="text-xs text-yellow-600">
                No category selected
              </div>
              <div v-if="participant.category?.available_balance !== undefined" class="text-sm font-medium text-foreground">
                {{ formatCurrency(participant.category.available_balance) }}
              </div>
            </div>

            <!-- Action Buttons -->
            <div v-if="canManageParticipant(participant)" class="flex items-center space-x-2">
              <Button
                v-if="isCurrentUser(participant)"
                @click="$emit('updateParticipant', participant)"
                variant="ghost"
                size="sm"
                class="text-xs"
              >
                <SettingsIcon class="h-3 w-3 mr-1" />
                Settings
              </Button>
              <Button
                v-if="isCurrentUser(participant) && !isGoalCreator"
                @click="handleLeaveGoal(participant)"
                variant="ghost"
                size="sm"
                class="text-xs text-destructive hover:text-destructive"
              >
                <LogOutIcon class="h-3 w-3 mr-1" />
                Leave
              </Button>
              <Button
                v-if="isGoalCreator && !isCurrentUser(participant)"
                @click="handleRemoveParticipant(participant)"
                variant="ghost"
                size="sm"
                class="text-xs text-destructive hover:text-destructive"
              >
                <UserMinusIcon class="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        <!-- Progress Contribution (if available) -->
        <div v-if="participant.category?.available_balance !== undefined" class="mt-3 pt-3 border-t border-border">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Contribution to goal:</span>
            <span class="font-medium text-foreground">
              {{ formatCurrency(participant.category.available_balance) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="participants.length === 0" class="text-center py-8">
      <div class="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <UsersIcon class="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 class="text-lg font-medium text-foreground mb-2">No Participants</h4>
      <p class="text-muted-foreground mb-4">
        This goal doesn't have any participants yet.
      </p>
      <Button v-if="isGoalCreator" @click="$emit('inviteUser')">
        <UserPlusIcon class="h-4 w-4 mr-2" />
        Invite First User
      </Button>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog :open="showConfirmDialog" @update:open="showConfirmDialog = false">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ confirmAction === 'leave' ? 'Leave Goal' : 'Remove Participant' }}</DialogTitle>
          <DialogDescription>
            <span v-if="confirmAction === 'leave'">
              Are you sure you want to leave this goal? You won't be able to rejoin unless invited again.
            </span>
            <span v-else>
              Are you sure you want to remove {{ selectedParticipant?.user_profile.display_name }} from this goal?
            </span>
          </DialogDescription>
        </DialogHeader>
        <div class="flex justify-end space-x-3 pt-4">
          <Button variant="outline" @click="showConfirmDialog = false">
            Cancel
          </Button>
          <Button
            variant="destructive"
            @click="confirmActionHandler"
            :disabled="isProcessing"
          >
            <span v-if="isProcessing">Processing...</span>
            <span v-else>{{ confirmAction === 'leave' ? 'Leave Goal' : 'Remove' }}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UserPlusIcon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
  UserMinusIcon,
  DollarSignIcon
} from 'lucide-vue-next'
import Button from '../shadcn-ui/button.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../shadcn-ui'
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
import { useUserProfileStore } from '../../stores/user-profile.store'
import type { SharedGoalResponse, GoalParticipantResponse } from '../../types/DTO/shared-goal.dto'

interface Props {
  goal: SharedGoalResponse | null
  participants: GoalParticipantResponse[]
}

interface Emits {
  (e: 'inviteUser'): void
  (e: 'updateParticipant', participant: GoalParticipantResponse): void
  (e: 'participantRemoved', participant: GoalParticipantResponse): void
  (e: 'leftGoal'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { leaveGoal } = useGoalInvitations()
const userProfileStore = useUserProfileStore()

const showConfirmDialog = ref(false)
const confirmAction = ref<'leave' | 'remove'>('leave')
const selectedParticipant = ref<GoalParticipantResponse | null>(null)
const isProcessing = ref(false)

// Computed
const isGoalCreator = computed(() => {
  return props.goal?.created_by === userProfileStore.currentProfile?.id
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const isCurrentUser = (participant: GoalParticipantResponse): boolean => {
  return participant.user_profile_id === userProfileStore.currentProfile?.id
}

const canManageParticipant = (participant: GoalParticipantResponse): boolean => {
  return isCurrentUser(participant) || isGoalCreator.value
}

const handleLeaveGoal = (participant: GoalParticipantResponse) => {
  selectedParticipant.value = participant
  confirmAction.value = 'leave'
  showConfirmDialog.value = true
}

const handleRemoveParticipant = (participant: GoalParticipantResponse) => {
  selectedParticipant.value = participant
  confirmAction.value = 'remove'
  showConfirmDialog.value = true
}

const confirmActionHandler = async () => {
  if (!selectedParticipant.value || !props.goal) return

  try {
    isProcessing.value = true

    if (confirmAction.value === 'leave') {
      const success = await leaveGoal(props.goal.id)
      if (success) {
        emit('leftGoal')
      }
    } else {
      // TODO: Implement remove participant functionality
      // This would require a new backend endpoint
      console.log('Remove participant functionality not yet implemented')
    }

    showConfirmDialog.value = false
  } catch (error) {
    console.error('Failed to process action:', error)
  } finally {
    isProcessing.value = false
    selectedParticipant.value = null
  }
}
</script>
