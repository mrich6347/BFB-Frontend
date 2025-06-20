<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-foreground">Goal Invitations</h3>
      <Button
        v-if="invitations.length > 0"
        variant="outline"
        size="sm"
        @click="refreshInvitations"
        :disabled="isLoading"
      >
        <RefreshCwIcon class="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && invitations.length === 0" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="invitations.length === 0" class="text-center py-8">
      <div class="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <MailIcon class="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 class="text-lg font-medium text-foreground mb-2">No Invitations</h4>
      <p class="text-muted-foreground">
        You don't have any pending goal invitations at the moment.
      </p>
    </div>

    <!-- Invitations List -->
    <div v-else class="space-y-3">
      <div
        v-for="invitation in invitations"
        :key="invitation.id"
        class="border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <!-- Invitation Details -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-2">
              <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                {{ invitation.inviter_profile.display_name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-medium text-foreground">
                  {{ invitation.inviter_profile.display_name }}
                </p>
                <p class="text-xs text-muted-foreground">
                  @{{ invitation.inviter_profile.username }}
                </p>
              </div>
            </div>

            <div class="mb-3">
              <h4 class="font-medium text-foreground mb-1">
                {{ invitation.goal.name }}
              </h4>
              <p class="text-sm text-muted-foreground">
                Target: {{ formatCurrency(invitation.goal.target_amount) }}
              </p>
            </div>

            <div class="flex items-center space-x-4 text-xs text-muted-foreground">
              <div class="flex items-center space-x-1">
                <ClockIcon class="h-3 w-3" />
                <span>Invited {{ formatRelativeTime(invitation.created_at) }}</span>
              </div>
              <div class="flex items-center space-x-1">
                <CalendarIcon class="h-3 w-3" />
                <span>Expires {{ formatRelativeTime(invitation.expires_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col space-y-2 ml-4">
            <Button
              size="sm"
              @click="handleAccept(invitation)"
              :disabled="processingInvitations.has(invitation.id)"
            >
              <span v-if="processingInvitations.has(invitation.id) && lastAction === 'accept'">
                Accepting...
              </span>
              <span v-else>Accept</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              @click="handleDecline(invitation)"
              :disabled="processingInvitations.has(invitation.id)"
            >
              <span v-if="processingInvitations.has(invitation.id) && lastAction === 'decline'">
                Declining...
              </span>
              <span v-else>Decline</span>
            </Button>
          </div>
        </div>

        <!-- Expiration Warning -->
        <div v-if="isExpiringSoon(invitation.expires_at)" class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div class="flex items-center">
            <AlertTriangleIcon class="h-4 w-4 text-yellow-600 mr-2" />
            <p class="text-sm text-yellow-800">
              This invitation expires soon!
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="rounded-md bg-destructive/10 border border-destructive/20 p-3">
      <div class="flex">
        <div class="flex-shrink-0">
          <AlertCircleIcon class="h-4 w-4 text-destructive" />
        </div>
        <div class="ml-2">
          <p class="text-sm text-destructive">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  RefreshCwIcon, 
  MailIcon, 
  ClockIcon, 
  CalendarIcon, 
  AlertTriangleIcon,
  AlertCircleIcon 
} from 'lucide-vue-next'
import Button from '../shadcn-ui/button.vue'
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import type { InvitationResponse } from '../../types/DTO/shared-goal.dto'

interface Emits {
  (e: 'invitationAccepted', invitation: InvitationResponse): void
  (e: 'invitationDeclined', invitation: InvitationResponse): void
}

const emit = defineEmits<Emits>()

const { 
  loadInvitations, 
  acceptInvitation, 
  declineInvitation, 
  isLoading, 
  error, 
  clearError 
} = useGoalInvitations()

const sharedGoalsStore = useSharedGoalsStore()
const processingInvitations = ref(new Set<string>())
const lastAction = ref<'accept' | 'decline' | null>(null)

// Computed
const invitations = computed(() => sharedGoalsStore.invitations)

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatRelativeTime = (date: Date | string): string => {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = targetDate.getTime() - now.getTime()
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} days ago`
  } else if (diffInDays === 0) {
    return 'today'
  } else if (diffInDays === 1) {
    return 'tomorrow'
  } else {
    return `in ${diffInDays} days`
  }
}

const isExpiringSoon = (expiresAt: Date | string): boolean => {
  const now = new Date()
  const expiration = new Date(expiresAt)
  const diffInMs = expiration.getTime() - now.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)
  
  return diffInHours <= 24 && diffInHours > 0
}

const handleAccept = async (invitation: InvitationResponse) => {
  try {
    processingInvitations.value.add(invitation.id)
    lastAction.value = 'accept'
    clearError()

    const success = await acceptInvitation(invitation.id)
    if (success) {
      emit('invitationAccepted', invitation)
    }
  } catch (error) {
    console.error('Failed to accept invitation:', error)
  } finally {
    processingInvitations.value.delete(invitation.id)
    lastAction.value = null
  }
}

const handleDecline = async (invitation: InvitationResponse) => {
  try {
    processingInvitations.value.add(invitation.id)
    lastAction.value = 'decline'
    clearError()

    const success = await declineInvitation(invitation.id)
    if (success) {
      emit('invitationDeclined', invitation)
    }
  } catch (error) {
    console.error('Failed to decline invitation:', error)
  } finally {
    processingInvitations.value.delete(invitation.id)
    lastAction.value = null
  }
}

const refreshInvitations = async () => {
  clearError()
  await loadInvitations()
}

// Load invitations on mount
onMounted(() => {
  loadInvitations()
})
</script>
