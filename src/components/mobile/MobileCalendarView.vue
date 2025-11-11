<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-background border-b border-border" style="padding-top: max(3rem, env(safe-area-inset-top));">
      <div class="px-4 pb-4 space-y-3">
        <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary/80">
          <CalendarIcon class="h-3.5 w-3.5" />
          <span>Bill Reminders</span>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-foreground">
            Upcoming Bill Reminders
          </h1>
          <p v-if="currentBudget?.name" class="text-sm text-muted-foreground mt-1">
            {{ currentBudget.name }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 pt-4 space-y-4 pb-24">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner />
      </div>

      <!-- Scheduled Transactions List -->
      <div v-else-if="groupedTransactions.length > 0" class="space-y-4">
        <div v-for="group in groupedTransactions" :key="group.date" class="space-y-2">
          <!-- Date Header -->
          <div class="flex items-center justify-between px-2 py-1">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-foreground">
                {{ group.dateLabel }}
              </h3>
              <span class="text-xs text-muted-foreground">
                ({{ group.transactions.length }})
              </span>
            </div>
            <span class="text-xs font-medium" :class="group.totalAmount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
              {{ formatCurrency(Math.abs(group.totalAmount)) }}
            </span>
          </div>

          <!-- Transactions for this date -->
          <div class="space-y-2">
            <div
              v-for="transaction in group.transactions"
              :key="transaction.id"
              class="relative overflow-hidden rounded-lg"
            >
              <!-- Edit button (revealed on swipe) -->
              <div class="absolute inset-y-0 right-0 flex items-center">
                <button
                  @click.stop="handleEdit(transaction)"
                  class="h-full px-6 bg-blue-500 text-white font-medium flex items-center justify-center"
                >
                  Edit
                </button>
              </div>

              <!-- Swipeable transaction content -->
              <div
                :ref="el => setTransactionRef(transaction.id, el)"
                class="w-full bg-card border border-border touch-pan-y"
                :class="{ 'transition-transform duration-200 ease-out': !isSwiping(transaction.id) }"
                :style="{ transform: `translateX(${getSwipeOffset(transaction.id)}px)` }"
                @touchstart="handleTouchStart($event, transaction.id)"
                @touchmove="handleTouchMove($event, transaction.id)"
                @touchend="handleTouchEnd(transaction.id)"
              >
                <div class="flex items-center gap-3 p-4">
                  <!-- Active/Inactive indicator -->
                  <div
                    class="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
                    :class="transaction.is_active
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-muted border-muted-foreground/30'"
                  >
                    <CalendarClockIcon
                      :class="[
                        'w-4 h-4',
                        transaction.is_active ? 'text-white' : 'text-muted-foreground'
                      ]"
                    />
                  </div>

                  <!-- Transaction Details -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0 flex-1">
                        <p class="font-medium text-foreground truncate">
                          {{ transaction.payee }}
                        </p>
                        <p class="text-xs text-muted-foreground truncate">
                          {{ getCategoryName(transaction.category_id) }}
                        </p>
                        <p class="text-xs text-muted-foreground mt-0.5">
                          {{ formatFrequency(transaction) }}
                        </p>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <p
                          class="font-semibold tabular-nums"
                          :class="transaction.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'"
                        >
                          {{ formatCurrency(Math.abs(transaction.amount)) }}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          {{ getAccountName(transaction.account_id) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center min-h-[300px] p-4">
        <CalendarIcon class="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p class="text-muted-foreground text-center text-sm">
          No scheduled transactions yet.<br />
          Create one from an account page to get started!
        </p>
      </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav
      active-tab="calendar"
      @navigate="handleNavigate"
    />

    <!-- Edit Scheduled Transaction Modal -->
    <EditScheduledTransactionModal
      :is-open="isEditModalOpen"
      :transaction="selectedTransaction"
      @close="closeEditModal"
      @save="handleSaveEdit"
      @delete="handleDeleteScheduledTransaction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { CalendarIcon, CalendarClockIcon } from 'lucide-vue-next'
import MobileBottomNav from './MobileBottomNav.vue'
import EditScheduledTransactionModal from '@/components/scheduled-transactions/EditScheduledTransactionModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useBudgetStore } from '@/stores/budget.store'
import { useScheduledTransactionStore } from '@/stores/scheduled-transaction.store'
import { useCategoryStore } from '@/stores/category.store'
import { useAccountStore } from '@/stores/account.store'
import { formatCurrency } from '@/utils/currencyUtil'
import type { ScheduledTransactionResponse } from '@/types/DTO/scheduled-transaction.dto'
import { useSwipeToReveal } from '@/composables/mobile/useSwipeToReveal'
import { useScheduledTransactionOperations } from '@/composables/scheduled-transactions/useScheduledTransactionOperations'

const router = useRouter()
const budgetStore = useBudgetStore()
const scheduledTransactionStore = useScheduledTransactionStore()
const categoryStore = useCategoryStore()
const accountStore = useAccountStore()
const { currentBudget } = storeToRefs(budgetStore)
const { updateScheduledTransaction, deleteScheduledTransaction } = useScheduledTransactionOperations()

const isLoading = ref(false)
const isEditModalOpen = ref(false)
const selectedTransaction = ref<ScheduledTransactionResponse | null>(null)

// Swipe to reveal functionality
const {
  setTransactionRef,
  getSwipeOffset,
  isSwiping,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd
} = useSwipeToReveal()

// Get all scheduled transactions sorted by next date
const allScheduledTransactions = computed(() => {
  return [...scheduledTransactionStore.scheduledTransactions].sort((a, b) => {
    const dateA = calculateNextDate(a)
    const dateB = calculateNextDate(b)
    return dateA.getTime() - dateB.getTime()
  })
})

// Calculate next date for a scheduled transaction
const calculateNextDate = (transaction: ScheduledTransactionResponse): Date => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  let nextDate: Date

  if (transaction.frequency === 'ONCE' && transaction.specific_date) {
    nextDate = new Date(transaction.specific_date)
  } else if (transaction.frequency === 'MONTHLY' && transaction.day_of_month) {
    nextDate = new Date(year, month, transaction.day_of_month)
    if (nextDate < today) {
      nextDate = new Date(year, month + 1, transaction.day_of_month)
    }
  } else if (transaction.frequency === 'YEARLY' && transaction.day_of_month && transaction.month_of_year) {
    nextDate = new Date(year, transaction.month_of_year - 1, transaction.day_of_month)
    if (nextDate < today) {
      nextDate = new Date(year + 1, transaction.month_of_year - 1, transaction.day_of_month)
    }
  } else {
    nextDate = today
  }

  return nextDate
}

// Group transactions by date (next 30 days)
const groupedTransactions = computed(() => {
  const groups = new Map<string, {
    date: Date
    dateLabel: string
    transactions: ScheduledTransactionResponse[]
    totalAmount: number
  }>()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const oneMonthFromNow = new Date(today)
  oneMonthFromNow.setDate(today.getDate() + 30)

  allScheduledTransactions.value.forEach(transaction => {
    const nextDate = calculateNextDate(transaction)
    nextDate.setHours(0, 0, 0, 0)

    // Only include transactions in the next 30 days
    if (nextDate >= today && nextDate <= oneMonthFromNow) {
      const dateKey = nextDate.toISOString().split('T')[0]

      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: nextDate,
          dateLabel: formatDateLabel(nextDate),
          transactions: [],
          totalAmount: 0
        })
      }

      const group = groups.get(dateKey)!
      group.transactions.push(transaction)
      group.totalAmount += transaction.amount
    }
  })

  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
})

