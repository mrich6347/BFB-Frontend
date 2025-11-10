<template>
  <div v-if="scheduledTransactions.length > 0" class="space-y-2">
    <!-- Collapsible Header -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div class="flex items-center gap-2">
        <CalendarClockIcon class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-semibold text-foreground">
          Scheduled Transactions ({{ scheduledTransactions.length }})
        </span>
        <span
          v-if="selectedCount > 0"
          class="text-xs uppercase tracking-wide text-muted-foreground ml-2"
        >
          {{ selectedCount }} selected
        </span>
      </div>
      <ChevronDownIcon
        :class="[
          'w-4 h-4 text-muted-foreground transition-transform',
          isExpanded ? 'rotate-180' : ''
        ]"
      />
    </button>

    <!-- Expanded Content -->
    <div v-if="isExpanded" class="rounded-md border border-border bg-card/30 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm border-collapse">
          <thead class="bg-muted/20 text-muted-foreground uppercase tracking-wide text-[0.65rem]">
            <tr>
              <th class="px-4 py-3 font-medium text-left w-40">Payee</th>
              <th class="px-4 py-3 font-medium text-left w-40">Category</th>
              <th class="px-4 py-3 font-medium text-left w-32">Frequency</th>
              <th class="px-4 py-3 font-medium text-left w-32">Next Date</th>
              <th class="px-4 py-3 font-medium text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="transaction in scheduledTransactions"
              :key="transaction.id"
              :class="[
                'border-b border-border transition-colors select-none hover:bg-muted/20 cursor-pointer',
                selectedScheduledIds.includes(transaction.id)
                  ? 'bg-primary/10 ring-1 ring-primary/40 hover:bg-primary/10'
                  : ''
              ]"
              @click="handleRowClick(transaction.id, $event)"
              @dblclick="handleEdit(transaction)"
            >
              <td class="px-4 py-3 text-foreground">
                {{ transaction.payee }}
              </td>
              <td class="px-4 py-3 text-foreground">
                {{ getCategoryName(transaction.category_id) }}
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {{ formatFrequency(transaction) }}
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {{ formatNextDate(transaction) }}
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="transaction.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
                  {{ formatCurrency(Math.abs(transaction.amount)) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarClockIcon, ChevronDownIcon } from 'lucide-vue-next'
import type { ScheduledTransactionResponse } from '@/types/DTO/scheduled-transaction.dto'
import { useCategoryStore } from '@/stores/category.store'
import { formatCurrency } from '@/utils/currencyUtil'

const props = defineProps<{
  scheduledTransactions: ScheduledTransactionResponse[]
  selectedScheduledIds: string[]
}>()

const emit = defineEmits<{
  edit: [transaction: ScheduledTransactionResponse]
  'update:selectedScheduledIds': [ids: string[]]
}>()

const categoryStore = useCategoryStore()
const isExpanded = ref(false)
const lastSelectedId = ref<string | null>(null)

const selectedCount = computed(() => props.selectedScheduledIds.length)

const getCategoryName = (categoryId?: string) => {
  if (!categoryId) return 'Uncategorized'
  const category = categoryStore.categories.find(c => c.id === categoryId)
  return category?.name || 'Uncategorized'
}

const formatFrequency = (transaction: ScheduledTransactionResponse) => {
  switch (transaction.frequency) {
    case 'ONCE':
      return 'Once'
    case 'MONTHLY':
      return `Monthly (${transaction.day_of_month}${getDaySuffix(transaction.day_of_month || 1)})`
    case 'WEEKLY':
      return `Weekly (${getDayName(transaction.day_of_week || 0)})`
    case 'BIWEEKLY':
      return `Bi-weekly (${getDayName(transaction.day_of_week || 0)})`
    case 'YEARLY':
      return `Yearly (${getMonthName(transaction.month_of_year || 1)} ${transaction.day_of_month})`
    default:
      return transaction.frequency
  }
}

const formatNextDate = (transaction: ScheduledTransactionResponse) => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  let nextDate: Date

  if (transaction.frequency === 'ONCE') {
    if (!transaction.specific_date) return 'N/A'
    nextDate = new Date(transaction.specific_date)
  } else if (transaction.frequency === 'MONTHLY') {
    nextDate = new Date(year, month, transaction.day_of_month || 1)
    if (nextDate < today) {
      nextDate = new Date(year, month + 1, transaction.day_of_month || 1)
    }
  } else if (transaction.frequency === 'YEARLY') {
    nextDate = new Date(year, (transaction.month_of_year || 1) - 1, transaction.day_of_month || 1)
    if (nextDate < today) {
      nextDate = new Date(year + 1, (transaction.month_of_year || 1) - 1, transaction.day_of_month || 1)
    }
  } else if (transaction.frequency === 'WEEKLY' || transaction.frequency === 'BIWEEKLY') {
    const currentDay = today.getDay()
    const targetDay = transaction.day_of_week || 0
    let daysUntil = targetDay - currentDay
    if (daysUntil < 0) daysUntil += 7
    nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysUntil)
  } else {
    return 'N/A'
  }

  return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getDaySuffix = (day: number) => {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

const getDayName = (day: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[day] || 'Unknown'
}

const getMonthName = (month: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1] || 'Unknown'
}

const handleRowClick = (id: string, event: MouseEvent) => {
  const currentIds = new Set(props.selectedScheduledIds)
  const orderedTransactions = props.scheduledTransactions

  if (event.shiftKey && lastSelectedId.value) {
    // Shift+click: select range
    const startIndex = orderedTransactions.findIndex(t => t.id === lastSelectedId.value)
    const endIndex = orderedTransactions.findIndex(t => t.id === id)

    if (startIndex !== -1 && endIndex !== -1) {
      const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
      const rangeIds = orderedTransactions
        .slice(from, to + 1)
        .map(t => t.id)
      rangeIds.forEach(rangeId => currentIds.add(rangeId))
    } else {
      currentIds.clear()
      currentIds.add(id)
    }
  } else if (event.metaKey || event.ctrlKey) {
    // Cmd/Ctrl+click: toggle individual selection
    if (currentIds.has(id)) {
      currentIds.delete(id)
    } else {
      currentIds.add(id)
    }
  } else {
    // Regular click: toggle if it's the only one selected, otherwise select only this one
    if (props.selectedScheduledIds.length === 1 && props.selectedScheduledIds[0] === id) {
      currentIds.clear()
    } else {
      currentIds.clear()
      currentIds.add(id)
    }
  }

  emit('update:selectedScheduledIds', Array.from(currentIds))
  lastSelectedId.value = currentIds.size ? id : null
}

const handleEdit = (transaction: ScheduledTransactionResponse) => {
  emit('edit', transaction)
}
</script>

