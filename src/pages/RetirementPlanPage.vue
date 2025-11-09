<template>
  <div class="flex h-screen">
    <Sidebar :budgetId="currentBudgetId" />
    <div class="flex-1 bg-background overflow-auto">
      <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-foreground">Retirement Plan</h1>
              <p class="mt-2 text-muted-foreground">
                Plan your retirement with our calculator and see how your savings will grow over time.
              </p>
            </div>
          </div>
        </div>

        <!-- Calculator Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                  placeholder="30"
                  min="18"
                  max="100"
                />
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
        </div>

        <!-- Chart Section -->
        <div class="bg-card rounded-lg border border-border shadow-sm p-6">
          <h2 class="text-xl font-semibold text-foreground mb-6">Growth Over Time</h2>
          <RetirementChart
            :current-age="currentAge"
            :retirement-age="retirementAge"
            :monthly-contribution="monthlyContribution"
            :starting-balance="startingBalance"
            :annual-return="annualReturnRate"
          />
        </div>


      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AlertCircleIcon } from 'lucide-vue-next'
import Sidebar from '../components/Sidebar.vue'
import RetirementChart from '../components/retirement/RetirementChart.vue'
import { useAccountStore } from '../stores/account.store'
import { useBudgetStore } from '../stores/budget.store'
import { AccountType } from '../types/DTO/account.dto'
import { formatCurrency } from '../utils/currencyUtil'

const accountStore = useAccountStore()
const budgetStore = useBudgetStore()

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
  startingBalance.value = trackingAccountsTotal.value
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
  return finalBalance.value - totalContributions.value
})

const interestPercentage = computed(() => {
  if (finalBalance.value === 0) return 0
  return ((totalInterest.value / finalBalance.value) * 100).toFixed(1)
})

onMounted(() => {
  // Load accounts if not already loaded
  if (currentBudgetId.value && accountStore.accounts.length === 0) {
    // Accounts should already be loaded by the app, but this is a safety check
    console.log('Retirement Plan: Using tracking accounts total:', trackingAccountsTotal.value)
  }
})
</script>

