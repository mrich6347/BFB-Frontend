<template>
  <aside :class="[
    'h-screen bg-background dark:bg-background border-r border-border dark:border-border flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
    isCollapsed ? 'w-16' : 'w-72'
  ]">
    <!-- Header with Theme Toggle -->
    <div class="p-4 flex items-center justify-between border-b border-border dark:border-border">
      <ThemeToggle size="sm" :class="['text-muted-foreground', isCollapsed ? 'mx-auto' : '']" />
      <h1
        v-if="!isCollapsed"
        class="ml-2.5 text-lg font-semibold text-foreground transition-opacity duration-300 ease-in-out text-ellipsis overflow-hidden w-full text-nowrap"
        :class="{ 'opacity-0': isCollapsed, 'opacity-100': !isCollapsed }"
      >
       {{ budgetStore?.currentBudget?.name }}
      </h1>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto">
      <!-- Main Navigation -->
      <div class="p-3">
        <router-link
          v-for="item in mainNavItems"
          :key="item.name"
          :to="item.to"
          :class="[
            'flex items-center rounded-lg text-foreground  mb-1 transition-all duration-300 ease-in-out',
            isCollapsed ? 'justify-center p-2' : 'px-3 py-2'
          ]"
          :title="isCollapsed ? item.name : ''"
        >
          <component :is="item.icon" class="w-5 h-5 transition-all duration-300" :class="{ 'mr-3': !isCollapsed }" />
          <span
            v-show="!isCollapsed"
            class="transition-opacity duration-300 ease-in-out whitespace-nowrap"
            :class="{ 'opacity-0': isCollapsed, 'opacity-100': !isCollapsed }"
          >
            {{ item.name }}
          </span>
        </router-link>
      </div>

      <!-- Account Sections -->
      <div
        v-show="!isCollapsed"
        class="px-3 transition-opacity duration-300 ease-in-out"
        :class="{ 'opacity-0': isCollapsed, 'opacity-100': !isCollapsed }"
      >
        <template v-for="section in accountSections" :key="section.title">
          <button
            @click="toggleSection(section.title as SectionTitle)"
            class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground cursor-pointer rounded-lg"
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
              :to="`/budget/${props.budgetId}/account/${account.id}`"
              class="flex items-center justify-between px-3 py-2 text-sm rounded-lg ml-2 min-w-0"
            >
              <span class="text-foreground truncate flex-shrink min-w-0 mr-4">{{ account.name }}</span>
              <span :class="[
                'flex-shrink-0 tabular-nums',
                account.working_balance < 0 ? 'text-destructive' : 'text-foreground'
              ]">{{ formatCurrency(account.working_balance) }}</span>
            </router-link>
          </div>
        </template>

        <!-- Closed Accounts Section -->
        <div v-if="accountStore.closedAccounts.length > 0">
          <button
            @click="toggleSection('CLOSED' as SectionTitle)"
            class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground cursor-pointer rounded-lg"
          >
            <div class="flex items-center">
              <ChevronDownIcon
                v-if="expandedSections['CLOSED' as SectionTitle]"
                class="w-4 h-4 mr-1 transition-transform"
              />
              <ChevronRightIcon
                v-else
                class="w-4 h-4 mr-1 transition-transform"
              />
              <span>Closed Accounts</span>
            </div>
            <span class="text-xs text-muted-foreground">({{ accountStore.closedAccounts.length }})</span>
          </button>
          <div v-if="expandedSections['CLOSED' as SectionTitle]" class="mb-4">
            <div
              v-for="account in accountStore.closedAccounts"
              :key="account.id"
              class="flex items-center justify-between px-3 py-2 text-sm rounded-lg ml-2 min-w-0"
            >
              <span class="text-muted-foreground truncate flex-shrink min-w-0 mr-4">{{ account.name }}</span>
              <button
                @click="handleReopenAccount(account.id)"
                class="text-xs text-primary hover:text-primary/80 flex-shrink-0"
                :disabled="isReopeningAccount"
              >
                {{ isReopeningAccount ? 'Reopening...' : 'Reopen' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Account Button -->
      <div
        v-show="!isCollapsed"
        class="p-4 transition-opacity duration-300 ease-in-out"
        :class="{ 'opacity-0': isCollapsed, 'opacity-100': !isCollapsed }"
      >
        <button
          class="w-full cursor-pointer flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          @click="isCreateAccountModalOpen = true"
        >
          <PlusIcon class="w-5 h-5 mr-2" />
          Add Account
        </button>
      </div>
    </nav>

    <!-- Settings and Collapse Section -->
    <div class="border-t border-border dark:border-border relative">
      <div v-if="isSettingsExpanded" class="absolute bottom-full right-0 w-full p-4 bg-secondary dark:bg-secondary border border-border dark:border-border rounded-t-lg shadow-lg">
        <button @click="router.push('/profile-settings')"
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-background dark:bg-background rounded-lg border border-border dark:border-border mb-2"
        >
          Profile Settings
        </button>
        <button @click="router.push('/dashboard')"
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-background dark:bg-background rounded-lg border border-border dark:border-border mb-2"
        >
          View Budgets
        </button>
        <button @click="showNukeDatabaseConfirm = true"
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-destructive bg-background dark:bg-background rounded-lg border border-border dark:border-border mb-2"
        >
          <DatabaseIcon class="w-5 h-5 mr-2" />
          Nuke Database
        </button>
        <button @click="showPopulateDatabaseConfirm = true"
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-background dark:bg-background rounded-lg border border-border dark:border-border mb-2"
        >
          <DatabaseIcon class="w-5 h-5 mr-2" />
          Populate Database
        </button>
        <button @click="authService.logout()"
            class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-background dark:bg-background rounded-lg border border-border dark:border-border"
        >
          <LogOutIcon class="w-5 h-5 mr-2" />
          Log Out
        </button>
      </div>
      <div class="flex items-center justify-between p-4">
        <button
          v-show="!isCollapsed"
          @click="toggleSettings"
          class="text-muted-foreground  p-2 rounded-lg transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-0': isCollapsed, 'opacity-100': !isCollapsed }"
          :title="'Settings'"
        >
          <SettingsIcon class="w-5 h-5 cursor-pointer" />
        </button>
        <button
          @click="toggleCollapse"
          class="text-muted-foreground  p-2 rounded-lg transition-transform duration-300 ease-in-out"
          :class="{ 'ml-auto': !isCollapsed }"
          :title="isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        >
          <PanelLeftCloseIcon v-if="!isCollapsed" class="w-5 h-5 cursor-pointer" />
          <PanelLeftOpenIcon v-else class="w-5 h-5 cursor-pointer" />
        </button>
      </div>
    </div>
  </aside>

  <CreateAccountModal
    :is-open="isCreateAccountModalOpen"
    @close="isCreateAccountModalOpen = false"
    :budgetId="props.budgetId"
  />

  <!-- Nuke Database Confirmation Dialog -->
  <Dialog :open="showNukeDatabaseConfirm" @update:open="(value) => !value && (showNukeDatabaseConfirm = false)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="text-destructive">Nuke Database</DialogTitle>
        <DialogDescription>
          This will permanently delete all your data including budgets, accounts, categories, and transactions. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          Are you absolutely sure you want to proceed? This is intended for testing purposes only.
        </p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showNukeDatabaseConfirm = false">
            Cancel
          </Button>
          <Button variant="destructive" :disabled="isNuking" @click="nukeDatabase">
            <Loader2Icon v-if="isNuking" class="mr-2 h-4 w-4 animate-spin" />
            {{ isNuking ? 'Nuking...' : 'Yes, Nuke Everything' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Populate Database Confirmation Dialog -->
  <Dialog :open="showPopulateDatabaseConfirm" @update:open="(value) => !value && (showPopulateDatabaseConfirm = false)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="text-blue-600">Populate Database</DialogTitle>
        <DialogDescription>
          This will first wipe all existing data, then create a comprehensive sample budget with months of realistic activity including transactions, categories, and account balances.
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          This will give you a fully populated budget to explore the app's features. All existing data will be replaced.
        </p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showPopulateDatabaseConfirm = false">
            Cancel
          </Button>
          <Button variant="default" :disabled="isPopulating" @click="populateDatabase" class="bg-blue-600 hover:bg-blue-700">
            <Loader2Icon v-if="isPopulating" class="mr-2 h-4 w-4 animate-spin" />
            {{ isPopulating ? 'Populating...' : 'Yes, Populate Database' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ThemeToggle from './common/ThemeToggle.vue'
import {
  BarChart2Icon,
  PieChartIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SettingsIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  DatabaseIcon,
  Loader2Icon,
  TargetIcon
} from 'lucide-vue-next'
import { authService } from '../services/common/auth.service'
import { formatCurrency } from '@/utils/currencyUtil'
import router from '@/router'
import CreateAccountModal from './accounts/CreateAccountModal.vue'
import { useAccountStore } from '@/stores/account.store'
import { AccountType } from '@/types/DTO/account.dto'
import { useBudgetStore } from '@/stores/budget.store'
import { DatabaseService } from '@/services/database.service'
import { useToast } from 'vue-toast-notification'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import { saveExpandedAccounts, loadExpandedAccounts } from '@/utils/expandedAccountsStorage'

const budgetStore = useBudgetStore()

const props = defineProps<{
  budgetId: string
}>()

type SectionTitle = AccountType | 'CLOSED'

const mainNavItems = computed(() => [
  { name: 'Budget', to: `/budget/${props.budgetId}`, icon: BarChart2Icon },
  { name: 'Reports', to: '/reports', icon: PieChartIcon },
  { name: 'Shared Goals', to: '/shared-goals', icon: TargetIcon },
])

const accountStore = useAccountStore()

const accountSections = computed(() => [
  {
    title: AccountType.CASH,
    total: accountStore.getAccountsByType(AccountType.CASH)
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountStore.getAccountsByType(AccountType.CASH)
  },
  {
    title: AccountType.TRACKING,
    total: accountStore.getAccountsByType(AccountType.TRACKING)
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountStore.getAccountsByType(AccountType.TRACKING)
  }
])

const expandedSections = ref<Record<SectionTitle, boolean>>({
  [AccountType.CASH]: false,
  [AccountType.TRACKING]: false,
  'CLOSED': false
})

const toggleSection = (sectionTitle: SectionTitle) => {
  expandedSections.value[sectionTitle] = !expandedSections.value[sectionTitle]

  // Save the updated expanded sections to local storage
  const budgetId = budgetStore.currentBudget?.id
  if (budgetId) {
    saveExpandedAccounts(budgetId, expandedSections.value)
  }
}

const isSettingsExpanded = ref(false)
const isCreateAccountModalOpen = ref(false)
const isCollapsed = ref(false)
const showNukeDatabaseConfirm = ref(false)
const isNuking = ref(false)
const showPopulateDatabaseConfirm = ref(false)
const isPopulating = ref(false)
const isReopeningAccount = ref(false)
const toast = useToast()

const toggleSettings = () => {
  isSettingsExpanded.value = !isSettingsExpanded.value
}

const openCreateAccountModal = () => {
  isCreateAccountModalOpen.value = true
}

const closeCreateAccountModal = () => {
  isCreateAccountModalOpen.value = false
}

const handleReopenAccount = async (accountId: string) => {
  try {
    isReopeningAccount.value = true
    await accountStore.reopenAccount(accountId)
    toast.success('Account reopened successfully')
  } catch (error) {
    console.error('Failed to reopen account:', error)
    toast.error('Failed to reopen account')
  } finally {
    isReopeningAccount.value = false
  }
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Load expanded sections from local storage when budget changes
const loadExpandedSectionsFromStorage = () => {
  const budgetId = budgetStore.currentBudget?.id
  if (budgetId) {
    const savedExpandedSections = loadExpandedAccounts(budgetId)
    if (savedExpandedSections !== null) {
      // Update the expandedSections with saved state
      Object.assign(expandedSections.value, savedExpandedSections)
    }
    // If no saved state, keep the default values (all false)
  }
}

// Watch for changes in the current budget ID to load the appropriate expanded sections
watch(() => budgetStore.currentBudget?.id, (newBudgetId) => {
  if (newBudgetId) {
    loadExpandedSectionsFromStorage()
  }
})

// Load expanded sections on component mount
onMounted(() => {
  loadExpandedSectionsFromStorage()
})

const nukeDatabase = async () => {
  try {
    isNuking.value = true
    isSettingsExpanded.value = false

    const result = await DatabaseService.nukeDatabase()

    if (result.success) {
      toast.success('Database has been successfully wiped')
      // Redirect to dashboard page
      router.push('/dashboard')
    } else {
      toast.error('Failed to wipe database: ' + result.message)
    }
  } catch (error) {
    console.error('Error nuking database:', error)
    toast.error('An error occurred while wiping the database')
  } finally {
    isNuking.value = false
    showNukeDatabaseConfirm.value = false
  }
}

const populateDatabase = async () => {
  try {
    isPopulating.value = true
    isSettingsExpanded.value = false

    const result = await DatabaseService.populateDatabase()

    if (result.success) {
      toast.success('Database has been successfully populated with sample data')
      // Redirect to dashboard page
      router.push('/dashboard')
    } else {
      toast.error('Failed to populate database: ' + result.message)
    }
  } catch (error) {
    console.error('Error populating database:', error)
    toast.error('An error occurred while populating the database')
  } finally {
    isPopulating.value = false
    showPopulateDatabaseConfirm.value = false
  }
}
</script>
