<template>
  <div class="flex h-screen">
    <Sidebar :budgetId="currentBudgetId" />
    <div class="flex-1 bg-background overflow-auto">
      <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-foreground">Shared Goals</h1>
            <p class="mt-2 text-muted-foreground">
              Collaborate with others to achieve your financial goals together.
            </p>
          </div>
          <button
            @click="isCreateModalOpen = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Create Goal
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span class="ml-3 text-muted-foreground">Loading goals...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="rounded-md bg-destructive/10 border border-destructive/20 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <AlertCircleIcon class="h-5 w-5 text-destructive" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-destructive">Error</h3>
            <p class="mt-1 text-sm text-destructive/80">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!goals || goals.length === 0" class="text-center py-12">
        <TargetIcon class="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 class="mt-2 text-sm font-medium text-foreground">No shared goals</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Get started by creating your first shared goal.
        </p>
        <div class="mt-6">
          <button
            @click="isCreateModalOpen = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Create Goal
          </button>
        </div>
      </div>

      <!-- Goals Grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="goal in goals"
          :key="goal.id"
          class="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          @click="handleGoalClick(goal)"
        >
          <div class="p-6">
            <!-- Goal Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-medium text-card-foreground truncate">
                  {{ goal.name }}
                </h3>
                <p v-if="goal.description" class="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {{ goal.description }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClasses(goal.status)"
                >
                  {{ goal.status }}
                </span>
              </div>
            </div>

            <!-- Progress -->
            <div class="mt-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Progress</span>
                <span class="font-medium text-card-foreground">
                  {{ formatCurrency(goal.current_amount || 0) }} / {{ formatCurrency(goal.target_amount) }}
                </span>
              </div>
              <div class="mt-2 bg-secondary rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${Math.min((goal.progress_percentage || 0), 100)}%` }"
                ></div>
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                {{ Math.round(goal.progress_percentage || 0) }}% complete
              </div>
            </div>

            <!-- Goal Info -->
            <div class="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div class="flex items-center">
                <UsersIcon class="h-4 w-4 mr-1" />
                {{ goal.participants?.length || 0 }} participant{{ (goal.participants?.length || 0) !== 1 ? 's' : '' }}
              </div>
              <div v-if="goal.target_date" class="flex items-center">
                <CalendarIcon class="h-4 w-4 mr-1" />
                {{ formatDate(goal.target_date) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>

  <!-- Create Goal Modal -->
  <CreateGoalModal
    :is-open="isCreateModalOpen"
    @update:is-open="isCreateModalOpen = $event"
    @goal-created="handleGoalCreated"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon, TargetIcon, UsersIcon, CalendarIcon, AlertCircleIcon } from 'lucide-vue-next'
import { useSharedGoalOperations } from '../composables/shared-goals/useSharedGoalOperations'
import { useSharedGoalsStore } from '../stores/shared-goals.store'
import { useBudgetStore } from '../stores/budget.store'
import Sidebar from '../components/Sidebar.vue'
import CreateGoalModal from '../components/shared-goals/CreateGoalModal.vue'
import type { SharedGoalResponse, GoalStatus } from '../types/DTO/shared-goal.dto'

const router = useRouter()
const { isLoading, error } = useSharedGoalOperations()
const sharedGoalsStore = useSharedGoalsStore()
const budgetStore = useBudgetStore()

const isCreateModalOpen = ref(false)

// Computed
const goals = computed(() => sharedGoalsStore.goals)
const currentBudgetId = computed(() => budgetStore.currentBudget?.id || '')

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getStatusClasses = (status: GoalStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-primary/10 text-primary'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'PAUSED':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'CANCELLED':
      return 'bg-destructive/10 text-destructive'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}

const handleGoalClick = (goal: SharedGoalResponse) => {
  // Navigate to goal details (to be implemented)
  console.log('Goal clicked:', goal)
}

const handleGoalCreated = (goal: SharedGoalResponse) => {
  console.log('Goal created:', goal)
  // Goal is already added to store by the composable
}

// Note: Goals are loaded via main data service in App.vue, no need for onMounted loadGoals
</script>
