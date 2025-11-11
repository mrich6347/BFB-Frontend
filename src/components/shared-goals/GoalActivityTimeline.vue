<template>
  <div class="w-full">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-4">
      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
      <span class="ml-2 text-sm text-muted-foreground">Loading activity...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-destructive/10 border border-destructive/20 p-3">
      <p class="text-xs text-destructive">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!events || events.length === 0" class="text-center py-4">
      <p class="text-sm text-muted-foreground">No recent activity</p>
    </div>

    <!-- Activity Timeline -->
    <div v-else class="space-y-2">
      <div
        v-for="event in events"
        :key="event.id"
        class="flex items-start gap-2 text-sm py-2 border-b border-border last:border-0"
      >
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <div
            v-if="event.event_type === 'assigned'"
            class="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
          >
            <TrendingUpIcon class="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          </div>
          <div
            v-else
            class="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center"
          >
            <TrendingDownIcon class="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <!-- Event Details -->
        <div class="flex-1 min-w-0">
          <p class="text-foreground">
            <span class="font-medium">{{ event.user_profile.display_name || event.user_profile.username }}</span>
            <span v-if="event.event_type === 'assigned'" class="text-muted-foreground">
              assigned
            </span>
            <span v-else class="text-muted-foreground">
              removed
            </span>
            <span class="font-semibold" :class="event.event_type === 'assigned' ? 'text-green-600' : 'text-orange-600'">
              {{ formatCurrency(event.amount_change) }}
            </span>
          </p>
          <p class="text-xs text-muted-foreground">
            {{ formatTimeAgo(event.created_at) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-vue-next'
import { SharedGoalsService } from '../../services/shared-goals.service'
import type { GoalEventResponse } from '../../types/DTO/shared-goal.dto'

const props = defineProps<{
  goalId: string
  daysBack?: number
}>()

const events = ref<GoalEventResponse[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const loadEvents = async () => {
  try {
    isLoading.value = true
    error.value = null
    events.value = await SharedGoalsService.getGoalEvents(props.goalId, props.daysBack || 7)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load activity'
    console.error('Error loading goal events:', err)
  } finally {
    isLoading.value = false
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const eventDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - eventDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else {
    return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

onMounted(() => {
  loadEvents()
})

// Reload events when goalId changes
watch(() => props.goalId, () => {
  loadEvents()
})

// Expose refresh method for parent components
defineExpose({
  refresh: loadEvents
})
</script>

