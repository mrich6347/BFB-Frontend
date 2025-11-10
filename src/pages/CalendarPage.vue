<template>
  <div v-if="isLoading" class="flex h-screen items-center justify-center">
    <LoadingSpinner />
  </div>
  <!-- Mobile Not Supported Message -->
  <div v-else-if="isMobile" class="flex h-screen items-center justify-center p-6">
    <div class="text-center max-w-md">
      <CalendarIcon class="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h2 class="text-2xl font-bold text-foreground mb-2">Desktop Only</h2>
      <p class="text-muted-foreground">
        The Calendar feature is currently only available on desktop. Please visit this page on a larger screen to view your scheduled bills.
      </p>
    </div>
  </div>
  <!-- Desktop View -->
  <div v-else class="flex h-screen">
    <Sidebar :budgetId="currentBudgetId" />
    <div class="flex-1 overflow-auto bg-background">
      <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-3xl font-bold text-foreground">Scheduled Transactions</h1>
              <p class="text-muted-foreground mt-1">View your upcoming bills and income</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="previousMonth"
                class="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeftIcon class="w-5 h-5" />
              </button>
              <div class="text-lg font-semibold min-w-[200px] text-center">
                {{ currentMonthYear }}
              </div>
              <button
                @click="nextMonth"
                class="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRightIcon class="w-5 h-5" />
              </button>
              <button
                @click="goToToday"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

        </div>

        <!-- Calendar Grid -->
        <div class="bg-card border border-border rounded-lg overflow-hidden">
          <!-- Day Headers -->
          <div class="grid grid-cols-7 border-b border-border bg-muted/50">
            <div
              v-for="day in daysOfWeek"
              :key="day"
              class="p-3 text-center text-sm font-semibold text-foreground"
            >
              {{ day }}
            </div>
          </div>

          <!-- Calendar Days -->
          <div class="grid grid-cols-7 auto-rows-fr">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              :class="[
                'min-h-[140px] border-r border-b border-border p-3',
                day.isCurrentMonth ? 'bg-background' : 'bg-muted/20',
                day.isToday ? 'bg-primary/5' : '',
                day.isPast && !day.isToday ? 'opacity-40' : '',
                index % 7 === 6 ? 'border-r-0' : ''
              ]"
            >
              <div class="flex flex-col h-full">
                <div class="flex items-center justify-between mb-2">
                  <span
                    :class="[
                      'text-sm font-semibold',
                      day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
                      day.isToday ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs' : ''
                    ]"
                  >
                    {{ day.date }}
                  </span>
                </div>

                <!-- Scheduled Bills for this day -->
                <div class="space-y-2 overflow-y-auto flex-1">
                  <div
                    v-for="transaction in day.transactions"
                    :key="transaction.id"
                    :class="[
                      'text-xs p-2 rounded-lg cursor-pointer transition-all hover:shadow-md border',
                      transaction.amount < 0
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/30'
                        : 'bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100 border-green-200 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-950/30'
                    ]"
                    @click="showTransactionDetails(transaction)"
                  >
                    <div class="font-semibold truncate mb-1">{{ transaction.payee }}</div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[10px] text-muted-foreground truncate flex-1">{{ transaction.category }}</span>
                      <span :class="[
                        'font-bold text-xs whitespace-nowrap',
                        transaction.amount < 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                      ]">
                        {{ formatCurrency(Math.abs(transaction.amount)) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Bills List -->
        <div class="mt-8">
          <h2 class="text-xl font-bold text-foreground mb-4">Upcoming Bills This Month</h2>
          <div class="bg-card border border-border rounded-lg overflow-hidden">
            <div class="divide-y divide-border">
              <div
                v-for="transaction in upcomingTransactions"
                :key="transaction.id"
                class="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                @click="showTransactionDetails(transaction)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                      <TrendingDownIcon class="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <div class="font-semibold text-foreground">{{ transaction.payee }}</div>
                      <div class="text-sm text-muted-foreground">{{ transaction.category }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-red-600">
                      {{ formatCurrency(Math.abs(transaction.amount)) }}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {{ formatDate(transaction.date) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'
import { useBudgetStore } from '@/stores/budget.store'
import { formatCurrency } from '@/utils/currencyUtil'
import { ChevronLeftIcon, ChevronRightIcon, TrendingDownIcon, CalendarIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { scheduledTransactionService } from '@/services/scheduled-transaction.service'
import type { ScheduledTransactionResponse } from '@/types/DTO/scheduled-transaction.dto'
import { useCategoryStore } from '@/stores/category.store'

const router = useRouter()
const { ensureDataLoaded, isLoading } = useMainDataOperations()
const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const { currentBudget } = storeToRefs(budgetStore)

const currentBudgetId = computed(() => currentBudget.value?.id || '')

// Mobile detection
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768 // Tailwind's md breakpoint
}

// Calendar state
const currentDate = ref(new Date())
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Scheduled transactions
const scheduledTransactions = ref<ScheduledTransactionResponse[]>([])
const isLoadingScheduled = ref(false)

// Load scheduled transactions
const loadScheduledTransactions = async () => {
  if (!currentBudgetId.value) return

  isLoadingScheduled.value = true
  try {
    const transactions = await scheduledTransactionService.findAllByBudget(currentBudgetId.value)
    scheduledTransactions.value = transactions
  } catch (error) {
    console.error('Error loading scheduled transactions:', error)
  } finally {
    isLoadingScheduled.value = false
  }
}

// Watch for budget changes and reload scheduled transactions
watch(currentBudgetId, () => {
  if (currentBudgetId.value) {
    loadScheduledTransactions()
  }
}, { immediate: true })

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const days = []

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i
    const fullDate = new Date(year, month - 1, date)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isPast: fullDate < todayStart,
      fullDate,
      transactions: []
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const fullDate = new Date(year, month, i)
    const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year
    
    // Get transactions for this day
    const dayTransactions = scheduledTransactions.value
      .filter(t => {
        // For ONCE transactions, check specific_date
        if (t.frequency === 'ONCE') {
          if (!t.specific_date) return false
          const specificDate = new Date(t.specific_date)
          return specificDate.getDate() === i &&
                 specificDate.getMonth() === month &&
                 specificDate.getFullYear() === year
        }
        // For MONTHLY transactions, check day_of_month
        if (t.frequency === 'MONTHLY') {
          return t.day_of_month === i
        }
        // For YEARLY transactions, check both day_of_month and month_of_year
        if (t.frequency === 'YEARLY') {
          return t.day_of_month === i && t.month_of_year === (month + 1)
        }
        // For WEEKLY and BIWEEKLY, check day_of_week
        if (t.frequency === 'WEEKLY' || t.frequency === 'BIWEEKLY') {
          return fullDate.getDay() === t.day_of_week
        }
        return false
      })
      .map(t => {
        const category = t.category_id
          ? categoryStore.categories.find(c => c.id === t.category_id)
          : null
        return {
          id: t.id,
          payee: t.payee,
          amount: t.amount,
          category: category?.name || 'Uncategorized',
          date: fullDate,
          frequency: t.frequency
        }
      })
    
    const isPast = fullDate < todayStart

    days.push({
      date: i,
      isCurrentMonth: true,
      isToday,
      isPast,
      fullDate,
      transactions: dayTransactions
    })
  }
  
  // Next month days to fill the grid
  const remainingDays = 42 - days.length // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const fullDate = new Date(year, month + 1, i)
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      isPast: fullDate < todayStart,
      fullDate,
      transactions: []
    })
  }
  
  return days
})

