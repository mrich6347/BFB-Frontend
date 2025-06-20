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
        <!-- Username Input -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Username <span class="text-destructive">*</span>
          </label>
          <input
            v-model="username"
            type="text"
            placeholder="Enter username..."
            class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            :disabled="isSubmitting"
            required
          />
          <p class="text-sm text-muted-foreground mt-1">
            Enter the exact username of the person you want to invite.
          </p>
        </div>

        <!-- Invitation Preview -->
        <div v-if="username.trim()" class="p-4 bg-muted/50 border border-border rounded-md">
          <h4 class="text-sm font-medium text-foreground mb-2">Invitation Preview</h4>
          <p class="text-sm text-muted-foreground">
            <strong>@{{ username.trim() }}</strong> will be invited to join your goal "{{ goalName }}".
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
            :disabled="!username.trim() || isSubmitting"
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
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
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

const username = ref('')
const isSubmitting = ref(false)
const showSuccess = ref(false)
const lastInvitedUser = ref('')

// Computed
const goalName = computed(() => props.goal?.name || '')

// Methods
const handleSubmit = async () => {
  if (!username.value.trim() || !props.goal) return

  try {
    isSubmitting.value = true
    clearError()
    showSuccess.value = false

    const invitation = await inviteUser(props.goal.id, {
      invitee_username: username.value.trim()
    })

    if (invitation) {
      lastInvitedUser.value = username.value.trim()
      showSuccess.value = true
      username.value = ''

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
  username.value = ''
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


