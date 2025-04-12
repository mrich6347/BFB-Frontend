<template>
  <aside class="w-72 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
    <!-- Header with Theme Toggle -->
    <div class="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
      <ThemeToggle class="text-gray-600 dark:text-gray-300" />
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white">BFB Finance</h1>
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
          <div class="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <span>{{ section.title }}</span>
            <span>{{ formatTotal(section.total) }}</span>
          </div>
          <div class="mb-4">
            <router-link
              v-for="account in section.accounts"
              :key="account.id"
              :to="'/account/' + account.id"
              class="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span class="text-gray-700 dark:text-gray-200">{{ account.name }}</span>
              <span :class="[
                account.balance < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
              ]">{{ formatAmount(account.balance) }}</span>
            </router-link>
          </div>
        </template>
      </div>
    </nav>

    <!-- Add Account Button -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800">
      <button 
        class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusIcon class="w-5 h-5 mr-2" />
        Add Account
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
  PlusIcon 
} from 'lucide-vue-next'

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
      { id: 4, name: 'Citi Double Cash', balance: -175.95 },
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
    ]
  },
  {
    title: 'CLOSED',
    total: 0,
    accounts: []
  }
])

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatTotal = (total: number): string => {
  return formatAmount(total)
}
</script>