const upcomingTransactions = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const today = new Date()

  return scheduledTransactions.value
    .map(t => {
      let date: Date

      // Calculate the next occurrence date based on frequency
      if (t.frequency === 'ONCE') {
        // For ONCE, use the specific_date
        date = t.specific_date ? new Date(t.specific_date) : new Date()
      } else if (t.frequency === 'MONTHLY') {
        date = new Date(year, month, t.day_of_month || 1)
      } else if (t.frequency === 'YEARLY') {
        date = new Date(year, (t.month_of_year || 1) - 1, t.day_of_month || 1)
      } else if (t.frequency === 'WEEKLY' || t.frequency === 'BIWEEKLY') {
        // Find the next occurrence of the day of week
        const currentDay = today.getDay()
        const targetDay = t.day_of_week || 0
        let daysUntil = targetDay - currentDay
        if (daysUntil < 0) daysUntil += 7
        date = new Date(today)
        date.setDate(today.getDate() + daysUntil)
      } else {
        date = new Date(year, month, 1)
      }

      const category = t.category_id
        ? categoryStore.categories.find(c => c.id === t.category_id)
        : null

      return {
        id: t.id,
        payee: t.payee,
        amount: t.amount,
        category: category?.name || 'Uncategorized',
        date,
        frequency: t.frequency
      }
    })
    .filter(t => t.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
})

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const goToToday = () => {
  currentDate.value = new Date()
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const showTransactionDetails = (transaction: any) => {
  // TODO: Open modal with transaction details
  console.log('Show details for:', transaction)
}

onMounted(async () => {
  try {
    let targetBudgetId = currentBudgetId.value
    if (!targetBudgetId) {
      targetBudgetId = localStorage.getItem('lastVisitedBudgetId') || ''
    }

    if (!targetBudgetId) {
      console.error('No budget ID available for Calendar page')
      router.push('/dashboard')
      return
    }

    localStorage.setItem('lastVisitedBudgetId', targetBudgetId)

    const success = await ensureDataLoaded(targetBudgetId)
    if (!success) {
      console.error('Failed to load budget data')
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Error loading calendar page:', error)
    router.push('/dashboard')
  }
})
</script>

