<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/common/useTheme'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'
import { getLastVisitedBudget, saveLastVisitedBudget } from '@/utils/lastVisitedBudgetStorage'

// Initialize theme
useTheme()

// Initialize main data operations
const { loadMainData, clearError, isLoading, error } = useMainDataOperations()
const route = useRoute()
const router = useRouter()

// Load initial data when app starts
onMounted(async () => {
  // Check if we're on a budget route
  const budgetId = route.params?.budgetId as string

  if (budgetId) {
    // We're on a budget route, load data for this budget
    try {
      clearError()
      await loadMainData(budgetId)
      saveLastVisitedBudget(budgetId)
    } catch (error) {
      console.error('Failed to load main data:', error)
      // Redirect to dashboard on error
      await router.push('/dashboard')
    }
  } else {
    // We're not on a budget route, check if we should redirect to last visited budget
    const lastVisitedBudget = getLastVisitedBudget()
    if (lastVisitedBudget && route.path === '/') {
      // Only redirect from landing page, not from other non-budget pages
      await router.push(`/budget/${lastVisitedBudget}`)
    }
  }
})
</script>

<template>
  <!-- Global loading overlay -->
  <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span class="text-gray-700">Loading budget data...</span>
    </div>
  </div>

  <!-- Global error notification -->
  <div v-if="error" class="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="font-semibold">Error Loading Data</h4>
        <p class="text-sm">{{ error }}</p>
      </div>
      <button @click="clearError" class="ml-4 text-white hover:text-gray-200">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>

  <RouterView />
</template>

<style scoped>
</style>
