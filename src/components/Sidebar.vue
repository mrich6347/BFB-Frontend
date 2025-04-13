<template>
  <aside class="w-72 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
    <!-- Header with Theme Toggle -->
    <div class="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
      <ThemeToggle class="text-gray-600 dark:text-gray-300" />
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Budget Friendly Budget</h1>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto">
      <!-- Main Navigation -->
      <div class="p-3">
        <router-link 
          v-for="item in mainNavItems" 
          :key="item.name"
          :to="item.to"
          class="flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 mb-1"
        >
          <component :is="item.icon" class="w-5 h-5 mr-3" />
          {{ item.name }}
        </router-link>
      </div>

      <!-- Account Sections -->
      <div class="px-3">
        <template v-for="section in accountSections" :key="section.title">
          <button 
            @click="toggleSection(section.title as SectionTitle)"
            class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center">
              <ChevronDownIcon 
                v-if="expandedSections[section.title as SectionTitle]"
                class="w-4 h-4 mr-1 transition-transform"
              />
              <ChevronRightIcon 
                v-else
                class="w-4 h-4 mr-1 transition-transform"
              />
              <span>{{ section.title }}</span>
            </div>
            <span>{{ formatCurrency(section.total) }}</span>
          </button>
          <div v-if="expandedSections[section.title as SectionTitle]" class="mb-4">
            <router-link
              v-for="account in section.accounts"
              :key="account.id"
              :to="'/account/' + account.id"
              class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ml-2 min-w-0"
            >
              <span class="text-gray-700 dark:text-gray-200 truncate flex-shrink min-w-0 mr-4">{{ account.name }}</span>
              <span :class="[
                'flex-shrink-0 tabular-nums',
                account.balance < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
              ]">{{ formatCurrency(account.balance) }}</span>
            </router-link>
          </div>
        </template>
      </div>

      <!-- Add Account Button -->
      <div class="p-4">
        <button 
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon class="w-5 h-5 mr-2" />
          Add Account
        </button>
      </div>
    </nav>

    <!-- Settings Section -->
    <div class="border-t border-gray-200 dark:border-gray-800">
      <div v-if="isSettingsExpanded" class="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button @click="router.push('/dashboard')" 
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
        >
          <ArrowLeftIcon class="w-5 h-5 mr-2" />
          Back to Budgets
        </button>
        <button @click="authService.logout()" 
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
        >
          <LogOutIcon class="w-5 h-5 mr-2" />
          Log Out
        </button>
      </div>
      <button 
        @click="toggleSettings"
        class="w-full p-4 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Settings2Icon class="w-5 h-5" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ThemeToggle from './common/ThemeToggle.vue'
import { 
  BarChart2Icon,
  PieChartIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Settings2Icon,
  LogOutIcon,
  ArrowLeftIcon
} from 'lucide-vue-next'
import { authService } from '../services/common/authService'
import { formatCurrency } from '@/utils/currencyUtil'
import router from '@/router'


type SectionTitle = 'CASH' | 'CREDIT' | 'TRACKING' | 'CLOSED'

const mainNavItems = [
  { name: 'Budget', to: '/budget', icon: BarChart2Icon },
  { name: 'Reports', to: '/reports', icon: PieChartIcon },
]

const accountSections = ref([
  {
    title: 'CASH',
    total: 15102.00,
    accounts: [
      { id: 1, name: 'Wells Fargo Checking', balance: 855.73 },
      { id: 2, name: 'Citi Emergency Fund', balance: 14246.27 },
      { id: 3, name: 'House Savings', balance: 0.00 },
    ]
  },
  {
    title: 'CREDIT',
    total: -208.18,
    accounts: [
      { id: 4, name: 'Citi Double Cash Citi Double Cash', balance: -1234425.95 },
      { id: 5, name: 'Apple Pay CC', balance: 0.00 },
      { id: 6, name: 'Prime CC', balance: -32.23 },
    ]
  },
  {
    title: 'TRACKING',
    total: 7837.16,
    accounts: [
      { id: 7, name: 'Fidelity Roth IRA', balance: 7029.16 },
      { id: 8, name: 'Fidelity Taxable', balance: 808.00 },
      { id: 9, name: 'Vanguard 401(k)', balance: 42580.33 },
      { id: 10, name: 'HSA Investment', balance: 3250.75 },
      { id: 11, name: 'Robinhood Portfolio', balance: 1875.22 },
      { id: 12, name: 'Crypto Wallet', balance: 2340.18 },
      { id: 13, name: 'Real Estate Investment', balance: 85000.00 },
      { id: 14, name: 'Treasury Bonds', balance: 10000.00 },
      { id: 15, name: 'College 529 Plan', balance: 15750.45 },
      { id: 16, name: 'Pension Fund', balance: 28500.00 },
    ]
  },
  {
    title: 'CLOSED',
    total: 0,
    accounts: []
  }
])

const expandedSections = ref<Record<SectionTitle, boolean>>({
  'CASH': true,
  'CREDIT': true,
  'TRACKING': true,
  'CLOSED': true
})

const toggleSection = (sectionTitle: SectionTitle) => {
  expandedSections.value[sectionTitle] = !expandedSections.value[sectionTitle]
}

const isSettingsExpanded = ref(false)

const toggleSettings = () => {
  isSettingsExpanded.value = !isSettingsExpanded.value
}
</script>
