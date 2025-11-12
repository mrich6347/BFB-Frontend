<template>
  <div class="relative min-h-screen">
    <!-- Render TrackingAccountPage for tracking accounts -->
    <TrackingAccountPage
      v-if="account?.account_type === 'TRACKING'"
      :key="accountId"
    />
    <!-- Render regular account page for other account types -->
    <div v-else class="flex h-screen">
      <Sidebar :budgetId="budgetId" />
      <div class="flex-1 overflow-auto bg-card">
        <AccountHeader :account="account" />
        <div class="p-4">
          <TransactionTable
            :accountId="accountId"
            :highlightScheduledId="highlightScheduledId"
            :expandScheduled="expandScheduled"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import AccountHeader from '@/components/transactions/AccountHeader.vue'
import TransactionTable from '@/components/transactions/TransactionTable.vue'
import TrackingAccountPage from './TrackingAccountPage.vue'
import { useAccountStore } from '@/stores/account.store'

const route = useRoute()
const accountStore = useAccountStore()

// Make route parameters reactive
const accountId = computed(() => route.params.accountId as string)
const budgetId = computed(() => route.params.budgetId as string)

// Get query params for highlighting scheduled transaction
const highlightScheduledId = computed(() => route.query.highlightScheduledId as string | undefined)
const expandScheduled = computed(() => route.query.expandScheduled === 'true')

const account = computed(() => {
  return accountStore.accounts.find(acc => acc.id === accountId.value)
})
</script>

