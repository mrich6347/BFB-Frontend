<template>
  <div class="min-h-screen bg-background">
    <div class="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
        <h1 class="text-3xl font-bold text-foreground">Theme Settings</h1>
        <p class="mt-2 text-muted-foreground">
          Choose a theme for your budget interface. The theme will be applied to your current budget.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span class="ml-3 text-muted-foreground">Loading themes...</span>
      </div>

      <!-- Theme Selection Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <!-- Light Theme -->
        <div
          @click="selectTheme(Theme.LIGHT)"
          :class="[
            'relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all',
            currentTheme === Theme.LIGHT
              ? 'border-primary ring-2 ring-primary ring-offset-2'
              : 'border-border hover:border-primary/50'
          ]"
        >
          <div class="aspect-video bg-muted flex items-center justify-center">
            <!-- Placeholder for theme preview image -->
            <div class="text-center p-3 md:p-8">
              <div class="text-4xl md:text-6xl mb-2 md:mb-4">☀️</div>
              <h3 class="text-base md:text-xl font-semibold text-foreground">Light Theme</h3>
              <p class="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Clean and bright interface</p>
            </div>
          </div>
          <div v-if="currentTheme === Theme.LIGHT" class="absolute top-2 right-2 md:top-4 md:right-4">
            <div class="bg-primary text-primary-foreground rounded-full p-1.5 md:p-2">
              <svg class="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Dark Theme -->
        <div
          @click="selectTheme(Theme.DARK)"
          :class="[
            'relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all',
            currentTheme === Theme.DARK
              ? 'border-primary ring-2 ring-primary ring-offset-2'
              : 'border-border hover:border-primary/50'
          ]"
        >
          <div class="aspect-video bg-muted flex items-center justify-center">
            <!-- Placeholder for theme preview image -->
            <div class="text-center p-3 md:p-8">
              <div class="text-4xl md:text-6xl mb-2 md:mb-4">🌙</div>
              <h3 class="text-base md:text-xl font-semibold text-foreground">Dark Theme</h3>
              <p class="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Easy on the eyes</p>
            </div>
          </div>
          <div v-if="currentTheme === Theme.DARK" class="absolute top-2 right-2 md:top-4 md:right-4">
            <div class="bg-primary text-primary-foreground rounded-full p-1.5 md:p-2">
              <svg class="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Amber Theme -->
        <div
          @click="selectTheme(Theme.AMBER)"
          :class="[
            'relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all',
            currentTheme === Theme.AMBER
              ? 'border-primary ring-2 ring-primary ring-offset-2'
              : 'border-border hover:border-primary/50'
          ]"
        >
          <div class="aspect-video bg-muted flex items-center justify-center">
            <!-- Placeholder for theme preview image -->
            <div class="text-center p-3 md:p-8">
              <div class="text-4xl md:text-6xl mb-2 md:mb-4">👧🏿</div>
              <h3 class="text-base md:text-xl font-semibold text-foreground">Amber Theme</h3>
              <p class="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Warm and cozy tones</p>
            </div>
          </div>
          <div v-if="currentTheme === Theme.AMBER" class="absolute top-2 right-2 md:top-4 md:right-4">
            <div class="bg-primary text-primary-foreground rounded-full p-1.5 md:p-2">
              <svg class="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { useBudgetStore } from '../stores/budget.store'
import { useUpdateBudget } from '../composables/budgets/budget-write/useUpdateBudget'
import { useTheme } from '../composables/common/useTheme'
import { Theme } from '../types/DTO/budget.dto'

const router = useRouter()
const $toast = useToast()
const budgetStore = useBudgetStore()
const { updateBudget, isLoading: isUpdating } = useUpdateBudget()
const { setTheme } = useTheme()

const isLoading = ref(false)

const currentTheme = computed(() => budgetStore.currentBudget?.theme || Theme.DARK)

const selectTheme = async (theme: Theme) => {
  if (!budgetStore.currentBudget?.id) {
    $toast.error('No budget selected')
    return
  }

  if (theme === currentTheme.value) {
    return // Already selected
  }

  try {
    await updateBudget(budgetStore.currentBudget.id, { theme })
    setTheme(theme)
  } catch (error) {
    console.error('Failed to update theme:', error)
    $toast.error('Failed to update theme')
  }
}

const handleBackToBudget = () => {
  router.back()
}

onMounted(() => {
  if (!budgetStore.currentBudget) {
    // Try to get budget ID from localStorage
    const lastVisitedBudgetId = localStorage.getItem('lastVisitedBudgetId')
    if (lastVisitedBudgetId) {
      router.push(`/budget/${lastVisitedBudgetId}`)
    } else {
      router.push('/dashboard')
    }
  }
})
</script>