// Group by weeks
const weeklyGroups = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weeks: {
    weekLabel: string
    weekNumber: number
    dateGroups: typeof groupedTransactions.value
  }[] = []

  groupedTransactions.value.forEach(group => {
    const diffTime = group.date.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    let weekNumber: number
    let weekLabel: string

    if (diffDays < 7) {
      weekNumber = 0
      weekLabel = 'This Week'
    } else if (diffDays < 14) {
      weekNumber = 1
      weekLabel = 'Next Week'
    } else if (diffDays < 21) {
      weekNumber = 2
      weekLabel = 'In 2 Weeks'
    } else if (diffDays < 28) {
      weekNumber = 3
      weekLabel = 'In 3 Weeks'
    } else {
      weekNumber = 4
      weekLabel = 'In 4 Weeks'
    }

    let week = weeks.find(w => w.weekNumber === weekNumber)
    if (!week) {
      week = {
        weekLabel,
        weekNumber,
        dateGroups: []
      }
      weeks.push(week)
    }

    week.dateGroups.push(group)
  })

  return weeks.sort((a, b) => a.weekNumber - b.weekNumber)
})

const formatDateLabel = (date: Date): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === 2) return 'In 2 days'
  if (diffDays === 3) return 'In 3 days'
  if (diffDays === 4) return 'In 4 days'
  if (diffDays === 5) return 'In 5 days'
  if (diffDays === 6) return 'In 6 days'
  if (diffDays === 7) return 'In 1 week'
  if (diffDays > 7 && diffDays <= 14) {
    const weeksAndDays = diffDays - 7
    if (weeksAndDays === 0) return 'In 1 week'
    if (weeksAndDays === 7) return 'In 2 weeks'
    return `In 1 week, ${weeksAndDays} day${weeksAndDays > 1 ? 's' : ''}`
  }

  // Fallback (shouldn't happen with 2-week filter)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

