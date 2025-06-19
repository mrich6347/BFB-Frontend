<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Set Up Your Profile</DialogTitle>
        <DialogDescription>
          Create your profile to start sharing goals with others. Your username will be visible to other users.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label for="username" class="text-sm font-medium">
            Username <span class="text-red-500">*</span>
          </label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="Enter your username"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.username }"
            required
            minlength="3"
            maxlength="30"
            pattern="[a-zA-Z0-9_-]+"
            @input="validateUsername"
            @blur="checkUsernameAvailability"
          />
          <p v-if="errors.username" class="text-sm text-red-500">
            {{ errors.username }}
          </p>
          <p v-else-if="usernameStatus === 'checking'" class="text-sm text-gray-500">
            Checking availability...
          </p>
          <p v-else-if="usernameStatus === 'available'" class="text-sm text-green-600">
            Username is available!
          </p>
          <p v-else-if="usernameStatus === 'taken'" class="text-sm text-red-500">
            Username is already taken
          </p>
          <p class="text-xs text-gray-500">
            3-30 characters, letters, numbers, underscores, and hyphens only
          </p>
        </div>

        <div class="space-y-2">
          <label for="display_name" class="text-sm font-medium">
            Display Name <span class="text-red-500">*</span>
          </label>
          <input
            id="display_name"
            v-model="formData.display_name"
            type="text"
            placeholder="Enter your display name"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.display_name }"
            required
            maxlength="100"
            @input="validateDisplayName"
          />
          <p v-if="errors.display_name" class="text-sm text-red-500">
            {{ errors.display_name }}
          </p>
          <p class="text-xs text-gray-500">
            This is how your name will appear to other users
          </p>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            @click="handleClose"
            :disabled="isLoading"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!isFormValid || isLoading || usernameStatus === 'checking'"
            class="min-w-[100px]"
          >
            <span v-if="isLoading">Creating...</span>
            <span v-else>Create Profile</span>
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../shadcn-ui'
import Button from '../shadcn-ui/button.vue'
import { useUserProfileOperations } from '../../composables/user-profiles/useUserProfileOperations'
import type { CreateUserProfileDto } from '../../types/DTO/user-profile.dto'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'profileCreated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { createProfile, findByUsername, isLoading, error, clearError } = useUserProfileOperations()

const formData = ref<CreateUserProfileDto>({
  username: '',
  display_name: ''
})

const errors = ref({
  username: '',
  display_name: ''
})

const usernameStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const usernameCheckTimer = ref<NodeJS.Timeout | null>(null)

const isFormValid = computed(() => {
  return formData.value.username.length >= 3 &&
         formData.value.display_name.length > 0 &&
         !errors.value.username &&
         !errors.value.display_name &&
         usernameStatus.value === 'available'
})

const validateUsername = () => {
  const username = formData.value.username
  
  if (username.length === 0) {
    errors.value.username = ''
    usernameStatus.value = 'idle'
    return
  }
  
  if (username.length < 3) {
    errors.value.username = 'Username must be at least 3 characters long'
    usernameStatus.value = 'idle'
    return
  }
  
  if (username.length > 30) {
    errors.value.username = 'Username must be at most 30 characters long'
    usernameStatus.value = 'idle'
    return
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.value.username = 'Username can only contain letters, numbers, underscores, and hyphens'
    usernameStatus.value = 'idle'
    return
  }
  
  errors.value.username = ''
  
  // Trigger availability check after validation passes
  if (usernameStatus.value !== 'checking') {
    checkUsernameAvailability()
  }
}

const checkUsernameAvailability = async () => {
  const username = formData.value.username
  
  if (!username || username.length < 3 || errors.value.username) {
    return
  }
  
  // Clear existing timer
  if (usernameCheckTimer.value) {
    clearTimeout(usernameCheckTimer.value)
  }
  
  // Debounce the check
  usernameCheckTimer.value = setTimeout(async () => {
    try {
      usernameStatus.value = 'checking'
      const existingProfile = await findByUsername(username)
      
      if (existingProfile) {
        usernameStatus.value = 'taken'
      } else {
        usernameStatus.value = 'available'
      }
    } catch (error) {
      // If we get a 404, username is available
      usernameStatus.value = 'available'
    }
  }, 500)
}

const validateDisplayName = () => {
  const displayName = formData.value.display_name
  
  if (displayName.length === 0) {
    errors.value.display_name = ''
    return
  }
  
  if (displayName.length > 100) {
    errors.value.display_name = 'Display name must be at most 100 characters long'
    return
  }
  
  errors.value.display_name = ''
}

const handleSubmit = async () => {
  try {
    clearError()
    
    // Final validation
    validateUsername()
    validateDisplayName()
    
    if (!isFormValid.value) {
      return
    }
    
    await createProfile(formData.value)
    emit('profileCreated')
    handleClose()
  } catch (error) {
    // Error is handled by the composable
    console.error('Failed to create profile:', error)
  }
}

const handleClose = () => {
  emit('update:isOpen', false)
}

// Reset form when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Reset form
    formData.value = {
      username: '',
      display_name: ''
    }
    errors.value = {
      username: '',
      display_name: ''
    }
    usernameStatus.value = 'idle'
    clearError()
  } else {
    // Clear any pending timer
    if (usernameCheckTimer.value) {
      clearTimeout(usernameCheckTimer.value)
    }
  }
})
</script>
