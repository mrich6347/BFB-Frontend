<template>
  <!-- Mobile View -->
  <div v-if="isMobile" class="h-screen overflow-auto">
    <MobileRetirementPlanView />
  </div>
  <!-- Desktop View -->
  <div v-else class="flex h-screen">
    <Sidebar :budgetId="currentBudgetId" />
    <div class="flex-1 bg-background overflow-auto">
      <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div class="space-y-10">
          <section class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary/80">
              <PiggyBankIcon class="h-4 w-4" />
              <span>Retirement Plan</span>
            </div>
            <div class="flex flex-wrap items-baseline gap-3">
              <h1 class="text-5xl font-bold text-foreground">Plan Your Future</h1>
            </div>
            <p class="text-muted-foreground max-w-2xl">
              Plan your retirement with our calculator and see how your savings will grow over time.
            </p>
          </section>

          <!-- Calculator Section -->
          <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Input Card -->
          <div class="bg-card rounded-lg border border-border shadow-sm p-6">
            <h2 class="text-xl font-semibold text-foreground mb-6">Your Information</h2>
            
            <div class="space-y-6">
              <!-- Current Starting Balance -->
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  Current Starting Balance
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    v-model.number="startingBalance"
                    @blur="handleStartingBalanceBlur"
                    class="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  Defaults to sum of tracking accounts: {{ formatCurrency(trackingAccountsTotal) }}
                </p>
              </div>

              <!-- Current Age -->
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  Current Age
                </label>
                <input
                  type="number"
                  v-model.number="currentAge"
                  class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  :class="{ 'bg-muted/30': isAgeAutoPopulated }"
                  placeholder="30"
                  min="18"
                  max="100"
                  :disabled="isAgeAutoPopulated"
                />
                <p v-if="!userProfileStore.currentProfile?.birthdate" class="mt-2 text-xs text-muted-foreground">
                  <router-link
                    to="/profile-settings"
                    class="text-primary hover:underline"
                  >
                    Set your birthdate on your profile
                  </router-link>
                  to have this auto-populated
                </p>
                <p v-else class="mt-2 text-xs text-muted-foreground">
                  Auto-populated from your profile birthdate
                </p>
              </div>

              <!-- Retirement Age -->
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  Retirement Age
                </label>
                <input
                  type="number"
                  v-model.number="retirementAge"
                  class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="60"
                  :min="currentAge + 1"
                  max="100"
                />
              </div>

              <!-- Monthly Contribution -->
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  Monthly Contribution
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    v-model.number="monthlyContribution"
                    class="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="2500.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <!-- Annual Return Rate -->
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  Expected Annual Return
                </label>
                <div class="relative">
                  <input
                    type="number"
                    v-model.number="annualReturnPercent"
                    class="w-full pr-8 pl-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="8"
                    step="0.1"
                    min="0"
                    max="20"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  Historical stock market average: ~8-10%. Compounded annually.
                </p>
              </div>
            </div>
          </div>

          <!-- Results Card -->
          <div class="bg-card rounded-lg border border-border shadow-sm p-6">
            <h2 class="text-xl font-semibold text-foreground mb-6">Projection Results</h2>
            
            <div v-if="isValidInput" class="space-y-6">
              <!-- Years to Retirement -->
              <div class="bg-primary/10 rounded-lg p-4">
                <div class="text-sm text-muted-foreground mb-1">Years to Retirement</div>
                <div class="text-3xl font-bold text-primary">
                  {{ yearsToRetirement }} years
                </div>
              </div>

              <!-- Final Balance -->
              <div class="bg-green-500/10 rounded-lg p-4">
                <div class="text-sm text-muted-foreground mb-1">Projected Balance at Age {{ retirementAge }}</div>
                <div class="text-3xl font-bold text-green-600 dark:text-green-400">
                  {{ formatCurrency(finalBalance) }}
                </div>
              </div>

              <!-- Breakdown -->
              <div class="space-y-3 pt-4 border-t border-border">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-muted-foreground">Starting Balance</span>
                  <span class="text-sm font-medium text-foreground">{{ formatCurrency(startingBalance) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-muted-foreground">Total Contributions</span>
                  <span class="text-sm font-medium text-foreground">{{ formatCurrency(totalContributions) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-muted-foreground">Interest Earned</span>
                  <span class="text-sm font-medium text-green-600 dark:text-green-400">{{ formatCurrency(totalInterest) }}</span>
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-border">
                  <span class="text-base font-semibold text-foreground">Total</span>
                  <span class="text-base font-bold text-foreground">{{ formatCurrency(finalBalance) }}</span>
                </div>
              </div>

              <!-- Interest Percentage -->
              <div class="bg-muted/50 rounded-lg p-4">
                <div class="text-sm text-muted-foreground mb-1">Interest as % of Total</div>
                <div class="text-2xl font-bold text-foreground">
                  {{ interestPercentage }}%
                </div>
                <p class="mt-2 text-xs text-muted-foreground">
                  The power of compound interest!
                </p>
              </div>
            </div>

            <div v-else class="flex items-center justify-center h-full text-muted-foreground">
              <p class="text-center">
                Fill in your information to see<br />your retirement projections
              </p>
            </div>
          </div>
          </section>

          <!-- Chart Section -->
          <section class="bg-card rounded-lg border border-border shadow-sm p-6">
          <h2 class="text-xl font-semibold text-foreground mb-6">Growth Over Time</h2>
          <RetirementChart
            :current-age="currentAge"
            :retirement-age="retirementAge"
            :monthly-contribution="monthlyContribution"
            :starting-balance="startingBalance"
            :annual-return="annualReturnRate"
          />
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { AlertCircleIcon, PiggyBankIcon } from 'lucide-vue-next'
import Sidebar from '../components/Sidebar.vue'
import MobileRetirementPlanView from '../components/mobile/MobileRetirementPlanView.vue'
import RetirementChart from '../components/retirement/RetirementChart.vue'
import { useAccountStore } from '../stores/account.store'
import { useBudgetStore } from '../stores/budget.store'
import { useUserProfileStore } from '../stores/user-profile.store'
import { AccountType } from '../types/DTO/account.dto'
import { formatCurrency } from '../utils/currencyUtil'
import { safeToFixed } from '../utils/numberFormatUtil'

const accountStore = useAccountStore()
const budgetStore = useBudgetStore()
const userProfileStore = useUserProfileStore()

// Mobile detection
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768 // Tailwind's md breakpoint
}

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

// Computed values
const currentBudgetId = computed(() => budgetStore.currentBudget?.id || '')

const trackingAccountsTotal = computed(() => {
  const trackingAccounts = accountStore.getAccountsByType(AccountType.TRACKING)
  return trackingAccounts.reduce((sum, account) => sum + (account.working_balance || 0), 0)
})

// Initialize starting balance with tracking accounts total
onMounted(() => {
  // Initialize mobile detection
  checkMobile()
  window.addEventListener('resize', checkMobile)

  startingBalance.value = trackingAccountsTotal.value

  // Auto-populate age from profile if available
  if (ageFromProfile.value !== null) {
    currentAge.value = ageFromProfile.value
  }
})

// Clean up event listener
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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

// Calculate final balance using compound interest formula
// Using annual compounding with monthly contributions (like Calculator.net)
const finalBalance = computed(() => {
  if (!isValidInput.value) return 0

  const years = yearsToRetirement.value
  const annualRate = annualReturnRate.value
  const monthlyContrib = monthlyContribution.value || 0
  const annualContrib = monthlyContrib * 12

  let balance = startingBalance.value || 0

  // Calculate year by year with annual compounding
  for (let year = 0; year < years; year++) {
    // Add annual contributions at the beginning of the year
    balance += annualContrib
    // Apply annual interest
    balance *= (1 + annualRate)
  }

  return balance
})

const totalContributions = computed(() => {
  if (!isValidInput.value) return 0
  return (startingBalance.value || 0) + ((monthlyContribution.value || 0) * yearsToRetirement.value * 12)
})

const totalInterest = computed(() => {
  if (!isValidInput.value) return 0
  return finalBalance.value - totalContributions.value
})

const interestPercentage = computed(() => {
  if (!isValidInput.value || finalBalance.value === 0) return '0.0'
  const percentage = (totalInterest.value / finalBalance.value) * 100
  return safeToFixed(percentage, 1)
})

// Handler to ensure starting balance defaults to 0 when empty
const handleStartingBalanceBlur = () => {
  if (startingBalance.value === null || startingBalance.value === undefined || isNaN(startingBalance.value)) {
    startingBalance.value = 0
  }
}

onMounted(() => {
  // Load accounts if not already loaded
  if (currentBudgetId.value && accountStore.accounts.length === 0) {
    // Accounts should already be loaded by the app, but this is a safety check
    console.log('Retirement Plan: Using tracking accounts total:', trackingAccountsTotal.value)
  }
})
</script>

