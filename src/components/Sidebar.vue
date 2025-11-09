<template>
  <aside :class="[
    'h-screen bg-background dark:bg-background border-r border-border dark:border-border flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
    isCollapsed ? 'w-16' : 'w-80'
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
            <draggable
              v-model="accountLists[section.title as AccountType]"
              item-key="id"
              :animation="150"
              handle=".account-drag-handle"
              ghost-class="ghost-item"
              chosen-class="sortable-chosen"
              drag-class="sortable-drag"
              @change="onChange($event, section.title as AccountType)"
              class="account-list"
            >
              <template #item="{ element: account }">
                <div class="flex items-center justify-between text-sm rounded-lg ml-2 min-w-0 group hover:bg-muted/50 transition-colors account-item">
                  <GripVertical
                    class="w-4 h-4 ml-3 mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab account-drag-handle flex-shrink-0"
                  />
                  <router-link
                    :to="`/budget/${props.budgetId}/account/${account.id}`"
                    class="flex items-center justify-between min-w-0 flex-1 text-decoration-none py-2 pr-3"
                  >
                    <span class="text-foreground truncate flex-shrink min-w-0 mr-4">{{ account.name }}</span>
                    <span :class="[
                      'flex-shrink-0 tabular-nums',
                      account.working_balance < 0 ? 'text-destructive' : 'text-foreground'
                    ]">{{ formatCurrency(account.working_balance) }}</span>
                  </router-link>
                </div>
              </template>
            </draggable>
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

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ThemeToggle from './common/ThemeToggle.vue'
import {
  BarChart2Icon,
  TrendingUpIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SettingsIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  TargetIcon,
  GripVertical,
  PiggyBankIcon
} from 'lucide-vue-next'
import { authService } from '../services/common/auth.service'
import { formatCurrency } from '@/utils/currencyUtil'
import router from '@/router'
import CreateAccountModal from './accounts/CreateAccountModal.vue'
import { useAccountStore } from '@/stores/account.store'
import { AccountType, type AccountResponse } from '@/types/DTO/account.dto'
import { useBudgetStore } from '@/stores/budget.store'
import { useToast } from 'vue-toast-notification'
import { saveExpandedAccounts, loadExpandedAccounts } from '@/utils/expandedAccountsStorage'
import { useReopenAccount } from '@/composables/accounts/account-write/useReopenAccount'
import draggable from 'vuedraggable'
import { useAccountDragAndDrop } from '@/composables/accounts/account-ui/useAccountDragAndDrop'

const budgetStore = useBudgetStore()
const { reopenAccount } = useReopenAccount()

const props = defineProps<{
  budgetId: string
}>()

type SectionTitle = AccountType | 'CLOSED'

const mainNavItems = computed(() => {
  const items = []

  // Only add Budget link if we have a valid budgetId
  if (props.budgetId) {
    items.push({ name: 'Budget', to: `/budget/${props.budgetId}`, icon: BarChart2Icon })
  }

  items.push(
    { name: 'Net Worth', to: '/net-worth', icon: TrendingUpIcon },
    { name: 'Shared Goals', to: '/shared-goals', icon: TargetIcon },
    { name: 'Retirement Plan', to: '/retirement-plan', icon: PiggyBankIcon }
  )

  return items
})

const accountStore = useAccountStore()

// Create reactive account lists for drag and drop
const accountLists = ref({
  [AccountType.CASH]: [] as AccountResponse[],
  [AccountType.CREDIT]: [] as AccountResponse[],
  [AccountType.TRACKING]: [] as AccountResponse[]
})

// Helper function to get accounts for a type
const getAccountsForType = (type: AccountType) => {
  return accountStore.getAccountsByType(type)
}

// Initialize account lists
const initializeAccountLists = () => {
  accountLists.value[AccountType.CASH] = [...getAccountsForType(AccountType.CASH)]
  accountLists.value[AccountType.CREDIT] = [...getAccountsForType(AccountType.CREDIT)]
  accountLists.value[AccountType.TRACKING] = [...getAccountsForType(AccountType.TRACKING)]
}

// Set up drag and drop
const { onChange } = useAccountDragAndDrop(accountLists.value, getAccountsForType)

const accountSections = computed(() => [
  {
    title: AccountType.CASH,
    total: accountLists.value[AccountType.CASH]
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountLists.value[AccountType.CASH]
  },
  {
    title: AccountType.CREDIT,
    total: accountLists.value[AccountType.CREDIT]
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountLists.value[AccountType.CREDIT]
  },
  {
    title: AccountType.TRACKING,
    total: accountLists.value[AccountType.TRACKING]
      .reduce((sum, account) => sum + account.working_balance, 0),
    accounts: accountLists.value[AccountType.TRACKING]
  }
])

const expandedSections = ref<Record<SectionTitle, boolean>>({
  [AccountType.CASH]: false,
  [AccountType.TRACKING]: false,
  [AccountType.CREDIT]: false,
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
    await reopenAccount(accountId)
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

// Watch for changes in accounts to update the draggable lists
watch(() => accountStore.accounts, () => {
  initializeAccountLists()
}, { deep: true })

// Watch for changes in the current budget ID to load the appropriate expanded sections
watch(() => budgetStore.currentBudget?.id, (newBudgetId) => {
  if (newBudgetId) {
    loadExpandedSectionsFromStorage()
    initializeAccountLists()
  }
})

// Load expanded sections on component mount
onMounted(() => {
  loadExpandedSectionsFromStorage()
  initializeAccountLists()
})
</script>

<style scoped>
.account-item.sortable-chosen {
  background-color: var(--muted);
  cursor: grabbing;
  border: 1px solid var(--primary);
}

.ghost-item {
  opacity: 0.7;
  border: 1px dashed var(--primary);
}

.account-drag-handle {
  cursor: grab;
}

.account-drag-handle:active {
  cursor: grabbing;
}
</style>
