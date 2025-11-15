<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-background border-b border-border" style="padding-top: max(3rem, env(safe-area-inset-top));">
      <div class="px-4 pb-4 space-y-3">
        <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary/80">
          <PiggyBankIcon class="h-3.5 w-3.5" />
          <span>Retirement Plan</span>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">
            {{ isValidInput ? formatCurrency(finalBalance) : '$0' }}
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            {{ isValidInput ? `At age ${retirementAge}` : 'Enter your details' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 pt-4 space-y-4 pb-24">
      <!-- Input Section -->
      <div class="rounded-lg border border-border bg-card shadow-sm p-4 space-y-4">
        <h2 class="text-sm font-semibold text-foreground uppercase tracking-wide">Your Information</h2>
        
        <!-- Starting Balance -->
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1.5">
            Starting Balance
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              v-model.number="startingBalance"
              @blur="handleStartingBalanceBlur"
              class="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            Tracking accounts: {{ formatCurrency(trackingAccountsTotal) }}
          </p>
        </div>

        <!-- Age Inputs -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">
              Current Age
            </label>
            <input
              type="number"
              v-model.number="currentAge"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="30"
              min="18"
              max="100"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">
              Retirement Age
            </label>
            <input
              type="number"
              v-model.number="retirementAge"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="60"
              :min="currentAge + 1"
              max="100"
            />
          </div>
        </div>

        <!-- Birthdate Message -->
        <div v-if="!userProfileStore.currentProfile?.birthdate" class="text-xs text-muted-foreground">
          <router-link
            to="/profile-settings"
            class="text-primary hover:underline"
          >
            Set your birthdate on your profile
          </router-link>
          to auto-populate your age
        </div>
        <div v-else class="text-xs text-muted-foreground">
          Age auto-populated from your profile (editable for different predictions)
        </div>

        <!-- Monthly Contribution -->
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1.5">
            Monthly Contribution
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              v-model.number="monthlyContribution"
              class="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="2500.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <!-- Annual Return -->
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1.5">
            Expected Annual Return
          </label>
          <div class="relative">
            <input
              type="number"
              v-model.number="annualReturnPercent"
              class="w-full pr-8 pl-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="8"
              step="0.1"
              min="0"
              max="20"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            Historical average: ~8-10%
          </p>
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="isValidInput" class="space-y-3">
    

        <!-- Breakdown -->
        <div class="rounded-lg border border-border bg-card shadow-sm p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground">Breakdown</h3>
          
          <div class="space-y-2">
            <div class="flex justify-between items-center text-sm">
              <span class="text-muted-foreground">Starting Balance</span>
              <span class="font-medium text-foreground">{{ formatCurrency(startingBalance) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-muted-foreground">Total Contributions</span>
              <span class="font-medium text-foreground">{{ formatCurrency(totalContributionsOnly) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-muted-foreground">Interest Earned</span>
              <span :class="interestEarnedTextClass">{{ formatCurrency(totalInterest) }}</span>
            </div>
            <div class="pt-2 border-t border-border flex justify-between items-center">
              <span class="text-sm font-semibold text-foreground">Total</span>
              <span class="text-sm font-bold text-foreground">{{ formatCurrency(finalBalance) }}</span>
            </div>
          </div>
        </div>

        <!-- Visual Chart -->
        <div class="rounded-lg border border-border bg-card shadow-sm p-4">
          <h3 class="text-sm font-semibold text-foreground mb-4">Contributions vs Interest</h3>
          
          <!-- Stacked Bar Chart -->
          <div class="space-y-2">
            <div class="h-12 flex rounded-lg overflow-hidden">
              <div
                :class="contributionBarClass"
                :style="{ width: `${contributionPercentage}%` }"
              >
                <span v-if="contributionPercentage > 15">{{ contributionPercentage.toFixed(0) }}%</span>
              </div>
              <div
                :class="interestBarClass"
                :style="{ width: `${interestPercentage}%` }"
              >
                <span v-if="interestPercentage > 15">{{ interestPercentage.toFixed(0) }}%</span>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex items-center justify-center gap-4 text-xs">
              <div class="flex items-center gap-1.5">
                <div :class="contributionLegendClass"></div>
                <span class="text-muted-foreground">Contributions</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div :class="interestLegendClass"></div>
                <span class="text-muted-foreground">Interest</span>
              </div>
            </div>
          </div>

          <div class="mt-4 text-center">
            <p class="text-xs text-muted-foreground">
              Interest makes up <span class="font-semibold text-foreground">{{ interestPercentage.toFixed(1) }}%</span> of your total!
            </p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center min-h-[200px] p-4">
        <PiggyBankIcon class="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p class="text-muted-foreground text-center text-sm">
          Fill in your information above<br />to see your retirement projections
        </p>
      </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav
      active-tab="retirement"
      @navigate="handleNavigate"
    />

    <!-- Mobile Transaction Flow -->
    <MobileTransactionFlow
      ref="transactionFlowRef"
      @save-transaction="handleSaveTransaction"
      @save-transfer="handleSaveTransfer"
      @save-payment="handleSavePayment"
      @update-balance="handleUpdateBalance"
      @category-balance-change="handleCategoryBalanceChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { PiggyBankIcon } from 'lucide-vue-next'
import { useAccountStore } from '../../stores/account.store'
import { useBudgetStore } from '../../stores/budget.store'
import { useUserProfileStore } from '../../stores/user-profile.store'
import { useRetirementSettingsStore } from '../../stores/retirement-settings.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import { useMakeCreditCardPayment } from '@/composables/accounts/account-write/useMakeCreditCardPayment'
import { TrackingAccountService } from '@/services/tracking-account.service'
import { AccountService } from '@/services/account.service'
import { AccountType } from '../../types/DTO/account.dto'
import { Theme } from '../../types/DTO/budget.dto'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import { formatCurrency } from '../../utils/currencyUtil'
import { retirementSettingsService } from '../../services/retirement-settings.service'
import MobileBottomNav from './MobileBottomNav.vue'
import MobileTransactionFlow from './MobileTransactionFlow.vue'

const router = useRouter()
const accountStore = useAccountStore()
const budgetStore = useBudgetStore()
const userProfileStore = useUserProfileStore()
const retirementSettingsStore = useRetirementSettingsStore()
const { createTransaction } = useTransactionOperations()
const { makeCreditCardPayment } = useMakeCreditCardPayment()
const $toast = useToast()

const transactionFlowRef = ref<InstanceType<typeof MobileTransactionFlow> | null>(null)

// Helper function to calculate age from birthdate
const calculateAgeFromBirthdate = (birthdate: string): number => {
  const today = new Date()
  const birthDate = new Date(birthdate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Computed value for age from profile
const ageFromProfile = computed(() => {
  if (userProfileStore.currentProfile?.birthdate) {
    return calculateAgeFromBirthdate(userProfileStore.currentProfile.birthdate)
  }
  return null
})

// Reactive state
const currentAge = ref(27)
const retirementAge = ref(60)
const monthlyContribution = ref(2000)
const annualReturnPercent = ref(8)
const startingBalance = ref(0)

// Computed values
const currentBudget = computed(() => budgetStore.currentBudget)

const trackingAccountsTotal = computed(() => {
  const trackingAccounts = accountStore.getAccountsByType(AccountType.TRACKING)
  const total = trackingAccounts.reduce((sum, account) => sum + (account.working_balance || 0), 0)
  return Math.round(total * 100) / 100 // Round to 2 decimal places
})

const annualReturnRate = computed(() => annualReturnPercent.value / 100)

const isValidInput = computed(() => {
  return currentAge.value > 0 &&
         retirementAge.value != null &&
         retirementAge.value > currentAge.value &&
         retirementAge.value <= 100 &&
         monthlyContribution.value >= 0 &&
         startingBalance.value != null &&
         !isNaN(startingBalance.value) &&
         startingBalance.value >= 0
})

const yearsToRetirement = computed(() => {
  return retirementAge.value - currentAge.value
})

const finalBalance = computed(() => {
  if (!isValidInput.value) return 0

  const years = yearsToRetirement.value
  const annualRate = annualReturnRate.value
  const monthlyContrib = monthlyContribution.value || 0
  const annualContrib = monthlyContrib * 12

  let balance = startingBalance.value || 0

  for (let year = 0; year < years; year++) {
    balance += annualContrib
    balance *= (1 + annualRate)
  }

  return balance
})

const totalContributions = computed(() => {
  if (!isValidInput.value) return 0
  return (startingBalance.value || 0) + ((monthlyContribution.value || 0) * yearsToRetirement.value * 12)
})

const totalContributionsOnly = computed(() => {
  if (!isValidInput.value) return 0
  return (monthlyContribution.value || 0) * yearsToRetirement.value * 12
})

const totalInterest = computed(() => {
  if (!isValidInput.value) return 0
  return finalBalance.value - totalContributions.value
})

const contributionPercentage = computed(() => {
  if (!isValidInput.value || finalBalance.value === 0) return 0
  return (totalContributions.value / finalBalance.value) * 100
})

const interestPercentage = computed(() => {
  if (!isValidInput.value || finalBalance.value === 0) return 0
  return (totalInterest.value / finalBalance.value) * 100
})

// Theme-aware classes
const interestEarnedTextClass = computed(() => {
  const theme = budgetStore.currentBudget?.theme || Theme.DARK

  if (theme === Theme.AMBER) {
    return 'font-medium text-[#d5b9b2]' // pale-dogwood
  }

  return 'font-medium text-green-600 dark:text-green-400'
})

const contributionBarClass = computed(() => {
  const theme = budgetStore.currentBudget?.theme || Theme.DARK

  if (theme === Theme.AMBER) {
    return 'bg-[#a26769] flex items-center justify-center text-white text-xs font-medium' // rose-taupe
  }

  return 'bg-blue-500 flex items-center justify-center text-white text-xs font-medium'
})

const interestBarClass = computed(() => {
  const theme = budgetStore.currentBudget?.theme || Theme.DARK

  if (theme === Theme.AMBER) {
    return 'bg-[#d5b9b2] flex items-center justify-center text-white text-xs font-medium' // pale-dogwood
  }

  return 'bg-green-500 flex items-center justify-center text-white text-xs font-medium'
})

const contributionLegendClass = computed(() => {
  const theme = budgetStore.currentBudget?.theme || Theme.DARK

  if (theme === Theme.AMBER) {
    return 'w-3 h-3 bg-[#a26769] rounded' // rose-taupe
  }

  return 'w-3 h-3 bg-blue-500 rounded'
})

const interestLegendClass = computed(() => {
  const theme = budgetStore.currentBudget?.theme || Theme.DARK

  if (theme === Theme.AMBER) {
    return 'w-3 h-3 bg-[#d5b9b2] rounded' // pale-dogwood
  }

  return 'w-3 h-3 bg-green-500 rounded'
})

// Methods
const handleStartingBalanceBlur = () => {
  if (startingBalance.value === null || isNaN(startingBalance.value)) {
    startingBalance.value = trackingAccountsTotal.value
  }
}

const handleNavigate = (tab: 'budget' | 'accounts' | 'networth' | 'goals' | 'retirement' | 'calendar') => {
  if (tab === 'budget') {
    const budgetId = currentBudget.value?.id
    if (budgetId) {
      router.push(`/budget/${budgetId}`)
    }
  } else if (tab === 'accounts') {
    // Open transaction flow for account selection
    transactionFlowRef.value?.openFlow()
  } else if (tab === 'networth') {
    router.push('/net-worth')
  } else if (tab === 'goals') {
    router.push('/shared-goals')
  } else if (tab === 'calendar') {
    router.push('/calendar')
  }
  // Retirement tab is already the current view
}

// Transaction handlers
const handleSaveTransaction = async (data: CreateTransactionDto) => {
  try {
    const result = createTransaction(data)
    // Wait for the server response in the background
    await result.promise
    // Optimistic update provides instant feedback, no need to reload
  } catch (error) {
    console.error('Failed to create transaction:', error)
    $toast.error('Failed to create transaction')
  }
}

const handleSaveTransfer = async (data: CreateTransactionDto) => {
  try {
    const result = createTransaction(data)
    // Wait for the server response in the background
    await result.promise
    // Optimistic update provides instant feedback, no need to reload
  } catch (error) {
    console.error('Failed to create transfer:', error)
    $toast.error('Failed to create transfer')
  }
}

const handleSavePayment = async (creditCardAccountId: string, amount: number, fromAccountId: string, memo?: string) => {
  try {
    await makeCreditCardPayment(creditCardAccountId, amount, fromAccountId, memo)
    // Optimistic update provides instant feedback, no need to show toast
  } catch (error) {
    console.error('Failed to create payment:', error)
    $toast.error('Failed to create payment')
  }
}

const handleCategoryBalanceChange = (categoryName: string, oldBalance: number, newBalance: number) => {
  // No toast on this page, but handler is required by MobileTransactionFlow
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
  } catch (error) {
    console.error('Failed to update balance:', error)
    $toast.error('Failed to update balance')
  }
}

// Initialize starting balance with tracking accounts total
onMounted(() => {
  startingBalance.value = trackingAccountsTotal.value

  // Auto-populate age from profile if available
  if (ageFromProfile.value !== null) {
    currentAge.value = ageFromProfile.value
  }

  // Load saved retirement settings from store
  if (retirementSettingsStore.retirementSettings) {
    monthlyContribution.value = retirementSettingsStore.retirementSettings.monthly_contribution
    retirementAge.value = retirementSettingsStore.retirementSettings.retirement_age
  }
})

// Save settings when they change (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const saveSettings = async () => {
  const budgetId = currentBudget.value?.id
  if (!budgetId) return

  // Validate before saving
  // Don't save if monthly contribution is null or negative
  if (monthlyContribution.value == null || monthlyContribution.value < 0) return

  // Don't save if retirement age is null, less than/equal to current age, or greater than 100
  if (retirementAge.value == null || retirementAge.value <= currentAge.value || retirementAge.value > 100) return

  try {
    const settings = await retirementSettingsService.upsertRetirementSettings(budgetId, {
      monthly_contribution: monthlyContribution.value,
      retirement_age: retirementAge.value
    })
    retirementSettingsStore.setRetirementSettings(settings)
  } catch (error) {
    console.error('Failed to save retirement settings:', error)
  }
}

const debouncedSaveSettings = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(saveSettings, 500)
}

// Watch for changes to monthly contribution and retirement age
watch(monthlyContribution, debouncedSaveSettings)
watch(retirementAge, debouncedSaveSettings)
</script>

