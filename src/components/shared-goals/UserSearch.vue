<template>
  <div class="space-y-4">
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search users by username..."
        class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        @input="handleSearch"
        @keydown.enter.prevent="handleEnterKey"
        @keydown.arrow-down.prevent="navigateDown"
        @keydown.arrow-up.prevent="navigateUp"
        @keydown.escape="clearSearch"
      />
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div v-if="isSearching" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="showResults" class="border border-gray-200 rounded-md bg-white shadow-sm max-h-60 overflow-y-auto">
      <div v-if="searchResults.length === 0 && !isSearching && searchQuery.length >= minSearchLength" class="p-4 text-center text-gray-500">
        <p>No users found matching "{{ searchQuery }}"</p>
      </div>
      
      <div v-else-if="searchResults.length > 0" class="divide-y divide-gray-100">
        <button
          v-for="(user, index) in searchResults"
          :key="user.username"
          :class="[
            'w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors',
            { 'bg-blue-50': index === selectedIndex }
          ]"
          @click="selectUser(user)"
          @mouseenter="selectedIndex = index"
        >
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {{ user.display_name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ user.display_name }}
              </p>
              <p class="text-sm text-gray-500 truncate">
                @{{ user.username }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Selected User Display -->
    <div v-if="selectedUser" class="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {{ selectedUser.display_name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.display_name }}
            </p>
            <p class="text-sm text-gray-600">
              @{{ selectedUser.username }}
            </p>
          </div>
        </div>
        <button
          @click="clearSelection"
          class="text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useUserProfileOperations } from '../../composables/user-profiles/useUserProfileOperations'
import type { PublicUserProfileResponse } from '../../types/DTO/user-profile.dto'

interface Props {
  placeholder?: string
  minSearchLength?: number
  excludeUsernames?: string[]
  modelValue?: PublicUserProfileResponse | null
}

interface Emits {
  (e: 'update:modelValue', value: PublicUserProfileResponse | null): void
  (e: 'userSelected', user: PublicUserProfileResponse): void
  (e: 'searchCleared'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search users by username...',
  minSearchLength: 2,
  excludeUsernames: () => []
})

const emit = defineEmits<Emits>()

const { debouncedSearchUsers, searchResults, isSearching, error, clearError, clearSearchResults } = useUserProfileOperations()

const searchQuery = ref('')
const selectedIndex = ref(-1)
const selectedUser = ref<PublicUserProfileResponse | null>(props.modelValue || null)
const showResults = ref(false)

const filteredResults = computed(() => {
  return searchResults.value.filter(user => 
    !props.excludeUsernames.includes(user.username)
  )
})

const handleSearch = async () => {
  clearError()
  
  if (searchQuery.value.length < props.minSearchLength) {
    clearSearchResults()
    showResults.value = false
    selectedIndex.value = -1
    return
  }

  showResults.value = true
  selectedIndex.value = -1
  
  try {
    await debouncedSearchUsers(searchQuery.value)
  } catch (error) {
    console.error('Search failed:', error)
  }
}

const selectUser = (user: PublicUserProfileResponse) => {
  selectedUser.value = user
  searchQuery.value = ''
  showResults.value = false
  selectedIndex.value = -1
  clearSearchResults()
  
  emit('update:modelValue', user)
  emit('userSelected', user)
}

const clearSelection = () => {
  selectedUser.value = null
  emit('update:modelValue', null)
  emit('searchCleared')
}

const clearSearch = () => {
  searchQuery.value = ''
  showResults.value = false
  selectedIndex.value = -1
  clearSearchResults()
  clearError()
}

const navigateDown = () => {
  if (filteredResults.value.length === 0) return
  
  selectedIndex.value = selectedIndex.value < filteredResults.value.length - 1 
    ? selectedIndex.value + 1 
    : 0
}

const navigateUp = () => {
  if (filteredResults.value.length === 0) return
  
  selectedIndex.value = selectedIndex.value > 0 
    ? selectedIndex.value - 1 
    : filteredResults.value.length - 1
}

const handleEnterKey = () => {
  if (selectedIndex.value >= 0 && selectedIndex.value < filteredResults.value.length) {
    selectUser(filteredResults.value[selectedIndex.value])
  }
}

// Handle clicks outside to close results
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.user-search-container')) {
    showResults.value = false
    selectedIndex.value = -1
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  selectedUser.value = newValue
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-search-container {
  /* This class is used for click-outside detection */
}
</style>
