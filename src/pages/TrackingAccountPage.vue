<template>
  <div class="relative min-h-screen">
    <div v-if="isLoading" class="flex justify-center items-center min-h-[400px]">
      <LoadingSpinner />
    </div>
    <div v-else class="flex h-screen">
      <Sidebar :budgetId="budgetId" />
      <div class="flex-1 overflow-auto">
        <TrackingAccountHeader :account="account" @balance-updated="handleBalanceUpdated" />
        <div class="p-4 space-y-6">
          <!-- Balance History Chart -->
          <div class="bg-card rounded-lg border p-6">
            <h2 class="text-lg font-semibold mb-4">Balance History</h2>
            <BalanceHistoryChart
              v-if="account"
              :accountId="account.id"
              :currentBalance="account.working_balance"
              :key="chartKey"
            />
          </div>

          <!-- Balance History List -->
          <div class="bg-card rounded-lg border p-6">
            <h2 class="text-lg font-semibold mb-4">Balance Updates</h2>
            <BalanceHistoryList
              v-if="account"
              :accountId="account.id"
              :key="chartKey"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { onMounted, ref, computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import TrackingAccountHeader from '@/components/tracking/TrackingAccountHeader.vue'
import BalanceHistoryChart from '@/components/tracking/BalanceHistoryChart.vue'
import BalanceHistoryList from '@/components/tracking/BalanceHistoryList.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAccountStore } from '@/stores/account.store'
import { useBalanceHistory } from '@/composables/tracking/useBalanceHistory'

const route = useRoute()
const accountStore = useAccountStore()

// Make route parameters reactive
const accountId = computed(() => route.params.accountId as string)
const budgetId = computed(() => route.params.budgetId as string)
const isLoading = ref(true)
const chartKey = ref(0) // Used to force chart re-render

// Use balance history composable for refreshing data
const { refreshBalanceHistory } = useBalanceHistory(accountId.value)

const account = computed(() => {
  return accountStore.accounts.find(acc => acc.id === accountId.value)
})

const handleBalanceUpdated = async () => {
  // Refresh balance history data and force chart to re-render
  await refreshBalanceHistory()
  chartKey.value++
}

onMounted(() => {
  isLoading.value = true
})
</script>
