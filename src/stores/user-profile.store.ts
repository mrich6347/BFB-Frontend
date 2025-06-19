import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfileResponse, PublicUserProfileResponse } from '../types/DTO/user-profile.dto'

export const useUserProfileStore = defineStore('userProfile', () => {
  // State
  const currentProfile = ref<UserProfileResponse | null>(null)
  const searchResults = ref<PublicUserProfileResponse[]>([])
  const isLoading = ref(false)
  const isSearching = ref(false)
  const error = ref<string | null>(null)

  // Actions - Basic state management only (following architecture pattern)
  const setCurrentProfile = (profile: UserProfileResponse | null) => {
    currentProfile.value = profile
  }

  const setSearchResults = (results: PublicUserProfileResponse[]) => {
    searchResults.value = results
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setSearching = (searching: boolean) => {
    isSearching.value = searching
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const clearSearchResults = () => {
    searchResults.value = []
  }

  const reset = () => {
    currentProfile.value = null
    searchResults.value = []
    isLoading.value = false
    isSearching.value = false
    error.value = null
  }

  return {
    // State
    currentProfile,
    searchResults,
    isLoading,
    isSearching,
    error,

    // Actions
    setCurrentProfile,
    setSearchResults,
    setLoading,
    setSearching,
    setError,
    clearError,
    clearSearchResults,
    reset
  }
})
