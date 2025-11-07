<template>
  <div class="flex h-screen">
    <Sidebar :budgetId="currentBudgetId" />
    <div class="flex-1 bg-background overflow-auto">
      <div class="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div v-if="isLoadingPage" class="flex justify-center items-center min-h-[320px]">
          <LoadingSpinner />
        </div>

        <div v-else-if="initializationError" class="flex flex-col items-center justify-center min-h-[320px] text-center space-y-4">
          <p class="text-muted-foreground max-w-md">
            {{ initializationError }}
          </p>
          <Button variant="default" @click="goToDashboard">
            Return to dashboard
          </Button>
        </div>

        <div v-else class="space-y-10">
          <section class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary/80">
              <TrendingUpIcon class="h-4 w-4" />
              <span>Net Worth</span>
            </div>
            <div class="flex flex-wrap items-baseline gap-3">
              <h1 class="text-5xl font-bold text-foreground">
                {{ formatCurrency(netWorth) }}
              </h1>
              <span v-if="currentBudget?.name" class="text-muted-foreground text-lg">
                {{ currentBudget.name }}
              </span>
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
                        :class="account.account_balance < 0 ? 'text-destructive' : 'text-foreground'"
                      >
                        {{ formatCurrency(account.account_balance) }}
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Button from '@/components/shadcn-ui/button.vue'
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

const isInitializing = ref(true)
const initializationError = ref<string | null>(null)

const ynabReferenceNetWorth = 36786.22

const currentBudgetId = computed(() => currentBudget.value?.id || '')

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
    const balance = Number(account.account_balance ?? account.working_balance ?? 0)
    groups[type].push(account)
    totals[type] += balance
  })

  const orderedTypes: AccountType[] = [AccountType.CASH, AccountType.TRACKING, AccountType.CREDIT]

  return orderedTypes.map((type) => {
    const sortedAccounts =
      groups[type]
        ?.slice()
        .sort((a, b) => {
          const balanceA = Number(a.account_balance ?? a.working_balance ?? 0)
          const balanceB = Number(b.account_balance ?? b.working_balance ?? 0)

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
    const balance = Number(account.account_balance ?? account.working_balance ?? 0)
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

const isLoadingPage = computed(() => isInitializing.value || isLoading.value)

const goToDashboard = async () => {
  await router.push('/dashboard')
}

onMounted(async () => {
  try {
    let targetBudgetId = currentBudgetId.value

    if (!targetBudgetId) {
      targetBudgetId = localStorage.getItem('lastVisitedBudgetId') || ''
    }

    if (!targetBudgetId) {
      initializationError.value = 'Select a budget to view net worth details.'
      await goToDashboard()
      return
    }

    const success = await ensureDataLoaded(targetBudgetId)

    if (!success) {
      initializationError.value = 'Unable to load this budget. Redirecting you back to the dashboard.'
      await goToDashboard()
      return
    }

    localStorage.setItem('lastVisitedBudgetId', targetBudgetId)
  } catch (error) {
    console.error('Failed to initialize Net Worth page', error)
    initializationError.value = 'Something went wrong loading your net worth. Please try again.'
  } finally {
    isInitializing.value = false
  }
})
</script>

