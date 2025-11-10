<template>
  <!-- Full Screen Modal Flow -->
  <Teleport to="body">
    <div
      v-if="showFlow"
      class="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <!-- Step 1: Select Account -->
      <div v-if="currentStep === 'account'" class="h-full flex flex-col">
        <div class="sticky top-0 bg-background border-b border-border px-4 py-3" style="padding-top: max(3rem, env(safe-area-inset-top));">
          <h2 class="text-lg font-semibold">Select Account</h2>
        </div>
        
        <div class="flex-1 overflow-auto p-4 space-y-2" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">
          <!-- Cash Accounts -->
          <div v-if="cashAccounts.length > 0" class="space-y-2">
            <h3 class="text-sm font-medium text-muted-foreground px-2">Cash Accounts</h3>
            <button
              v-for="account in cashAccounts"
              :key="account.id"
              @click="selectAccount(account)"
              class="w-full flex items-center justify-between px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors"
            >
              <span class="font-medium">{{ account.name }}</span>
              <span class="text-sm text-muted-foreground">{{ formatCurrency(account.working_balance) }}</span>
            </button>
          </div>

          <!-- Credit Accounts -->
          <div v-if="creditAccounts.length > 0" class="space-y-2 mt-6">
            <h3 class="text-sm font-medium text-muted-foreground px-2">Credit Cards</h3>
            <button
              v-for="account in creditAccounts"
              :key="account.id"
              @click="selectAccount(account)"
              class="w-full flex items-center justify-between px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors"
            >
              <span class="font-medium">{{ account.name }}</span>
              <span
                class="text-sm font-semibold"
                :class="account.working_balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'"
              >
                {{ formatCurrency(account.working_balance) }}
              </span>
            </button>
          </div>

          <!-- Tracking Accounts -->
          <div v-if="trackingAccounts.length > 0" class="space-y-2 mt-6">
            <h3 class="text-sm font-medium text-muted-foreground px-2">Tracking Accounts</h3>
            <button
              v-for="account in trackingAccounts"
              :key="account.id"
              @click="selectAccount(account)"
              class="w-full flex items-center justify-between px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors"
            >
              <span class="font-medium">{{ account.name }}</span>
              <span class="text-sm text-muted-foreground">{{ formatCurrency(account.working_balance) }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: Select Action -->
      <div v-else-if="currentStep === 'action'" class="h-full flex flex-col">
        <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
          <button @click="currentStep = 'account'" class="p-2">
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          <h2 class="text-lg font-semibold">{{ selectedAccount?.name }}</h2>
          <button @click="closeFlow" class="p-2">
            <XIcon class="h-5 w-5" />
          </button>
        </div>

        <div class="flex-1 overflow-auto p-4 space-y-6" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">
          <!-- Balance Display (for non-tracking accounts) -->
          <div v-if="!isTrackingAccount && selectedAccount" class="bg-card rounded-lg border border-border p-4">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-xs text-muted-foreground mb-1">Cleared</div>
                <div class="text-sm font-semibold tabular-nums" :class="selectedAccount.cleared_balance < 0 ? 'text-destructive' : 'text-foreground'">
                  {{ formatCurrency(selectedAccount.cleared_balance) }}
                </div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground mb-1">Uncleared</div>
                <div class="text-sm font-semibold tabular-nums" :class="selectedAccount.uncleared_balance < 0 ? 'text-destructive' : 'text-foreground'">
                  {{ formatCurrency(selectedAccount.uncleared_balance) }}
                </div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground mb-1">Working</div>
                <div class="text-sm font-semibold tabular-nums" :class="selectedAccount.working_balance < 0 ? 'text-destructive' : 'text-foreground'">
                  {{ formatCurrency(selectedAccount.working_balance) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Section -->
          <div class="space-y-3">
            <!-- Update Balance (tracking accounts only) -->
            <button
              v-if="isTrackingAccount"
              @click="selectAction('updateBalance')"
              class="w-full flex items-center gap-4 px-4 py-4 bg-card rounded-md border border-border hover:bg-accent transition-colors"
            >
              <div class="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <DollarSignIcon class="h-5 w-5 text-blue-600" />
              </div>
              <div class="flex-1 text-left">
                <div class="font-medium">Update Balance</div>
                <div class="text-sm text-muted-foreground">Set current account balance</div>
              </div>
            </button>

            <!-- Add Transaction (for cash) or Add Transaction (for credit) -->
            <button
              v-if="!isTrackingAccount"
              @click="selectAction('transaction')"
              class="w-full flex items-center gap-4 px-4 py-4 bg-card rounded-md border border-border hover:bg-accent transition-colors"
            >
              <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <PlusIcon class="h-5 w-5 text-primary" />
              </div>
              <div class="flex-1 text-left">
                <div class="font-medium">Add Transaction</div>
                <div class="text-sm text-muted-foreground">
                  {{ isCashAccount ? 'Record income or expense' : 'Record a charge' }}
                </div>
              </div>
            </button>

          <!-- Transfer (not available for credit cards or tracking) -->
          <button
            v-if="!isCreditAccount && !isTrackingAccount"
            @click="selectAction('transfer')"
            class="w-full flex items-center gap-4 px-4 py-4 bg-card rounded-md border border-border hover:bg-accent transition-colors"
          >
            <div class="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <ArrowRightLeftIcon class="h-5 w-5 text-blue-600" />
            </div>
            <div class="flex-1 text-left">
              <div class="font-medium">Transfer</div>
              <div class="text-sm text-muted-foreground">Move money between accounts</div>
            </div>
          </button>

          <!-- Make Payment (credit cards only) -->
            <button
              v-if="isCreditAccount && !isTrackingAccount"
              @click="selectAction('payment')"
              class="w-full flex items-center gap-4 px-4 py-4 bg-card rounded-md border border-border hover:bg-accent transition-colors"
            >
              <div class="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <CreditCardIcon class="h-5 w-5 text-purple-600" />
              </div>
              <div class="flex-1 text-left">
                <div class="font-medium">Make Payment</div>
                <div class="text-sm text-muted-foreground">Pay off credit card balance</div>
              </div>
            </button>

            <!-- Reconcile (for cash and credit accounts) -->
            <button
              v-if="!isTrackingAccount"
              @click="selectAction('reconcile')"
              class="w-full px-4 py-2 bg-card rounded-md border border-border hover:bg-accent transition-colors text-sm font-medium"
            >
              Reconcile
            </button>
          </div>

          <!-- Recent Transactions Section (not for tracking accounts) -->
          <MobileRecentTransactions
            v-if="selectedAccount && !isTrackingAccount"
            ref="recentTransactionsRef"
            :account-id="selectedAccount.id"
            @edit="handleEditTransaction"
            @delete="handleDeleteTransaction"
          />
        </div>
      </div>

      <!-- Step 3: Transaction Form -->
      <MobileTransactionForm
        v-else-if="currentStep === 'form' && selectedAction === 'transaction'"
        :account-id="selectedAccount!.id"
        :default-transaction-type="transactionType"
        @close="currentStep = 'action'"
        @save="handleSaveTransaction"
      />

      <!-- Step 3: Transfer Form -->
      <MobileTransferForm
        v-else-if="currentStep === 'form' && selectedAction === 'transfer'"
        :account-id="selectedAccount!.id"
        @close="currentStep = 'action'"
        @save="handleSaveTransfer"
      />

      <!-- Step 3: Payment Form -->
      <MobilePaymentForm
        v-else-if="currentStep === 'form' && selectedAction === 'payment'"
        :account-id="selectedAccount!.id"
        :account-name="selectedAccount!.name"
        @close="currentStep = 'action'"
        @save="handleSavePayment"
      />

      <!-- Step 3: Update Balance Form -->
      <MobileUpdateBalanceForm
        v-else-if="currentStep === 'form' && selectedAction === 'updateBalance'"
        :account-id="selectedAccount!.id"
        :account-name="selectedAccount!.name"
        :current-balance="selectedAccount!.account_balance"
        @close="currentStep = 'account'"
        @save="handleUpdateBalance"
      />

      <!-- Edit Transaction Form -->
      <MobileEditTransactionForm
        v-else-if="currentStep === 'edit' && editingTransaction"
        :transaction="editingTransaction"
        @close="currentStep = 'action'"
        @save="handleUpdateTransaction"
        @delete="handleDeleteTransaction"
      />

      <!-- Bottom Navigation -->
      <MobileBottomNav
        active-tab="accounts"
        @navigate="handleNavigate"
      />
    </div>

    <!-- Reconcile Confirmation Modal -->
    <div
      v-if="showReconcileConfirm"
      class="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
      @click="showReconcileConfirm = false"
    >
      <div
        class="bg-background rounded-lg shadow-lg p-6 max-w-sm w-full"
        @click.stop
      >
        <h3 class="text-lg font-semibold mb-4">Reconcile Account</h3>
        <p class="text-sm text-muted-foreground mb-2">
          Cleared balance: <span class="font-semibold text-foreground">{{ formatCurrency(selectedAccount?.cleared_balance || 0) }}</span>
        </p>
        <p class="text-sm text-muted-foreground mb-6">
          Does this amount look correct?
        </p>
        <div class="flex gap-3">
          <button
            @click="showReconcileConfirm = false"
            class="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            No
          </button>
          <button
            @click="handleReconcile"
            :disabled="isReconciling"
            class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {{ isReconciling ? 'Reconciling...' : 'Yes' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { PlusIcon, XIcon, ChevronLeftIcon, DollarSignIcon, ArrowRightLeftIcon, CreditCardIcon } from 'lucide-vue-next'
import { useAccountStore } from '@/stores/account.store'
import { useBudgetStore } from '@/stores/budget.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import { useReconcileAccount } from '@/composables/accounts/account-write/useReconcileAccount'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AccountResponse } from '@/types/DTO/account.dto'
import type { CreateTransactionDto, TransactionResponse, UpdateTransactionDto } from '@/types/DTO/transaction.dto'
import MobileTransactionForm from './MobileTransactionForm.vue'
import MobileTransferForm from './MobileTransferForm.vue'
import MobilePaymentForm from './MobilePaymentForm.vue'
import MobileRecentTransactions from './MobileRecentTransactions.vue'
import MobileEditTransactionForm from './MobileEditTransactionForm.vue'
import MobileUpdateBalanceForm from './MobileUpdateBalanceForm.vue'
import MobileBottomNav from './MobileBottomNav.vue'

const emit = defineEmits<{
  saveTransaction: [data: CreateTransactionDto]
  saveTransfer: [data: CreateTransactionDto]
  savePayment: [creditCardAccountId: string, amount: number, fromAccountId: string, memo?: string]
  updateTransaction: [id: string, data: UpdateTransactionDto]
  deleteTransaction: [transactionId: string]
  updateBalance: [accountId: string, newBalance: number]
}>()

const router = useRouter()
const accountStore = useAccountStore()
const budgetStore = useBudgetStore()
const { deleteTransaction, updateTransaction } = useTransactionOperations()
const { reconcileAccount, isLoading: isReconciling } = useReconcileAccount()
const $toast = useToast()

const showFlow = ref(false)
const currentStep = ref<'account' | 'action' | 'form' | 'edit'>('account')
const selectedAccountId = ref<string | null>(null)
const selectedAction = ref<'transaction' | 'transfer' | 'payment' | 'reconcile' | null>(null)
const transactionType = ref<'inflow' | 'outflow'>('outflow')
const editingTransaction = ref<TransactionResponse | null>(null)
const showReconcileConfirm = ref(false)
const recentTransactionsRef = ref<InstanceType<typeof MobileRecentTransactions> | null>(null)

const cashAccounts = computed(() => accountStore.getAccountsByType('CASH'))
const creditAccounts = computed(() => accountStore.getAccountsByType('CREDIT'))
const trackingAccounts = computed(() => accountStore.getAccountsByType('TRACKING'))

// Make selectedAccount reactive to account store changes
const selectedAccount = computed(() => {
  if (!selectedAccountId.value) return null
  return accountStore.accounts.find(acc => acc.id === selectedAccountId.value) || null
})

const isCashAccount = computed(() => selectedAccount.value?.account_type === 'CASH')
const isCreditAccount = computed(() => selectedAccount.value?.account_type === 'CREDIT')
const isTrackingAccount = computed(() => selectedAccount.value?.account_type === 'TRACKING')

const startFlow = () => {
  showFlow.value = true
  currentStep.value = 'account'
  selectedAccountId.value = null
  selectedAction.value = null
}

// Expose openFlow for parent components
const openFlow = () => {
  startFlow()
}

const closeFlow = () => {
  showFlow.value = false
  currentStep.value = 'account'
  selectedAccountId.value = null
  selectedAction.value = null
  editingTransaction.value = null
}

const selectAccount = (account: AccountResponse) => {
  selectedAccountId.value = account.id
  currentStep.value = 'action'
}

const selectAction = (action: 'transaction' | 'transfer' | 'payment' | 'updateBalance' | 'reconcile') => {
  selectedAction.value = action

  // Handle reconcile action
  if (action === 'reconcile') {
    showReconcileConfirm.value = true
    return
  }

  // Set transaction type based on action
  if (action === 'transaction') {
    transactionType.value = isCashAccount.value ? 'outflow' : 'outflow' // Default to outflow
  }

  currentStep.value = 'form'
}

const handleSaveTransaction = (data: CreateTransactionDto) => {
  emit('saveTransaction', data)
  currentStep.value = 'action'
}

const handleSaveTransfer = (data: CreateTransactionDto) => {
  emit('saveTransfer', data)
  currentStep.value = 'action'
}

const handleSavePayment = (amount: number, fromAccountId: string, memo?: string) => {
  if (!selectedAccount.value) return
  emit('savePayment', selectedAccount.value.id, amount, fromAccountId, memo)
  currentStep.value = 'action'
}

// Expose method to reload transactions from parent
const reloadTransactions = async () => {
  await recentTransactionsRef.value?.loadTransactions()
}

defineExpose({
  openFlow,
  reloadTransactions
})

const handleEditTransaction = (transaction: TransactionResponse) => {
  editingTransaction.value = transaction
  currentStep.value = 'edit'
}

const handleUpdateTransaction = async (id: string, data: UpdateTransactionDto) => {
  try {
    await updateTransaction(id, data)
    currentStep.value = 'action'
    // Optimistic update provides instant feedback, no need to reload
  } catch (error) {
    console.error('Failed to update transaction:', error)
  }
}

const handleDeleteTransaction = async (transactionId: string) => {
  try {
    await deleteTransaction(transactionId)
    currentStep.value = 'action'
    // Reload transactions to show the list without the deleted one
    await recentTransactionsRef.value?.loadTransactions()
  } catch (error) {
    console.error('Failed to delete transaction:', error)
  }
}

const handleUpdateBalance = (accountId: string, newBalance: number) => {
  emit('updateBalance', accountId, newBalance)
  currentStep.value = 'account'
}

const handleReconcile = async () => {
  if (!selectedAccount.value) return

  try {
    const clearedBalance = selectedAccount.value.cleared_balance
    await reconcileAccount(selectedAccount.value.id, clearedBalance)
    showReconcileConfirm.value = false
    // Go back to account page instead of closing
    currentStep.value = 'action'
  } catch (error) {
    console.error('Failed to reconcile account:', error)
    $toast.error('Failed to reconcile account')
  }
}

const handleNavigate = async (tab: 'budget' | 'accounts' | 'goals' | 'retirement' | 'networth') => {
  if (tab === 'budget') {
    const budgetId = budgetStore.currentBudget?.id
    if (budgetId) {
      // Navigate first, then close modal after navigation completes
      await router.push(`/budget/${budgetId}`)
      closeFlow()
    }
  } else if (tab === 'goals') {
    await router.push('/shared-goals')
    closeFlow()
  } else if (tab === 'retirement') {
    await router.push('/retirement-plan')
    closeFlow()
  } else if (tab === 'networth') {
    // Navigate first, then close modal after navigation completes
    await router.push('/net-worth')
    closeFlow()
  }
  // Accounts tab is already the current view, no action needed
}
</script>

