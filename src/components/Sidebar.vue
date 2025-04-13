<template>
  <aside class="w-72 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
    <!-- Header with Theme Toggle -->
    <div class="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
      <ThemeToggle class="text-gray-600 dark:text-gray-300" />
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Budget Friendly Budget</h1>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
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
                account.working_balance < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
              ]">{{ formatCurrency(account.working_balance) }}</span>
            </router-link>
          </div>
        </template>
      </div>

      <!-- Add Account Button -->
      <div class="p-4">
        <button 
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="isCreateAccountModalOpen = true"
        >
          <PlusIcon class="w-5 h-5 mr-2" />
          Add Account
        </button>
      </div>
    </nav>

    <!-- Settings Section -->
    <div class="border-t border-gray-200 dark:border-gray-800 relative">
      <div v-if="isSettingsExpanded" class="absolute bottom-full right-0 w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg shadow-lg">
        <button @click="router.push('/dashboard')" 
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 mb-2"
        >
          View Budgets
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
        <SettingsIcon class="w-5 h-5" />
      </button>
    </div>
  </aside>

  <CreateAccountModal 
    :is-open="isCreateAccountModalOpen"
    @close="isCreateAccountModalOpen = false"
    :budgetId="props.budgetId"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ThemeToggle from './common/ThemeToggle.vue'
import { 
  BarChart2Icon,
  PieChartIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SettingsIcon,
  LogOutIcon
} from 'lucide-vue-next'
import { authService } from '../services/common/authService'
import { formatCurrency } from '@/utils/currencyUtil'
import router from '@/router'
import CreateAccountModal from './accounts/CreateAccountModal.vue'
import { useAccountStore } from '@/stores/accountStore'
import { AccountType } from '@/types/models/account'

const props = defineProps<{
  budgetId: string
}>()


type SectionTitle = AccountType | 'CLOSED'

const mainNavItems = [
  { name: 'Budget', to: '/budget', icon: BarChart2Icon },
  { name: 'Reports', to: '/reports', icon: PieChartIcon },
]

const accountStore = useAccountStore()

const accountSections = computed(() => [
  {
    title: AccountType.CASH,
    total: accountStore.getAccountsByType(AccountType.CASH)
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountStore.getAccountsByType(AccountType.CASH)
  },
  {
    title: AccountType.CREDIT,
    total: accountStore.getAccountsByType(AccountType.CREDIT)
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountStore.getAccountsByType(AccountType.CREDIT)
  },
  {
    title: AccountType.TRACKING,
    total: accountStore.getAccountsByType(AccountType.TRACKING)
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountStore.getAccountsByType(AccountType.TRACKING)
  },
  {
    title: AccountType.LOAN,
    total: accountStore.getAccountsByType(AccountType.LOAN)
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountStore.getAccountsByType(AccountType.LOAN)
  }
])

const expandedSections = ref<Record<SectionTitle, boolean>>({
  [AccountType.CASH]: true,
  [AccountType.CREDIT]: true,
  [AccountType.TRACKING]: true,
  [AccountType.LOAN]: true,
  'CLOSED': false
})

const toggleSection = (sectionTitle: SectionTitle) => {
  expandedSections.value[sectionTitle] = !expandedSections.value[sectionTitle]
}

const isSettingsExpanded = ref(false)
const isCreateAccountModalOpen = ref(false)

const toggleSettings = () => {
  isSettingsExpanded.value = !isSettingsExpanded.value
}
</script>
