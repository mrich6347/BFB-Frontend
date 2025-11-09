<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-background border-b border-border" style="padding-top: max(3rem, env(safe-area-inset-top));">
      <div class="px-4 pb-4 space-y-3">
        <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary/80">
          <TrendingUpIcon class="h-3.5 w-3.5" />
          <span>Net Worth</span>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">
            {{ formatCurrency(netWorth) }}
          </h1>
          <p v-if="currentBudget?.name" class="text-sm text-muted-foreground mt-1">
            {{ currentBudget.name }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto px-4 pt-4 space-y-4" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">

      <!-- Assets & Liabilities Summary Cards -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Total Assets Card -->
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <WalletIcon class="h-4 w-4 text-primary" />
            <span>Assets</span>
          </div>
          <div class="text-xl font-semibold text-foreground">
            {{ formatCurrency(totalAssets) }}
          </div>
        </div>

        <!-- Total Liabilities Card -->
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <CreditCardIcon class="h-4 w-4 text-destructive" />
            <span>Debt</span>
          </div>
          <div class="text-xl font-semibold text-foreground">
            {{ formatCurrency(totalLiabilitiesDisplay) }}
          </div>
        </div>
      </div>

      <!-- Account Groups -->
      <div v-if="hasActiveAccounts" class="space-y-3">
        <div
          v-for="group in accountGroups"
          :key="group.type"
          class="rounded-lg border border-border bg-card shadow-sm overflow-hidden"
        >
          <!-- Group Header -->
          <div class="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
            <h2 class="text-sm font-semibold text-foreground">{{ group.title }}</h2>
            <span
              class="text-sm font-medium tabular-nums"
              :class="group.total < 0 ? 'text-destructive' : 'text-foreground'"
            >
              {{ formatCurrency(group.total) }}
            </span>
          </div>

          <!-- Accounts List -->
          <div v-if="group.accounts.length" class="divide-y divide-border">
            <div
              v-for="account in group.accounts"
              :key="account.id"
              class="px-4 py-3 flex items-center justify-between"
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

          <!-- Empty State -->
          <div v-else class="px-4 py-6 text-center">
            <p class="text-sm text-muted-foreground italic">
              No accounts in this group yet.
            </p>
          </div>
        </div>
      </div>

      <!-- No Accounts State -->
      <div v-else class="flex flex-col items-center justify-center min-h-[200px] p-4">
        <InfoIcon class="h-12 w-12 text-muted-foreground mb-3" />
        <p class="text-muted-foreground text-center">
          No active accounts found. Create accounts to track your net worth.
        </p>
      </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav
      active-tab="networth"
      @navigate="handleNavigate"
    />

    <!-- Mobile Transaction Flow -->
    <MobileTransactionFlow
      ref="transactionFlowRef"
      @save-transaction="handleSaveTransaction"
      @save-transfer="handleSaveTransfer"
      @save-payment="handleSavePayment"
      @update-balance="handleUpdateBalance"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { useBudgetStore } from '@/stores/budget.store'
import { useAccountStore } from '@/stores/account.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import { AccountService } from '@/services/account.service'
import { TrackingAccountService } from '@/services/tracking-account.service'
import { AccountType, type AccountResponse } from '@/types/DTO/account.dto'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import { formatCurrency } from '@/utils/currencyUtil'
import { TrendingUpIcon, WalletIcon, CreditCardIcon, InfoIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import MobileBottomNav from './MobileBottomNav.vue'
import MobileTransactionFlow from './MobileTransactionFlow.vue'

const router = useRouter()
const budgetStore = useBudgetStore()
const accountStore = useAccountStore()
const { createTransaction } = useTransactionOperations()
const $toast = useToast()

const transactionFlowRef = ref<InstanceType<typeof MobileTransactionFlow> | null>(null)

const { currentBudget } = storeToRefs(budgetStore)
const { activeAccounts } = storeToRefs(accountStore)

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

const handleNavigate = (tab: 'budget' | 'accounts' | 'networth') => {
  if (tab === 'budget') {
    // Navigate to budget page
    const budgetId = currentBudget.value?.id
    if (budgetId) {
      router.push(`/budget/${budgetId}`)
    }
  } else if (tab === 'accounts') {
    // Open the transaction flow to account selection
    transactionFlowRef.value?.openFlow()
  }
  // Net worth tab is already the current view, no action needed
}

// Transaction handlers
const handleSaveTransaction = async (data: CreateTransactionDto) => {
  try {
    await createTransaction(data)
    $toast.success('Transaction created successfully')
  } catch (error) {
    console.error('Failed to create transaction:', error)
    $toast.error('Failed to create transaction')
  }
}

const handleSaveTransfer = async (data: CreateTransactionDto) => {
  try {
    await createTransaction(data)
    $toast.success('Transfer created successfully')
  } catch (error) {
    console.error('Failed to create transfer:', error)
    $toast.error('Failed to create transfer')
  }
}

const handleSavePayment = async (creditCardAccountId: string, amount: number, fromAccountId: string, memo?: string) => {
  try {
    // Create the payment transaction
    const paymentData: CreateTransactionDto = {
      account_id: creditCardAccountId,
      amount: amount,
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'inflow',
      category_id: 'ready-to-assign',
      memo: memo || 'Credit card payment',
      is_cleared: true,
      payee_name: 'Payment'
    }
    await createTransaction(paymentData)

    // Create the corresponding outflow from the paying account
    const outflowData: CreateTransactionDto = {
      account_id: fromAccountId,
      amount: amount,
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'outflow',
      category_id: 'ready-to-assign',
      memo: memo || 'Credit card payment',
      is_cleared: true,
      payee_name: 'Payment'
    }
    await createTransaction(outflowData)

    $toast.success('Payment created successfully')
  } catch (error) {
    console.error('Failed to create payment:', error)
    $toast.error('Failed to create payment')
  }
}

const handleUpdateBalance = async (accountId: string, newBalance: number) => {
  try {
    const account = accountStore.accounts.find(a => a.id === accountId)
    if (!account) {
      throw new Error('Account not found')
    }

    if (account.account_type === 'TRACKING') {
      await TrackingAccountService.updateBalance(accountId, {
        new_balance: newBalance,
        memo: 'Balance update'
      })
    } else {
      // For non-tracking accounts, use reconcile
      await AccountService.reconcileAccount(accountId, newBalance)
    }

    // Refresh account data
    await accountStore.loadAccounts(currentBudget.value!.id)
    $toast.success('Balance updated successfully')
  } catch (error) {
    console.error('Failed to update balance:', error)
    $toast.error('Failed to update balance')
  }
}
</script>

