<template>
  <div v-if="isLoading" class="flex h-screen items-center justify-center">
    <LoadingSpinner />
  </div>
  <!-- Mobile View -->
  <div v-else-if="isMobile" class="h-screen overflow-auto">
    <MobileNetWorthView />
  </div>
  <!-- Desktop View -->
  <div v-else class="flex h-screen">
    <Sidebar :budgetId="currentBudgetId" />
    <div class="flex-1 bg-background overflow-auto">
      <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div class="space-y-10">
          <section class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary/80">
              <TrendingUpIcon class="h-4 w-4" />
              <span>Net Worth</span>
            </div>
            <div class="flex flex-wrap items-baseline gap-3">
              <h1 class="text-5xl font-bold text-foreground">
                {{ formatCurrency(netWorth) }}
              </h1>
            </div>
            <p class="text-muted-foreground max-w-2xl">
              Assets minus liabilities across all active accounts in this budget.
            </p>
          </section>

          <section class="grid gap-6 md:grid-cols-2">
            <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div class="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total Assets</span>
                <WalletIcon class="h-5 w-5 text-primary" />
              </div>
              <div class="mt-3 text-3xl font-semibold text-foreground">
                {{ formatCurrency(totalAssets) }}
              </div>
              <p class="mt-2 text-sm text-muted-foreground">
                Cash on hand and long-term tracking accounts.
              </p>
            </div>
            <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div class="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total Liabilities</span>
                <CreditCardIcon class="h-5 w-5 text-destructive" />
              </div>
              <div class="mt-3 text-3xl font-semibold text-foreground">
                {{ formatCurrency(totalLiabilitiesDisplay) }}
              </div>
              <p class="mt-2 text-sm text-muted-foreground">
                Credit balances and other debts counted against your net worth.
              </p>
            </div>
          </section>

          <!-- Net Worth History Chart (Web Only) -->
          <section>
            <NetWorthHistoryChart />
          </section>

          <section class="space-y-4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <InfoIcon class="h-4 w-4" />
              <span>
                Detailed Breakdown
              </span>
            </div>

            <div v-if="hasActiveAccounts" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <article
                v-for="group in accountGroups"
                :key="group.type"
                class="rounded-xl border border-border bg-card shadow-sm"
              >
                <div class="p-6 space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-foreground">{{ group.title }}</h2>
                    <span
                      class="text-lg font-medium tabular-nums"
                      :class="group.total < 0 ? 'text-destructive' : 'text-foreground'"
                    >
                      {{ formatCurrency(group.total) }}
                    </span>
                  </div>

                  <div v-if="group.accounts.length" class="border-t border-border pt-4 space-y-3">
                    <div
                      v-for="account in group.accounts"
                      :key="account.id"
                      class="flex items-center justify-between"
                    >
                      <span class="text-sm text-foreground truncate pr-4">
                        {{ account.name }}
                      </span>
                      <span
                        class="text-sm font-medium tabular-nums"
                        :class="getNetWorthBalance(account) < 0 ? 'text-destructive' : 'text-foreground'"
                      >
                        {{ formatCurrency(getNetWorthBalance(account)) }}
                      </span>
                    </div>
                  </div>

                  <p v-else class="text-sm text-muted-foreground italic border-t border-border pt-4">
                    No accounts in this group yet.
                  </p>
                </div>
              </article>
            </div>

            <div v-else class="rounded-xl border border-dashed border-border bg-background/50 p-10 text-center">
              <p class="text-foreground text-lg font-medium">
                No active accounts yet
              </p>
              <p class="mt-2 text-sm text-muted-foreground">
                Add a checking, savings, investment, or credit account to see your net worth summary.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import MobileNetWorthView from '@/components/mobile/MobileNetWorthView.vue'
import NetWorthHistoryChart from '@/components/NetWorthHistoryChart.vue'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'
import { useBudgetStore } from '@/stores/budget.store'
import { useAccountStore } from '@/stores/account.store'
import { AccountType, type AccountResponse } from '@/types/DTO/account.dto'
import { formatCurrency } from '@/utils/currencyUtil'
import { TrendingUpIcon, WalletIcon, CreditCardIcon, InfoIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const router = useRouter()
const { ensureDataLoaded, isLoading } = useMainDataOperations()
const budgetStore = useBudgetStore()
const accountStore = useAccountStore()

const { currentBudget } = storeToRefs(budgetStore)
const { activeAccounts } = storeToRefs(accountStore)

// Mobile detection
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768 // Tailwind's md breakpoint
}

