import { ref } from 'vue'
import { useUserProfileStore } from '../../stores/user-profile.store'
import { UserProfileService } from '../../services/user-profile.service'
import type {
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileResponse,
  PublicUserProfileResponse
} from '../../types/DTO/user-profile.dto'

export const useUserProfileOperations = () => {
  const userProfileStore = useUserProfileStore()
  const debounceTimer = ref<NodeJS.Timeout | null>(null)

  const createProfile = async (createUserProfileDto: CreateUserProfileDto): Promise<UserProfileResponse | null> => {
    try {
      userProfileStore.setLoading(true)
      userProfileStore.clearError()

      const profile = await UserProfileService.create(createUserProfileDto)
      userProfileStore.setCurrentProfile(profile)

      return profile
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create user profile'
      userProfileStore.setError(errorMessage)
      throw error
    } finally {
      userProfileStore.setLoading(false)
    }
  }

  const getCurrentProfile = async (): Promise<UserProfileResponse | null> => {
    try {
      userProfileStore.setLoading(true)
      userProfileStore.clearError()

      const profile = await UserProfileService.getCurrentUserProfile()
      userProfileStore.setCurrentProfile(profile)

      return profile
    } catch (error: any) {
      // Handle any unexpected errors
      const errorMessage = error.response?.data?.message || 'Failed to get user profile'
      userProfileStore.setError(errorMessage)
      userProfileStore.setCurrentProfile(null)
      throw error
    } finally {
      userProfileStore.setLoading(false)
    }
  }

  const updateProfile = async (updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfileResponse | null> => {
    try {
      userProfileStore.setLoading(true)
      userProfileStore.clearError()

      const profile = await UserProfileService.updateCurrentUserProfile(updateUserProfileDto)
      userProfileStore.setCurrentProfile(profile)

      return profile
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update user profile'
      userProfileStore.setError(errorMessage)
      throw error
    } finally {
      userProfileStore.setLoading(false)
    }
  }

  const searchUsers = async (username: string): Promise<PublicUserProfileResponse[]> => {
    try {
      userProfileStore.setSearching(true)
      userProfileStore.clearError()

      const results = await UserProfileService.searchUsers(username)
      userProfileStore.setSearchResults(results)

      return results
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to search users'
      userProfileStore.setError(errorMessage)
      userProfileStore.setSearchResults([])
      return []
    } finally {
      userProfileStore.setSearching(false)
    }
  }

  const debouncedSearchUsers = (username: string, delay: number = 300): Promise<PublicUserProfileResponse[]> => {
    return new Promise((resolve) => {
      // Clear existing timer
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value)
      }

      // Set new timer
      debounceTimer.value = setTimeout(async () => {
        const results = await searchUsers(username)
        resolve(results)
      }, delay)
    })
  }

  // Removed findByUsername - username availability is now checked during create/update

  const clearSearchResults = () => {
    userProfileStore.clearSearchResults()
  }

  const clearError = () => {
    userProfileStore.clearError()
  }

  return {
    // Operations only - components should access store directly for state
    createProfile,
    getCurrentProfile,
    updateProfile,
    searchUsers,
    debouncedSearchUsers,
    clearSearchResults,
    clearError
  }
}
