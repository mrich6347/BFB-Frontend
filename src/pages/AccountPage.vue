<template>
  <div class="relative min-h-screen">
    <div v-if="isLoading" class="flex justify-center items-center min-h-[400px]">
      <LoadingSpinner />
    </div>
    <!-- Render TrackingAccountPage for tracking accounts -->
    <TrackingAccountPage
      v-else-if="account?.account_type === 'TRACKING'"
      :key="accountId"
    />
    <!-- Render regular account page for other account types -->
    <div v-else class="flex h-screen">
      <Sidebar :budgetId="budgetId" />
      <div class="flex-1 overflow-auto">
        <AccountHeader :account="account" />
        <div class="p-4">
          <TransactionTable :accountId="accountId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { onMounted, ref, computed, watch } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import AccountHeader from '@/components/transactions/AccountHeader.vue'
import TransactionTable from '@/components/transactions/TransactionTable.vue'
import TrackingAccountPage from './TrackingAccountPage.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAccountStore } from '@/stores/account.store'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'

const route = useRoute()
const accountStore = useAccountStore()
const { ensureDataLoaded, isLoading: mainDataLoading } = useMainDataOperations()

// Make route parameters reactive
const accountId = computed(() => route.params.accountId as string)
const budgetId = computed(() => route.params.budgetId as string)
const isLoading = ref(true)

const account = computed(() => {
  return accountStore.accounts.find(acc => acc.id === accountId.value)
})

const loadMainData = async () => {
  try {
    isLoading.value = true
    // Ensure data is loaded for this budget (will be no-op if already loaded by App.vue)
    await ensureDataLoaded(budgetId.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadMainData)

// Watch for route changes and reload data if needed
watch([budgetId], loadMainData)
</script>
