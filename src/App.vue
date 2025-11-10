<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/common/useTheme'
import { useRealtimeSync } from '@/composables/common/useRealtimeSync'

// Initialize color theme
useTheme()

// Initialize real-time sync for cross-device/tab synchronization
useRealtimeSync()

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  try {
    // Only redirect if we're on the landing page
    if (route.path === '/') {
      // Try to load the last visited budget from localStorage
      const lastVisitedBudgetId = localStorage.getItem('lastVisitedBudgetId')

      if (lastVisitedBudgetId) {
        // Try to navigate to the last visited budget
        try {
          await router.push(`/budget/${lastVisitedBudgetId}`)
          return
        } catch (error) {
          console.log('Could not navigate to last visited budget, falling back to dashboard')
          // Clear the invalid budget ID from localStorage
          localStorage.removeItem('lastVisitedBudgetId')
        }
      }

      // Fall back to dashboard if no last visited budget or navigation failed
      await router.push('/dashboard')
    }
  } catch (error) {
    console.error('App initialization error:', error)
  }
})
</script>

<template>
  <RouterView/>
</template>
