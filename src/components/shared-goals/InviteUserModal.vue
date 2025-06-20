<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Invite User to Goal</DialogTitle>
        <DialogDescription>
          Search for a user by username and invite them to join "{{ goalName }}".
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- User Search -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Search User <span class="text-destructive">*</span>
          </label>
          <div class="user-search-container">
            <UserSearch
              v-model="selectedUser"
              placeholder="Search by username..."
              :exclude-usernames="excludedUsernames"
              @user-selected="onUserSelected"
              @search-cleared="onSearchCleared"
            />
          </div>
        </div>

        <!-- Invitation Preview -->
        <div v-if="selectedUser" class="p-4 bg-muted/50 border border-border rounded-md">
          <h4 class="text-sm font-medium text-foreground mb-2">Invitation Preview</h4>
          <p class="text-sm text-muted-foreground">
            <strong>{{ selectedUser.display_name }}</strong> (@{{ selectedUser.username }}) will be invited to join your goal "{{ goalName }}".
          </p>
          <p class="text-xs text-muted-foreground mt-2">
            They will have 7 days to accept this invitation.
          </p>
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

        <!-- Success Display -->
        <div v-if="showSuccess" class="rounded-md bg-green-50 border border-green-200 p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <CheckCircleIcon class="h-4 w-4 text-green-600" />
            </div>
            <div class="ml-2">
              <p class="text-sm text-green-600">
                Invitation sent successfully to {{ lastInvitedUser }}!
              </p>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            @click="handleClose"
            :disabled="isSubmitting"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!selectedUser || isSubmitting"
          >
            <span v-if="isSubmitting">Sending...</span>
            <span v-else>Send Invitation</span>
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AlertCircleIcon, CheckCircleIcon } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../shadcn-ui'
import Button from '../shadcn-ui/button.vue'
import UserSearch from './UserSearch.vue'
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
import type { PublicUserProfileResponse } from '../../types/DTO/user-profile.dto'
import type { InvitationResponse, SharedGoalResponse } from '../../types/DTO/shared-goal.dto'

interface Props {
  isOpen: boolean
  goal: SharedGoalResponse | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'invitationSent', invitation: InvitationResponse): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { inviteUser, error, clearError, isLoading } = useGoalInvitations()

const selectedUser = ref<PublicUserProfileResponse | null>(null)
const isSubmitting = ref(false)
const showSuccess = ref(false)
const lastInvitedUser = ref('')

// Computed
const goalName = computed(() => props.goal?.name || '')

const excludedUsernames = computed(() => {
  if (!props.goal) return []
  
  const usernames: string[] = []
  
  // Add goal creator
  if (props.goal.creator_profile?.username) {
    usernames.push(props.goal.creator_profile.username)
  }
  
  // Add existing participants
  if (props.goal.participants) {
    props.goal.participants.forEach(participant => {
      if (participant.user_profile?.username) {
        usernames.push(participant.user_profile.username)
      }
    })
  }
  
  return usernames
})

// Methods
const onUserSelected = (user: PublicUserProfileResponse) => {
  selectedUser.value = user
  clearError()
  showSuccess.value = false
}

const onSearchCleared = () => {
  selectedUser.value = null
  clearError()
  showSuccess.value = false
}

const handleSubmit = async () => {
  if (!selectedUser.value || !props.goal) return

  try {
    isSubmitting.value = true
    clearError()
    showSuccess.value = false

    const invitation = await inviteUser(props.goal.id, {
      invitee_username: selectedUser.value.username
    })

    if (invitation) {
      lastInvitedUser.value = selectedUser.value.display_name
      showSuccess.value = true
      selectedUser.value = null
      
      emit('invitationSent', invitation)
      
      // Auto-close after showing success for 2 seconds
      setTimeout(() => {
        if (showSuccess.value) {
          handleClose()
        }
      }, 2000)
    }
  } catch (error) {
    console.error('Failed to send invitation:', error)
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  selectedUser.value = null
  showSuccess.value = false
  lastInvitedUser.value = ''
  clearError()
}

const handleClose = () => {
  emit('update:isOpen', false)
}

// Watch for modal open/close to reset form
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

// Watch for loading state from composable
watch(() => isLoading.value, (loading) => {
  isSubmitting.value = loading
})
</script>

<style scoped>
.user-search-container {
  /* This class is used for click-outside detection in UserSearch */
}
</style>
