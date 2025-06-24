<template>
  <div class="min-h-screen bg-background">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Back to Budget Button -->
      <div class="mb-6">
        <button
          @click="handleBackToBudget"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
        >
          ← Back to Budget
        </button>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p class="mt-2 text-muted-foreground">
          Manage your profile information for shared goals and collaboration features.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span class="ml-3 text-muted-foreground">Loading profile...</span>
      </div>

      <!-- Profile Form -->
      <div v-else class="bg-card shadow rounded-lg border border-border">
        <div class="px-6 py-4 border-b border-border">
          <h2 class="text-lg font-medium text-card-foreground">
            {{ currentProfile ? 'Edit Profile' : 'Create Profile' }}
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ currentProfile
              ? 'Update your profile information below.'
              : 'Create your profile to start sharing goals with others.'
            }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="px-6 py-6 space-y-6">
          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-foreground">
              Username <span class="text-destructive">*</span>
            </label>
            <div class="mt-1">
              <input
                id="username"
                v-model="formData.username"
                type="text"
                placeholder="Enter your username"
                class="block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                :class="{ 'border-destructive': errors.username }"
                required
                minlength="3"
                maxlength="30"
                pattern="[a-zA-Z0-9_\-]+"
                @input="validateUsername"
              />
              <p v-if="errors.username" class="mt-2 text-sm text-destructive">
                {{ errors.username }}
              </p>
              <p class="mt-2 text-sm text-muted-foreground">
                3-30 characters, letters, numbers, underscores, and hyphens only
              </p>
            </div>
          </div>

          <!-- Display Name Field -->
          <div>
            <label for="display_name" class="block text-sm font-medium text-foreground">
              Display Name <span class="text-destructive">*</span>
            </label>
            <div class="mt-1">
              <input
                id="display_name"
                v-model="formData.display_name"
                type="text"
                placeholder="Enter your display name"
                class="block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                :class="{ 'border-destructive': errors.display_name }"
                required
                maxlength="100"
                @input="validateDisplayName"
              />
              <p v-if="errors.display_name" class="mt-2 text-sm text-destructive">
                {{ errors.display_name }}
              </p>
              <p class="mt-2 text-sm text-muted-foreground">
                This is how your name will appear to other users
              </p>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="error" class="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-destructive">Error</h3>
                <p class="mt-1 text-sm text-destructive/80">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isSubmitting">
                {{ currentProfile ? 'Updating...' : 'Creating...' }}
              </span>
              <span v-else>
                {{ currentProfile ? 'Update Profile' : 'Create Profile' }}
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Profile Info (if exists) -->
      <div v-if="currentProfile && !isLoading" class="mt-8 bg-card shadow rounded-lg border border-border">
        <div class="px-6 py-4 border-b border-border">
          <h2 class="text-lg font-medium text-card-foreground">Current Profile</h2>
        </div>
        <div class="px-6 py-4">
          <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-muted-foreground">Username</dt>
              <dd class="mt-1 text-sm text-card-foreground">@{{ currentProfile?.username }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted-foreground">Display Name</dt>
              <dd class="mt-1 text-sm text-card-foreground">{{ currentProfile?.display_name }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted-foreground">Created</dt>
              <dd class="mt-1 text-sm text-card-foreground">
                {{ currentProfile?.created_at ? new Date(currentProfile.created_at).toLocaleDateString() : '' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd class="mt-1 text-sm text-card-foreground">
                {{ currentProfile?.updated_at ? new Date(currentProfile.updated_at).toLocaleDateString() : '' }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { useUserProfileOperations } from '../composables/user-profiles/useUserProfileOperations'
import { useUserProfileStore } from '../stores/user-profile.store'

import type { CreateUserProfileDto, UpdateUserProfileDto } from '../types/DTO/user-profile.dto'

const router = useRouter()
const $toast = useToast()

// Use store for state and composable for operations
const userProfileStore = useUserProfileStore()
const { createProfile: createProfileOp, updateProfile: updateProfileOp } = useUserProfileOperations()

// Local form state
const isSubmitting = ref(false)

const formData = ref<CreateUserProfileDto>({
  username: '',
  display_name: ''
})

const errors = ref({
  username: '',
  display_name: ''
})

const originalUsername = ref<string>('')

const loadProfile = () => {
  // Get profile from store (already loaded via main data)
  const profile = userProfileStore.currentProfile

  if (profile) {
    formData.value = {
      username: profile.username,
      display_name: profile.display_name
    }
    originalUsername.value = profile.username
  }
}

const isFormValid = computed(() => {
  return formData.value.username.length >= 3 &&
         formData.value.display_name.length > 0 &&
         !errors.value.username &&
         !errors.value.display_name
})

// Computed properties to access store state
const currentProfile = computed(() => userProfileStore.currentProfile)
const isLoading = computed(() => userProfileStore.isLoading)
const error = computed(() => userProfileStore.error)

// Clear error function
const clearError = () => {
  userProfileStore.clearError()
}

const validateUsername = () => {
  const username = formData.value.username

  if (username.length === 0) {
    errors.value.username = ''
    return
  }

  if (username.length < 3) {
    errors.value.username = 'Username must be at least 3 characters long'
    return
  }

  if (username.length > 30) {
    errors.value.username = 'Username must be at most 30 characters long'
    return
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.value.username = 'Username can only contain letters, numbers, underscores, and hyphens'
    return
  }

  errors.value.username = ''
}

// Username availability will be checked on form submission

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
    isSubmitting.value = true
    clearError()

    // Final validation
    validateUsername()
    validateDisplayName()

    if (!isFormValid.value) {
      return
    }

    if (currentProfile && currentProfile.value) {
      // Update existing profile
      const updateData: UpdateUserProfileDto = {}

      if (formData.value.username !== originalUsername.value) {
        updateData.username = formData.value.username
      }

      if (currentProfile.value && formData.value.display_name !== currentProfile.value.display_name) {
        updateData.display_name = formData.value.display_name
      }

      if (Object.keys(updateData).length > 0) {
        await updateProfileOp(updateData)
        originalUsername.value = formData.value.username
        $toast.success('Profile updated successfully!')
      } else {
        $toast.info('No changes to save')
      }
    } else {
      // Create new profile
      const createdProfile = await createProfileOp(formData.value)

      // Update form state with created profile data
      if (createdProfile) {
        formData.value = {
          username: createdProfile.username,
          display_name: createdProfile.display_name
        }
        originalUsername.value = createdProfile.username
        $toast.success('Profile created successfully!')
      }
    }

  } catch (error: any) {
    // Handle username conflicts specifically
    if (error.response?.status === 409 || error.response?.data?.message?.includes('username')) {
      errors.value.username = 'Username is already taken. Please choose a different username.'
      $toast.error('Username is already taken. Please choose a different username.')
    } else {
      // Other errors
      const errorMessage = error.response?.data?.message || 'Failed to save profile'
      console.error('Failed to save profile:', error)
      $toast.error(errorMessage)
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.back()
}

const handleBackToBudget = () => {
  router.back()
}

onMounted(() => {
  loadProfile()
})
</script>
