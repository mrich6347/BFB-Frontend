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
import { onMounted, ref, computed, watch } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import TrackingAccountHeader from '@/components/tracking/TrackingAccountHeader.vue'
import BalanceHistoryChart from '@/components/tracking/BalanceHistoryChart.vue'
import BalanceHistoryList from '@/components/tracking/BalanceHistoryList.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAccountStore } from '@/stores/account.store'
import { useBudgetStore } from '@/stores/budget.store'
import { MainDataService } from '@/services/common/mainData.service'
import { useCategoryStore } from '@/stores/category.store'
import { useTransactionStore } from '@/stores/transaction.store'

const route = useRoute()
const accountStore = useAccountStore()
const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()

// Make route parameters reactive
const accountId = computed(() => route.params.accountId as string)
const budgetId = computed(() => route.params.budgetId as string)
const isLoading = ref(true)
const chartKey = ref(0) // Used to force chart re-render

const account = computed(() => {
  return accountStore.accounts.find(acc => acc.id === accountId.value)
})

const loadMainData = async () => {
  isLoading.value = true

  try {
    // Load main data if we don't have it or if it's for a different budget
    if (!budgetStore.currentBudget || budgetStore.currentBudget.id !== budgetId.value) {
      const mainData = await MainDataService.getMainData(budgetId.value)

      if (mainData?.budget) {
        budgetStore.setCurrentBudget(mainData.budget)
      }
      if (mainData?.accounts?.length) {
        accountStore.setAccounts(mainData.accounts)
      }
      if (mainData?.categoryGroups) {
        categoryStore.setCategoryGroups(mainData.categoryGroups)
      }
      if (mainData?.categories) {
        categoryStore.setCategories(mainData.categories)
      }
      if (mainData?.categoryBalances) {
        categoryStore.setCategoryBalances(mainData.categoryBalances)
      }
      if (mainData?.readyToAssign !== undefined) {
        budgetStore.setReadyToAssign(mainData.readyToAssign)
      }
      if (mainData?.autoAssignConfigurations) {
        const { useAutoAssignStore } = await import('@/stores/auto-assign.store')
        const autoAssignStore = useAutoAssignStore()
        autoAssignStore.setConfigurations(mainData.autoAssignConfigurations)
      }
      if (mainData?.transactions) {
        transactionStore.setTransactions(mainData.transactions)
      }
    }
  } catch (error) {
    console.error('Failed to load tracking account data:', error)
  } finally {
    isLoading.value = false
  }
}

const handleBalanceUpdated = () => {
  // Force chart to re-render with updated data
  chartKey.value++
}

onMounted(loadMainData)

// Watch for route changes and reload data if needed
watch([budgetId], loadMainData)
</script>
