<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-background border-b border-border" style="padding-top: max(3rem, env(safe-area-inset-top));">
      <div class="px-4 pb-4">
        <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary/80">
          <PiggyBankIcon class="h-3.5 w-3.5" />
          <span>Retirement Plan</span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 pt-4 space-y-4 pb-24">
      <!-- Key Projections Section (Top Priority) -->
      <div v-if="isValidInput" class="space-y-3">
        <!-- Projected Balance - Hero Card -->
        <div class="rounded-lg border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-5 shadow-lg">
          <div class="text-xs font-medium text-muted-foreground mb-1">Projected Balance at Retirement</div>
          <div class="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
            {{ formatCurrency(finalBalance) }}
          </div>
          <div class="text-sm text-muted-foreground">
            In {{ yearsToRetirement }} years (age {{ retirementAge }})
          </div>
        </div>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Total Contributions -->
          <div class="rounded-lg border border-border bg-blue-500/10 p-4">
            <div class="text-xs text-muted-foreground mb-1">You'll Contribute</div>
            <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ formatCurrency(totalContributions) }}
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              {{ contributionPercentage.toFixed(0) }}% of total
            </div>
          </div>

          <!-- Interest Earned -->
          <div class="rounded-lg border border-border bg-green-500/10 p-4">
            <div class="text-xs text-muted-foreground mb-1">Interest Earned</div>
            <div class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ formatCurrency(totalInterest) }}
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              {{ interestPercentage.toFixed(0) }}% of total
            </div>
          </div>
        </div>
      </div>

      <!-- Input Section (Collapsible) -->
      <div class="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <button
          @click="showInputs = !showInputs"
          class="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <h2 class="text-sm font-semibold text-foreground uppercase tracking-wide">Adjust Your Plan</h2>
          <svg
            class="w-5 h-5 text-muted-foreground transition-transform"
            :class="{ 'rotate-180': showInputs }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div v-show="showInputs" class="p-4 space-y-4">
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
                :class="{ 'bg-muted/30': isAgeAutoPopulated }"
                placeholder="30"
                min="18"
                max="100"
                :disabled="isAgeAutoPopulated"
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
          <div v-if="!userProfileStore.currentProfile?.birthdate" class="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            <router-link
              to="/profile-settings"
              class="text-primary hover:underline font-medium"
            >
              Set your birthdate
            </router-link>
            to auto-populate age
          </div>
          <div v-else class="text-xs text-green-600 dark:text-green-400 bg-green-500/10 p-2 rounded">
            ✓ Age auto-populated from profile
          </div>

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
      </div>

      <!-- Empty State -->
      <div v-if="!isValidInput" class="flex flex-col items-center justify-center min-h-[200px] p-4">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PiggyBankIcon } from 'lucide-vue-next'
import { useAccountStore } from '../../stores/account.store'
import { useBudgetStore } from '../../stores/budget.store'
import { useUserProfileStore } from '../../stores/user-profile.store'
import { AccountType } from '../../types/DTO/account.dto'
import { formatCurrency } from '../../utils/currencyUtil'
import MobileBottomNav from './MobileBottomNav.vue'

const router = useRouter()
const accountStore = useAccountStore()
const budgetStore = useBudgetStore()
const userProfileStore = useUserProfileStore()

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

// Computed value to check if age is auto-populated from profile
const isAgeAutoPopulated = computed(() => {
  return !!userProfileStore.currentProfile?.birthdate
})

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
const showInputs = ref(true)
const showBreakdown = ref(false)

// Computed values
const currentBudget = computed(() => budgetStore.currentBudget)

const trackingAccountsTotal = computed(() => {
  const trackingAccounts = accountStore.getAccountsByType(AccountType.TRACKING)
  return trackingAccounts.reduce((sum, account) => sum + (account.working_balance || 0), 0)
})

const annualReturnRate = computed(() => annualReturnPercent.value / 100)

const isValidInput = computed(() => {
  return currentAge.value > 0 &&
         retirementAge.value > currentAge.value &&
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
    router.push('/net-worth')
  } else if (tab === 'networth') {
    router.push('/net-worth')
  } else if (tab === 'goals') {
    router.push('/shared-goals')
  } else if (tab === 'calendar') {
    router.push('/calendar')
  }
  // Retirement tab is already the current view
}

// Initialize starting balance with tracking accounts total
onMounted(() => {
  startingBalance.value = trackingAccountsTotal.value

  // Auto-populate age from profile if available
  if (ageFromProfile.value !== null) {
    currentAge.value = ageFromProfile.value
  }
})
</script>

