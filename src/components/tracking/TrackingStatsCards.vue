<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Current Balance Card -->
    <div class="relative overflow-hidden rounded-lg border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
          <div class="space-y-1">
            <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              <AnimatedNumber :value="currentBalance" :format="formatCurrency" />
            </p>
            <p class="text-xs text-muted-foreground">as of today</p>
          </div>
        </div>
        <div class="rounded-full p-2 bg-emerald-100 dark:bg-emerald-900/50">
          <Wallet class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    </div>

    <!-- Highest Balance Card -->
    <div class="relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-muted-foreground mb-1">Highest Balance Ever</p>
          <div class="space-y-1">
            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
              <AnimatedNumber :value="highestBalance" :format="formatCurrency" />
            </p>
            <p class="text-xs text-muted-foreground">{{ highestBalanceDate }}</p>
          </div>
        </div>
        <div class="rounded-full p-2 bg-blue-100 dark:bg-blue-900/50">
          <ArrowUpCircle class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Wallet, ArrowUpCircle } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import type { BalanceHistoryPoint } from '@/services/tracking-account.service'

const props = defineProps<{
  balanceHistory: BalanceHistoryPoint[]
  currentBalance: number
}>()

// Find highest balance
const highestBalance = computed(() => {
  if (props.balanceHistory.length === 0) return props.currentBalance

  const allBalances = [...props.balanceHistory.map(p => p.balance), props.currentBalance]
  return Math.max(...allBalances)
})

const highestBalanceDate = computed(() => {
  if (props.balanceHistory.length === 0) return 'Today'

  const allPoints = [...props.balanceHistory, { balance: props.currentBalance, date: new Date().toISOString(), memo: '' }]
  const highestPoint = allPoints.reduce((max, point) => point.balance > max.balance ? point : max)

  const date = new Date(highestPoint.date)
  const today = new Date()

  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
})
</script>