const formatFrequency = (transaction: ScheduledTransactionResponse): string => {
  if (transaction.frequency === 'ONCE') return 'One-time'
  if (transaction.frequency === 'MONTHLY') return 'Monthly'
  if (transaction.frequency === 'YEARLY') return 'Yearly'
  return transaction.frequency
}

const getCategoryName = (categoryId?: string) => {
  if (!categoryId) return 'Uncategorized'
  if (categoryId === 'ready-to-assign') return 'Ready to Assign'
  const category = categoryStore.categories.find(c => c.id === categoryId)
  return category?.name || 'Unknown'
}

const getAccountName = (accountId: string) => {
  const account = accountStore.accounts.find(a => a.id === accountId)
  return account?.name || 'Unknown'
}

const handleEdit = (transaction: ScheduledTransactionResponse) => {
  selectedTransaction.value = transaction
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedTransaction.value = null
}

const handleSaveEdit = async (updates: Partial<ScheduledTransactionResponse>) => {
  if (!selectedTransaction.value) return

  try {
    await updateScheduledTransaction(selectedTransaction.value.id, updates)
    closeEditModal()
  } catch (error) {
    console.error('Failed to update scheduled transaction:', error)
  }
}

const handleDeleteScheduledTransaction = async (id: string) => {
  try {
    await deleteScheduledTransaction(id)
    closeEditModal()
  } catch (error) {
    console.error('Failed to delete scheduled transaction:', error)
  }
}

const handleNavigate = (tab: 'budget' | 'accounts' | 'goals' | 'retirement' | 'networth' | 'calendar') => {
  if (tab === 'budget') {
    const budgetId = currentBudget.value?.id
    if (budgetId) {
      router.push(`/budget/${budgetId}`)
    }
  } else if (tab === 'accounts') {
    // Open transaction flow for account selection
    transactionFlowRef.value?.openFlow()
  } else if (tab === 'networth') {
    router.push('/net-worth')
  } else if (tab === 'goals') {
    router.push('/shared-goals')
  } else if (tab === 'retirement') {
    router.push('/retirement-plan')
  }
  // Calendar tab is already the current view
}
</script>

