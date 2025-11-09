<template>
  <div class="w-full">
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="flex justify-center items-center py-8 text-destructive">
      <p>{{ error }}</p>
    </div>
    <div v-else-if="balanceHistory.length === 0" class="flex justify-center items-center py-8 text-muted-foreground">
      <p>No balance updates yet</p>
    </div>
    <div v-else class="space-y-2">
      <!-- Show recent items first, with pagination for long lists -->
      <div class="max-h-96 overflow-y-auto space-y-2">
        <div
          v-for="(point, index) in displayedHistory"
          :key="`${point.date}-${index}`"
          class="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-accent/50 transition-all duration-200 hover:shadow-sm"
        >
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="text-sm font-medium">
                {{ formatDate(point.date) }}
              </div>
              <div class="text-sm text-muted-foreground">
                {{ point.memo || 'Balance update' }}
              </div>
            </div>
          </div>
          <div class="text-right flex items-center gap-3">
            <!-- Change indicator -->
            <div v-if="getChangeFromPrevious(index)" class="flex items-center gap-1">
              <div class="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" :class="[
                getChangeFromPrevious(index)!.amount >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              ]">
                <ArrowUp v-if="getChangeFromPrevious(index)!.amount >= 0" class="w-3 h-3" />
                <ArrowDown v-else class="w-3 h-3" />
                <span>{{ formatCurrency(Math.abs(getChangeFromPrevious(index)!.amount)) }}</span>
                <span class="opacity-75">({{ getChangeFromPrevious(index)!.percentage }})</span>
              </div>
            </div>

            <!-- Balance -->
            <div class="font-semibold text-lg" :class="[
              point.balance < 0 ? 'text-destructive' : 'text-foreground'
            ]">
              {{ formatCurrency(point.balance) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Show More / Show Less buttons for long lists -->
      <div v-if="balanceHistory.length > ITEMS_PER_PAGE" class="flex justify-center pt-4">
        <button
          v-if="!showAll"
          @click="showAll = true"
          class="px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Show All ({{ balanceHistory.length }} items)
        </button>
        <button
          v-else
          @click="showAll = false"
          class="px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Show Less
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowUp, ArrowDown } from 'lucide-vue-next'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatCurrency } from '@/utils/currencyUtil'
import { useBalanceHistory } from '@/composables/tracking/useBalanceHistory'

const props = defineProps<{
  accountId: string
}>()

const ITEMS_PER_PAGE = 10

const { balanceHistory, isLoading, error, loadBalanceHistory } = useBalanceHistory(props.accountId)
const showAll = ref(false)

const displayedHistory = computed(() => {
  if (showAll.value || balanceHistory.value.length <= ITEMS_PER_PAGE) {
    return balanceHistory.value
  }
  return balanceHistory.value.slice(0, ITEMS_PER_PAGE)
})

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getChangeFromPrevious = (index: number): { amount: number; percentage: string } | null => {
  // Balance history is sorted newest first
  // So we compare with the next item (which is older)
  if (index >= displayedHistory.value.length - 1) {
    return null // No previous balance to compare
  }

  const currentBalance = displayedHistory.value[index].balance
  const previousBalance = displayedHistory.value[index + 1].balance
  const change = currentBalance - previousBalance

  if (previousBalance === 0) {
    return { amount: change, percentage: '0%' }
  }

  const percentageChange = (change / Math.abs(previousBalance)) * 100
  const sign = percentageChange >= 0 ? '+' : ''

  return {
    amount: change,
    percentage: `${sign}${percentageChange.toFixed(1)}%`
  }
}

onMounted(loadBalanceHistory)

// Watch for account ID changes
watch(() => props.accountId, () => {
  loadBalanceHistory()
})
</script>