const currentBudgetId = computed(() => currentBudget.value?.id || '')

const getNetWorthBalance = (account: AccountResponse) => {
  if (account.working_balance !== undefined && account.working_balance !== null) {
    const workingBalance = Number(account.working_balance)
    if (!Number.isNaN(workingBalance)) {
      return workingBalance
    }
  }

  const accountBalance = Number(account.account_balance ?? 0)
  return Number.isNaN(accountBalance) ? 0 : accountBalance
}

const accountGroups = computed(() => {
  const descriptors: Record<AccountType, { title: string }> = {
    [AccountType.CASH]: {
      title: 'Cash'
    },
    [AccountType.TRACKING]: {
      title: 'Investments'
    },
    [AccountType.CREDIT]: {
      title: 'Debt'
    }
  }

  const groups: Record<AccountType, AccountResponse[]> = {
    [AccountType.CASH]: [],
    [AccountType.TRACKING]: [],
    [AccountType.CREDIT]: []
  }

  const totals: Record<AccountType, number> = {
    [AccountType.CASH]: 0,
    [AccountType.TRACKING]: 0,
    [AccountType.CREDIT]: 0
  }

  activeAccounts.value.forEach((account) => {
    const type = account.account_type as AccountType
    if (!groups[type]) {
      return
    }
    const balance = getNetWorthBalance(account)
    groups[type].push(account)
    totals[type] += balance
  })

  const orderedTypes: AccountType[] = [AccountType.CASH, AccountType.TRACKING, AccountType.CREDIT]

  return orderedTypes.map((type) => {
    const sortedAccounts =
      groups[type]
        ?.slice()
        .sort((a, b) => {
          const balanceA = getNetWorthBalance(a)
          const balanceB = getNetWorthBalance(b)

          if (type === AccountType.CREDIT) {
            // For debt, show the most negative balance first (ascending)
            return balanceA - balanceB
          }

          // For cash and investments, show highest balance first (descending)
          return balanceB - balanceA
        }) ?? []

    return {
      type,
      title: descriptors[type].title,
      total: totals[type],
      accounts: sortedAccounts
    }
  })
})

const totals = computed(() => {
  let cashTotal = 0
  let trackingTotal = 0
  let creditTotal = 0

  activeAccounts.value.forEach((account) => {
    const balance = getNetWorthBalance(account)
    switch (account.account_type) {
      case AccountType.CASH:
        cashTotal += balance
        break
      case AccountType.TRACKING:
        trackingTotal += balance
        break
      case AccountType.CREDIT:
        creditTotal += balance
        break
      default:
        break
    }
  })

  const assets = cashTotal + trackingTotal
  const liabilities = creditTotal
  const netWorth = assets + liabilities

  return {
    assets,
    liabilities,
    netWorth
  }
})

const netWorth = computed(() => totals.value.netWorth)
const totalAssets = computed(() => totals.value.assets)
const totalLiabilities = computed(() => totals.value.liabilities)
const totalLiabilitiesDisplay = computed(() => Math.abs(totalLiabilities.value))

const hasActiveAccounts = computed(() => activeAccounts.value.length > 0)

// Ensure data is loaded when the component mounts
onMounted(async () => {
  try {
    // Initialize mobile detection
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Get the budget ID from current budget or localStorage
    let targetBudgetId = currentBudgetId.value
    if (!targetBudgetId) {
      targetBudgetId = localStorage.getItem('lastVisitedBudgetId') || ''
    }

    if (!targetBudgetId) {
      console.error('No budget ID available for Net Worth page')
      router.push('/dashboard')
      return
    }

    // Save this as the last visited budget
    localStorage.setItem('lastVisitedBudgetId', targetBudgetId)

    const success = await ensureDataLoaded(targetBudgetId)
    if (!success) {
      console.error('Failed to load budget data')
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Error loading budget data:', error)
    router.push('/dashboard')
  }
})

// Clean up event listener
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

