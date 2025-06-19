<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Back to Budget Button -->
      <div class="mb-6">
        <button
          @click="handleBackToBudget"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          ← Back to Budget
        </button>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p class="mt-2 text-gray-600">
          Manage your profile information for shared goals and collaboration features.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="ml-3 text-gray-600">Loading profile...</span>
      </div>

      <!-- Profile Form -->
      <div v-else class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">
            {{ currentProfile ? 'Edit Profile' : 'Create Profile' }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ currentProfile
              ? 'Update your profile information below.'
              : 'Create your profile to start sharing goals with others.'
            }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="px-6 py-6 space-y-6">
          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Username <span class="text-red-500">*</span>
            </label>
            <div class="mt-1">
              <input
                id="username"
                v-model="formData.username"
                type="text"
                placeholder="Enter your username"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-500': errors.username }"
                required
                minlength="3"
                maxlength="30"
                pattern="[a-zA-Z0-9_\-]+"
                @input="validateUsername"
              />
              <p v-if="errors.username" class="mt-2 text-sm text-red-600">
                {{ errors.username }}
              </p>
              <p class="mt-2 text-sm text-gray-500">
                3-30 characters, letters, numbers, underscores, and hyphens only
              </p>
            </div>
          </div>

          <!-- Display Name Field -->
          <div>
            <label for="display_name" class="block text-sm font-medium text-gray-700">
              Display Name <span class="text-red-500">*</span>
            </label>
            <div class="mt-1">
              <input
                id="display_name"
                v-model="formData.display_name"
                type="text"
                placeholder="Enter your display name"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-500': errors.display_name }"
                required
                maxlength="100"
                @input="validateDisplayName"
              />
              <p v-if="errors.display_name" class="mt-2 text-sm text-red-600">
                {{ errors.display_name }}
              </p>
              <p class="mt-2 text-sm text-gray-500">
                This is how your name will appear to other users
              </p>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <p class="mt-1 text-sm text-red-700">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div v-if="currentProfile && !isLoading" class="mt-8 bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Current Profile</h2>
        </div>
        <div class="px-6 py-4">
          <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">Username</dt>
              <dd class="mt-1 text-sm text-gray-900">@{{ currentProfile?.username }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Display Name</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ currentProfile?.display_name }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Created</dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ currentProfile?.created_at ? new Date(currentProfile.created_at).toLocaleDateString() : '' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd class="mt-1 text-sm text-gray-900">
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
import { UserProfileService } from '../services/user-profile.service'
import { getLastVisitedBudget } from '../utils/lastVisitedBudgetStorage'
import type { CreateUserProfileDto, UpdateUserProfileDto, UserProfileResponse } from '../types/DTO/user-profile.dto'

const router = useRouter()
const $toast = useToast()

// Simple, direct state management - no complex store interactions
const currentProfile = ref<UserProfileResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
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

// Simple, direct functions - no complex composables
const clearError = () => {
  error.value = null
}

const loadProfile = async () => {
  try {
    isLoading.value = true
    const profile = await UserProfileService.getCurrentUserProfile()
    currentProfile.value = profile

    if (profile) {
      formData.value = {
        username: profile.username,
        display_name: profile.display_name
      }
      originalUsername.value = profile.username
    }
  } catch (err: any) {
    console.error('Error loading profile:', err)
    // If 404, user just doesn't have a profile yet - that's fine
    if (err.response?.status !== 404) {
      error.value = 'Failed to load profile'
    }
  } finally {
    isLoading.value = false
  }
}

const createProfile = async (data: CreateUserProfileDto) => {
  const profile = await UserProfileService.create(data)
  currentProfile.value = profile
  return profile
}

const updateProfile = async (data: UpdateUserProfileDto) => {
  const profile = await UserProfileService.updateCurrentUserProfile(data)
  currentProfile.value = profile
  return profile
}

const isFormValid = computed(() => {
  return formData.value.username.length >= 3 &&
         formData.value.display_name.length > 0 &&
         !errors.value.username &&
         !errors.value.display_name
})

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
        await updateProfile(updateData)
        originalUsername.value = formData.value.username
        $toast.success('Profile updated successfully!')
      } else {
        $toast.info('No changes to save')
      }
    } else {
      // Create new profile
      const createdProfile = await createProfile(formData.value)

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
  const lastVisitedBudget = getLastVisitedBudget()
  if (lastVisitedBudget) {
    router.push(`/budget/${lastVisitedBudget}`)
  } else {
    router.push('/dashboard')
  }
}

onMounted(() => {
  loadProfile()
})
</script>
