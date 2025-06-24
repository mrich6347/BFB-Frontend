<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/common/useTheme'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'
import { saveLastVisitedBudget } from '@/utils/lastVisitedBudgetStorage'
import AppLoader from '@/components/common/AppLoader.vue'

// Initialize theme
useTheme()

// Initialize main data operations
const { ensureDataLoaded, clearError, isLoading, error } = useMainDataOperations()
const route = useRoute()
const router = useRouter()

// Load initial data when app starts
onMounted(async () => {
  // Check if we're on a budget route
  const budgetId = route.params?.budgetId as string

  if (budgetId) {
    // We're on a budget route, ensure data is loaded for this budget
    clearError()
    const success = await ensureDataLoaded(budgetId)

    if (success) {
      saveLastVisitedBudget(budgetId)
    } else {
      // Redirect to dashboard on error (localStorage already cleared by useMainDataOperations)
      await router.push('/dashboard')
    }
  } else {
    // We're not on a budget route - no automatic redirect to last visited budget
    // Users should manually select a budget from the dashboard
  }
})
</script>

<template>
  <!-- Global loading overlay -->
  <AppLoader :loading="isLoading" />

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
