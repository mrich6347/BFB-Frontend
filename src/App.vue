<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/common/useTheme'
import { useBudgetStore } from '@/stores/budget.store'
import { useFetchBudgets } from '@/composables/budgets/budget-read/useFetchBudgets'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'

// Initialize color theme
useTheme()

const route = useRoute()
const router = useRouter()
const budgetStore = useBudgetStore()
const { fetchBudgets } = useFetchBudgets()
const { ensureDataLoaded } = useMainDataOperations()

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
