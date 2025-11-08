<template>
  <!-- Floating Action Button -->
  <button
    v-if="!showFlow"
    @click="startFlow"
    class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
  >
    <PlusIcon class="h-6 w-6" />
  </button>

  <!-- Full Screen Modal Flow -->
  <Teleport to="body">
    <div
      v-if="showFlow"
      class="fixed inset-0 z-50 bg-background"
    >
      <!-- Step 1: Select Account -->
      <div v-if="currentStep === 'account'" class="h-full flex flex-col">
        <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
          <h2 class="text-lg font-semibold">Select Account</h2>
          <button @click="closeFlow" class="p-2">
            <XIcon class="h-5 w-5" />
          </button>
        </div>
        
        <div class="flex-1 overflow-auto p-4 space-y-2">
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
              <span class="text-sm text-muted-foreground">{{ formatCurrency(account.account_balance) }}</span>
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
                :class="account.account_balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'"
              >
                {{ formatCurrency(account.account_balance) }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: Select Action -->
      <div v-else-if="currentStep === 'action'" class="h-full flex flex-col">
        <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
          <button @click="currentStep = 'account'" class="p-2">
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          <h2 class="text-lg font-semibold">{{ selectedAccount?.name }}</h2>
          <button @click="closeFlow" class="p-2">
            <XIcon class="h-5 w-5" />
          </button>
        </div>

        <div class="flex-1 overflow-auto p-4 space-y-6">
          <!-- Actions Section -->
          <div class="space-y-3">
            <!-- Add Transaction (for cash) or Add Transaction (for credit) -->
            <button
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

          <!-- Got Paid (cash accounts only) -->
          <button
            v-if="isCashAccount"
            @click="selectAction('gotPaid')"
            class="w-full flex items-center gap-4 px-4 py-4 bg-card rounded-md border border-border hover:bg-accent transition-colors"
          >
            <div class="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <DollarSignIcon class="h-5 w-5 text-emerald-600" />
            </div>
            <div class="flex-1 text-left">
              <div class="font-medium">Got Paid</div>
              <div class="text-sm text-muted-foreground">Quick income entry</div>
            </div>
          </button>

          <!-- Transfer (not available for credit cards) -->
          <button
            v-if="!isCreditAccount"
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
              v-if="isCreditAccount"
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
          </div>

          <!-- Recent Transactions Section -->
          <MobileRecentTransactions
            v-if="selectedAccount"
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
        @close="closeFlow"
        @save="handleSaveTransaction"
      />

      <!-- Step 3: Transfer Form -->
      <MobileTransferForm
        v-else-if="currentStep === 'form' && selectedAction === 'transfer'"
        :account-id="selectedAccount!.id"
        @close="closeFlow"
        @save="handleSaveTransfer"
      />

      <!-- Step 3: Payment Form -->
      <MobilePaymentForm
        v-else-if="currentStep === 'form' && selectedAction === 'payment'"
        :account-id="selectedAccount!.id"
        :account-name="selectedAccount!.name"
        @close="closeFlow"
        @save="handleSavePayment"
      />

      <!-- Edit Transaction Form -->
      <MobileEditTransactionForm
        v-else-if="currentStep === 'edit' && editingTransaction"
        :transaction="editingTransaction"
        @close="closeFlow"
        @save="handleUpdateTransaction"
        @delete="handleDeleteTransaction"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PlusIcon, XIcon, ChevronLeftIcon, DollarSignIcon, ArrowRightLeftIcon, CreditCardIcon } from 'lucide-vue-next'
import { useAccountStore } from '@/stores/account.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AccountResponse } from '@/types/DTO/account.dto'
import type { CreateTransactionDto, TransactionResponse, UpdateTransactionDto } from '@/types/DTO/transaction.dto'
import MobileTransactionForm from './MobileTransactionForm.vue'
import MobileTransferForm from './MobileTransferForm.vue'
import MobilePaymentForm from './MobilePaymentForm.vue'
import MobileRecentTransactions from './MobileRecentTransactions.vue'
import MobileEditTransactionForm from './MobileEditTransactionForm.vue'

const emit = defineEmits<{
  saveTransaction: [data: CreateTransactionDto]
  saveTransfer: [data: CreateTransactionDto]
  savePayment: [creditCardAccountId: string, amount: number, fromAccountId: string, memo?: string]
  updateTransaction: [id: string, data: UpdateTransactionDto]
  deleteTransaction: [transactionId: string]
}>()

const accountStore = useAccountStore()
const { deleteTransaction, updateTransaction } = useTransactionOperations()

const showFlow = ref(false)
const currentStep = ref<'account' | 'action' | 'form' | 'edit'>('account')
const selectedAccount = ref<AccountResponse | null>(null)
const selectedAction = ref<'transaction' | 'gotPaid' | 'transfer' | 'payment' | null>(null)
const transactionType = ref<'inflow' | 'outflow'>('outflow')
const editingTransaction = ref<TransactionResponse | null>(null)

const cashAccounts = computed(() => accountStore.getAccountsByType('CASH'))
const creditAccounts = computed(() => accountStore.getAccountsByType('CREDIT'))

const isCashAccount = computed(() => selectedAccount.value?.account_type === 'CASH')
const isCreditAccount = computed(() => selectedAccount.value?.account_type === 'CREDIT')

const startFlow = () => {
  showFlow.value = true
  currentStep.value = 'account'
  selectedAccount.value = null
  selectedAction.value = null
}

const closeFlow = () => {
  showFlow.value = false
  currentStep.value = 'account'
  selectedAccount.value = null
  selectedAction.value = null
  editingTransaction.value = null
}

const selectAccount = (account: AccountResponse) => {
  selectedAccount.value = account
  currentStep.value = 'action'
}

const selectAction = (action: 'transaction' | 'gotPaid' | 'transfer' | 'payment') => {
  selectedAction.value = action
  
  // Set transaction type based on action
  if (action === 'gotPaid') {
    transactionType.value = 'inflow'
  } else if (action === 'transaction') {
    transactionType.value = isCashAccount.value ? 'outflow' : 'outflow' // Default to outflow
  }
  
  currentStep.value = 'form'
}

const handleSaveTransaction = (data: CreateTransactionDto) => {
  emit('saveTransaction', data)
  closeFlow()
}

const handleSaveTransfer = (data: CreateTransactionDto) => {
  emit('saveTransfer', data)
  closeFlow()
}

const handleSavePayment = (amount: number, fromAccountId: string, memo?: string) => {
  if (!selectedAccount.value) return
  emit('savePayment', selectedAccount.value.id, amount, fromAccountId, memo)
  closeFlow()
}

const handleEditTransaction = (transaction: TransactionResponse) => {
  editingTransaction.value = transaction
  currentStep.value = 'edit'
}

const handleUpdateTransaction = async (id: string, data: UpdateTransactionDto) => {
  try {
    await updateTransaction(id, data)
    closeFlow()
  } catch (error) {
    console.error('Failed to update transaction:', error)
  }
}

const handleDeleteTransaction = async (transactionId: string) => {
  try {
    await deleteTransaction(transactionId)
    closeFlow()
  } catch (error) {
    console.error('Failed to delete transaction:', error)
  }
}
</script>

