<template>
  <div class="space-y-4">
    <!-- Header with Add Transaction Button and Filters -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-foreground">Transactions</h2>
        <span
          v-if="selectedCount"
          class="text-xs uppercase tracking-wide text-muted-foreground"
        >
          {{ selectedCount }} selected
        </span>
      </div>

      <div class="flex items-center gap-3">
        <!-- Delete button (only when transactions selected) -->
        <Button
          v-if="selectedCount"
          variant="ghost"
          size="sm"
          class="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          @click="deleteSelectedTransactions"
        >
          <TrashIcon class="w-4 h-4" />
          Delete ({{ selectedCount }})
        </Button>

        <!-- Divider when delete is shown -->
        <div v-if="selectedCount" class="h-6 w-px bg-border"></div>

        <!-- Primary action button -->
        <Button
          size="sm"
          @click="openAddTransactionModal"
          class="flex items-center gap-2"
        >
          <PlusIcon class="w-4 h-4" />
          Add Transaction
        </Button>

        <!-- Add Scheduled Transaction button (Web only, CASH and CREDIT accounts) -->
        <Button
          v-if="!isMobile && (isCashAccount || isCreditAccount)"
          size="sm"
          variant="outline"
          @click="showScheduledTransactionModal = true"
          class="flex items-center gap-2"
        >
          <CalendarClockIcon class="w-4 h-4" />
          Add Scheduled
        </Button>

        <!-- Transfer button for cash accounts -->
        <Button
          v-if="isCashAccount"
          size="sm"
          variant="outline"
          @click="showTransferModal = true"
          class="flex items-center gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
        >
          <ArrowRightLeftIcon class="w-4 h-4" />
          Transfer
        </Button>

        <!-- Make Payment button for credit accounts -->
        <Button
          v-if="isCreditAccount"
          size="sm"
          variant="outline"
          @click="showPaymentModal = true"
          class="flex items-center gap-2"
        >
          <CreditCardIcon class="w-4 h-4" />
          Make Payment
        </Button>
      </div>
    </div>

    <!-- Search Bar (Web only) -->
    <div v-if="!isMobile" class="relative">
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search transactions by payee, category, or memo..."
          class="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          title="Clear search"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <div class="flex items-center gap-2">
        <input
          id="show-reconciled"
          type="checkbox"
          v-model="showReconciled"
          class="rounded border-input"
        />
        <label for="show-reconciled" class="cursor-pointer">
          Show reconciled transactions
        </label>
      </div>
      <span class="hidden sm:inline">Double-click a row to edit</span>
    </div>

    <!-- Scheduled Transactions Section -->
    <ScheduledTransactionsSection
      v-if="!isMobile && (isCashAccount || isCreditAccount)"
      :scheduled-transactions="accountScheduledTransactions"
      :selected-scheduled-ids="selectedScheduledTransactionIds"
      :initially-expanded="expandScheduled"
      @update:selected-scheduled-ids="handleScheduledSelectionChange"
      @edit="handleEditScheduledTransaction"
    />

    <!-- Transaction Table -->
    <div class="rounded-md border border-border bg-card/50 overflow-hidden">
      <div v-if="isLoading" class="py-10 text-center text-sm text-muted-foreground">
        Loading transactions…
      </div>

      <div v-else-if="transactions.length === 0" class="text-center py-10 text-sm text-muted-foreground">
        <template v-if="searchQuery.trim()">
          No transactions found matching "{{ searchQuery }}".
        </template>
        <template v-else>
          No transactions yet. Add your first transaction to get started.
        </template>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm border-collapse">
          <thead class="bg-muted/40 text-muted-foreground uppercase tracking-wide text-[0.65rem]">
            <tr>
              <th class="px-4 py-3 font-medium text-left w-40">Payee</th>
              <th class="px-4 py-3 font-medium text-left w-40">Category</th>
              <th class="px-4 py-3 font-medium text-left w-48">Memo</th>
              <th class="px-4 py-3 font-medium text-right w-28">Outflow</th>
              <th class="px-4 py-3 font-medium text-right w-28">Inflow</th>
              <th class="px-4 py-3 font-medium text-left w-12">C</th>
            </tr>
          </thead>
          <tbody>
            <TransactionRow
              v-for="transaction in transactions"
              :key="transaction.id"
              :transaction="transaction"
              :is-selected="selectedTransactionIds.includes(transaction.id)"
              :account-name="currentAccount?.name"
              :account-type="currentAccount?.account_type"
              @select="handleRowSelect"
              @edit="handleRowEdit"
              @toggle-cleared="toggleClearedHandler"
            />
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Transaction Modal -->
    <TransactionModal
      :is-open="showAddTransactionModal || showEditTransactionModal"
      :transaction="editingTransaction"
      :account-id="accountId"
      :is-submitting="isSubmitting"
      @close="closeModal"
      @save="handleSaveTransaction"
    />

    <!-- Transfer Modal -->
    <TransferModal
      :is-open="showTransferModal"
      :account-id="accountId"
      :is-submitting="isSubmitting"
      @close="closeTransferModal"
      @save="handleSaveTransfer"
    />

    <!-- Credit Card Payment Modal -->
    <CreditCardPaymentModal
      :is-open="showPaymentModal"
      :account-name="currentAccount?.name || ''"
      :default-amount="currentAccount?.cleared_balance"
      :is-submitting="isSubmitting"
      @close="closePaymentModal"
      @save="handleSavePayment"
    />

    <!-- Scheduled Transaction Modal -->
    <CreateScheduledTransactionModal
      v-if="currentAccount"
      :is-open="showScheduledTransactionModal"
      :account-id="accountId"
      :budget-id="currentAccount.budget_id"
      :is-submitting="isSubmittingScheduled"
      @close="showScheduledTransactionModal = false"
      @save="handleSaveScheduledTransaction"
    />

    <!-- Edit Scheduled Transaction Modal -->
    <EditScheduledTransactionModal
      :is-open="showEditScheduledTransactionModal"
      :transaction="editingScheduledTransaction"
      :is-submitting="isSubmittingScheduled"
      @close="closeEditScheduledTransactionModal"
      @save="handleUpdateScheduledTransaction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { PlusIcon, TrashIcon, ArrowRightLeftIcon, CreditCard as CreditCardIcon, CalendarClock as CalendarClockIcon, Search as SearchIcon, X as XIcon } from 'lucide-vue-next'
import Button from '@/components/shadcn-ui/button.vue'
import TransactionRow from './TransactionRow.vue'
import TransactionModal from './TransactionModal.vue'
import TransferModal from './TransferModal.vue'
import CreditCardPaymentModal from './CreditCardPaymentModal.vue'
import CreateScheduledTransactionModal from '@/components/scheduled-transactions/CreateScheduledTransactionModal.vue'
import EditScheduledTransactionModal from '@/components/scheduled-transactions/EditScheduledTransactionModal.vue'
import ScheduledTransactionsSection from '@/components/scheduled-transactions/ScheduledTransactionsSection.vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useAccountStore } from '@/stores/account.store'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import { useScheduledTransactionStore } from '@/stores/scheduled-transaction.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import type { TransactionResponse, CreateTransactionDto, UpdateTransactionDto } from '@/types/DTO/transaction.dto'
import type { CreateScheduledTransactionDto, UpdateScheduledTransactionDto, ScheduledTransactionResponse } from '@/types/DTO/scheduled-transaction.dto'
import { AccountService } from '@/services/account.service'
import { scheduledTransactionService } from '@/services/scheduled-transaction.service'
import { useToast } from 'vue-toast-notification'
import confetti from 'canvas-confetti'

const props = withDefaults(defineProps<{
  accountId: string
  highlightScheduledId?: string
  expandScheduled?: boolean
}>(), {
  highlightScheduledId: undefined,
  expandScheduled: false
})

const transactionStore = useTransactionStore()
const accountStore = useAccountStore()
const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()
const scheduledTransactionStore = useScheduledTransactionStore()
const {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  toggleCleared,
  isLoading
} = useTransactionOperations()
const $toast = useToast()

const showAddTransactionModal = ref(false)
const showEditTransactionModal = ref(false)
const showTransferModal = ref(false)
const showPaymentModal = ref(false)
const showScheduledTransactionModal = ref(false)
const showEditScheduledTransactionModal = ref(false)
const editingTransaction = ref<TransactionResponse | null>(null)
const editingScheduledTransaction = ref<ScheduledTransactionResponse | null>(null)
const showReconciled = ref(false)
const selectedTransactionIds = ref<string[]>([])
const selectedScheduledTransactionIds = ref<string[]>([])
const lastSelectedId = ref<string | null>(null)
const isSubmittingScheduled = ref(false)
const searchQuery = ref('')

// Get scheduled transactions from store for this account
const accountScheduledTransactions = computed(() =>
  scheduledTransactionStore.getScheduledTransactionsByAccount(props.accountId)
)

// Handle highlighting scheduled transaction from query params
watch(() => props.highlightScheduledId, (scheduledId) => {
  if (scheduledId) {
    // Select the transaction briefly to highlight it
    selectedScheduledTransactionIds.value = [scheduledId]

    // Clear the selection after 3 seconds
    setTimeout(() => {
      selectedScheduledTransactionIds.value = []
    }, 3000)
  }
}, { immediate: true })

// Combined selected count for both regular and scheduled transactions
const selectedCount = computed(() =>
  selectedTransactionIds.value.length + selectedScheduledTransactionIds.value.length
)

// Mobile detection
const isMobile = ref(window.innerWidth < 768)

// Check account type
const currentAccount = computed(() => {
  return accountStore.accounts.find(acc => acc.id === props.accountId)
})

const isCashAccount = computed(() => {
  return currentAccount.value?.account_type === 'CASH'
})

const isCreditAccount = computed(() => {
  return currentAccount.value?.account_type === 'CREDIT'
})

const transactions = computed(() => {
  let allTransactions = transactionStore.getTransactionsByAccount(props.accountId)

  // Filter by search query first
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    allTransactions = allTransactions.filter(transaction => {
      // Search in payee
      const payeeMatch = transaction.payee?.toLowerCase().includes(query)

      // Search in memo
      const memoMatch = transaction.memo?.toLowerCase().includes(query)

      // Search in category name
      let categoryMatch = false
      if (transaction.category_id === null) {
        // Special handling for credit card payment transfers
        if (
          currentAccount.value?.account_type === 'CREDIT' &&
          currentAccount.value?.name &&
          transaction.payee?.startsWith('Transfer : ') &&
          transaction.amount > 0
        ) {
          const paymentCategoryName = `${currentAccount.value.name} Payment`.toLowerCase()
          categoryMatch = paymentCategoryName.includes(query)
        } else {
          categoryMatch = 'ready to assign'.includes(query)
        }
      } else if (!transaction.category_id) {
        categoryMatch = 'uncategorized'.includes(query)
      } else {
        const category = categoryStore.categories.find(cat => cat.id === transaction.category_id)
        categoryMatch = category?.name.toLowerCase().includes(query) || false
      }

      return payeeMatch || memoMatch || categoryMatch
    })
  } else {
    // Only filter by reconciled status when NOT searching
    if (!showReconciled.value) {
      allTransactions = allTransactions.filter(transaction => !transaction.is_reconciled)
    }
  }

  return allTransactions
})

const selectedTransactions = computed(() => {
  if (!selectedTransactionIds.value.length) return []
  const idSet = new Set(selectedTransactionIds.value)
  // Filter out reconciled transactions - they should never be selected, but extra safety
  return transactions.value.filter(transaction =>
    idSet.has(transaction.id) && !transaction.is_reconciled
  )
})

const clearSelection = () => {
  selectedTransactionIds.value = []
  selectedScheduledTransactionIds.value = []
  lastSelectedId.value = null
}

watch(transactions, newTransactions => {
  if (!selectedTransactionIds.value.length) return
  // Filter out transactions that no longer exist OR are reconciled
  const nextIds = selectedTransactionIds.value.filter(id => {
    const transaction = newTransactions.find(t => t.id === id)
    return transaction && !transaction.is_reconciled
  })
  if (nextIds.length !== selectedTransactionIds.value.length) {
    selectedTransactionIds.value = nextIds
  }
  if (!nextIds.length) {
    lastSelectedId.value = null
  }
})

type RowSelectEvent = { transaction: TransactionResponse; shiftKey: boolean; metaKey: boolean }

const handleRowSelect = ({ transaction, shiftKey, metaKey }: RowSelectEvent) => {
  // This should never be called for reconciled transactions due to TransactionRow guards,
  // but add extra safety check
  if (transaction.is_reconciled) {
    return
  }

  // Clear scheduled transaction selection when selecting regular transactions
  selectedScheduledTransactionIds.value = []

  const id = transaction.id
  const currentIds = new Set(selectedTransactionIds.value)
  const orderedTransactions = transactions.value

  if (shiftKey && lastSelectedId.value) {
    const startIndex = orderedTransactions.findIndex(item => item.id === lastSelectedId.value)
    const endIndex = orderedTransactions.findIndex(item => item.id === id)

    if (startIndex !== -1 && endIndex !== -1) {
      const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
      // Filter out reconciled transactions from the range
      const rangeIds = orderedTransactions
        .slice(from, to + 1)
        .filter(item => !item.is_reconciled)
        .map(item => item.id)
      rangeIds.forEach(rangeId => currentIds.add(rangeId))
    } else {
      currentIds.clear()
      currentIds.add(id)
    }
  } else if (metaKey) {
    if (currentIds.has(id)) {
      currentIds.delete(id)
    } else {
      currentIds.add(id)
    }
  } else {
    if (selectedTransactionIds.value.length === 1 && selectedTransactionIds.value[0] === id) {
      currentIds.clear()
    } else {
      currentIds.clear()
      currentIds.add(id)
    }
  }

  selectedTransactionIds.value = Array.from(currentIds)
  lastSelectedId.value = selectedTransactionIds.value.length ? id : null
}

const editTransaction = (transaction: TransactionResponse) => {
  editingTransaction.value = transaction
  showEditTransactionModal.value = true
}

const handleRowEdit = (transaction: TransactionResponse) => {
  // This should never be called for reconciled transactions due to TransactionRow guards,
  // but add extra safety check
  if (transaction.is_reconciled) {
    return
  }

  selectedTransactionIds.value = [transaction.id]
  lastSelectedId.value = transaction.id
  editTransaction(transaction)
}

const deleteTransactionsHandler = async (transactionsToDelete: TransactionResponse[]) => {
  const count = transactionsToDelete.length
  if (!count) return false

  try {
    // Use bulk delete for multiple transactions for better performance
    if (count > 1) {
      const transactionIds = transactionsToDelete.map(t => t.id)
      await bulkDeleteTransactions(transactionIds)
    } else {
      // Use single delete for one transaction
      await deleteTransaction(transactionsToDelete[0].id)
    }
    // No success toast - optimistic update provides instant feedback
    return true
  } catch (error) {
    $toast.error('Failed to delete selected transactions')
    return false
  }
}

const deleteSelectedTransactions = async () => {
  // Check if we're deleting regular transactions or scheduled transactions
  if (selectedScheduledTransactionIds.value.length > 0) {
    // Delete scheduled transactions
    await handleDeleteScheduledTransactions(selectedScheduledTransactionIds.value)
  } else if (selectedTransactions.value.length > 0) {
    // Delete regular transactions
    const deleted = await deleteTransactionsHandler(selectedTransactions.value)
    if (deleted) {
      clearSelection()
    }
  }
}

const handleGlobalKeydown = (event: KeyboardEvent) => {
  // Check if any transactions (regular or scheduled) are selected
  if (!selectedTransactionIds.value.length && !selectedScheduledTransactionIds.value.length) return

  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
    return
  }

  if (showAddTransactionModal.value || showEditTransactionModal.value || showTransferModal.value || showPaymentModal.value || showScheduledTransactionModal.value || showEditScheduledTransactionModal.value) {
    return
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    event.stopPropagation()
    deleteSelectedTransactions()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown, true)
})

const toggleClearedHandler = async (transaction: TransactionResponse) => {
  // Prevent toggling cleared status on reconciled transactions
  if (transaction.is_reconciled) {
    return
  }

  try {
    await toggleCleared(transaction.id)
  } catch (error) {
    $toast.error('Failed to update transaction status')
  }
}

const openAddTransactionModal = () => {
  editingTransaction.value = null
  showAddTransactionModal.value = true
}

const triggerConfetti = () => {
  // Create a fun confetti burst from both bottom corners!
  const count = 200

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  // Left corner
  fire(0.25, {
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 1 },
    startVelocity: 60,
  })

  fire(0.2, {
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 1 },
    startVelocity: 50,
  })

  fire(0.35, {
    angle: 60,
    spread: 100,
    origin: { x: 0, y: 1 },
    decay: 0.91,
    scalar: 0.8,
    startVelocity: 55,
  })

  // Right corner
  fire(0.25, {
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 1 },
    startVelocity: 60,
  })

  fire(0.2, {
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 1 },
    startVelocity: 50,
  })

  fire(0.35, {
    angle: 120,
    spread: 100,
    origin: { x: 1, y: 1 },
    decay: 0.91,
    scalar: 0.8,
    startVelocity: 55,
  })
}

const closeModal = () => {
  showAddTransactionModal.value = false
  showEditTransactionModal.value = false
  editingTransaction.value = null
}

const closeTransferModal = () => {
  showTransferModal.value = false
}

const closePaymentModal = () => {
  showPaymentModal.value = false
}

const isSubmitting = ref(false)

const handleSaveTransaction = async (transactionData: CreateTransactionDto | UpdateTransactionDto) => {
  if (isSubmitting.value) return // Prevent duplicate submissions

  isSubmitting.value = true

  // Capture the editing transaction ID and check if it's an inflow before closing modal
  const transactionIdToUpdate = editingTransaction.value?.id
  const isInflow = transactionData.amount > 0
  const shouldTriggerConfetti = isInflow && !transactionIdToUpdate

  // Close modal immediately for instant feedback (optimistic)
  closeModal()

  // Trigger confetti IMMEDIATELY for inflow transactions (optimistic)!
  if (shouldTriggerConfetti) {
    // Small delay to let modal close animation start
    setTimeout(() => {
      triggerConfetti()
    }, 100)
  }

  try {
    if (transactionIdToUpdate) {
      // Update existing transaction
      await updateTransaction(transactionIdToUpdate, transactionData as UpdateTransactionDto)
      // No success toast - optimistic update provides instant feedback
    } else {
      // Create new transaction
      await createTransaction(transactionData as CreateTransactionDto)
      // No success toast - optimistic update provides instant feedback
    }
  } catch (error) {
    $toast.error('Failed to save transaction')
  } finally {
    isSubmitting.value = false
  }
}

const handleSaveTransfer = async (transactionData: CreateTransactionDto) => {
  if (isSubmitting.value) return // Prevent duplicate submissions

  isSubmitting.value = true

  // Close modal immediately for instant feedback (optimistic)
  closeTransferModal()

  try {
    // Create transfer transaction
    await createTransaction(transactionData)
    // No success toast - optimistic update provides instant feedback
  } catch (error) {
    $toast.error('Failed to create transfer')
  } finally {
    isSubmitting.value = false
  }
}

const handleSavePayment = async (amount: number, fromAccountId: string, memo?: string) => {
  if (isSubmitting.value) return // Prevent duplicate submissions

  isSubmitting.value = true

  // Close modal immediately for instant feedback (optimistic)
  closePaymentModal()

  // Create optimistic transaction
  const optimisticTransaction: TransactionResponse = {
    id: `temp-${Date.now()}`,
    account_id: props.accountId,
    date: new Date().toISOString().split('T')[0],
    amount: Math.abs(amount), // Positive amount (inflow to credit card)
    payee: 'Credit Card Payment',
    memo: memo || 'Credit Card Payment',
    is_cleared: false,
    is_reconciled: false,
    category_id: undefined, // Will be set by backend
    created_at: new Date(),
    updated_at: new Date()
  }

  // Optimistically add transaction to store
  transactionStore.addTransaction(optimisticTransaction)

  // Optimistically update account balance (positive amount reduces credit card debt)
  const account = accountStore.accounts.find(acc => acc.id === props.accountId)
  if (account) {
    const newUnclearedBalance = account.uncleared_balance + Math.abs(amount)
    const newWorkingBalance = account.working_balance + Math.abs(amount)

    accountStore.updateAccount(props.accountId, {
      uncleared_balance: newUnclearedBalance,
      working_balance: newWorkingBalance
    })
  }

  try {
    // Call the credit card payment API endpoint
    const response = await AccountService.makeCreditCardPayment(props.accountId, {
      amount,
      from_account_id: fromAccountId,
      memo
    })

    // Remove optimistic transaction
    transactionStore.removeTransaction(optimisticTransaction.id)

    // Update stores with server response
    budgetStore.setReadyToAssign(response.readyToAssign)
    accountStore.updateAccount(props.accountId, response.account) // Credit card account
    accountStore.updateAccount(fromAccountId, response.sourceAccount) // Cash account

    // Update payment category balance if provided
    if (response.paymentCategoryBalance) {
      categoryStore.updateCategoryBalance(
        response.paymentCategoryBalance.category_id,
        response.paymentCategoryBalance
      )
    }

    // Add both transactions from server (source and linked)
    transactionStore.addTransaction(response.transaction) // Cash account transaction
    if (response.linkedTransaction) {
      transactionStore.addTransaction(response.linkedTransaction) // Credit card transaction
    }

    // No success toast - instant UI feedback is enough
  } catch (error) {
    // Rollback optimistic updates on error
    transactionStore.removeTransaction(optimisticTransaction.id)

    if (account) {
      const rollbackUnclearedBalance = account.uncleared_balance - Math.abs(amount)
      const rollbackWorkingBalance = account.working_balance - Math.abs(amount)

      accountStore.updateAccount(props.accountId, {
        uncleared_balance: rollbackUnclearedBalance,
        working_balance: rollbackWorkingBalance
      })
    }

    $toast.error('Failed to process payment')
  } finally {
    isSubmitting.value = false
  }
}

const handleSaveScheduledTransaction = async (data: CreateScheduledTransactionDto) => {
  if (isSubmittingScheduled.value) return

  isSubmittingScheduled.value = true

  try {
    const newScheduledTransaction = await scheduledTransactionService.create(data)
    scheduledTransactionStore.addScheduledTransaction(newScheduledTransaction)
    showScheduledTransactionModal.value = false
    // No success toast - optimistic update provides instant feedback
  } catch (error) {
    console.error('Error creating scheduled transaction:', error)
    $toast.error('Failed to create scheduled transaction')
  } finally {
    isSubmittingScheduled.value = false
  }
}

const handleEditScheduledTransaction = (transaction: ScheduledTransactionResponse) => {
  editingScheduledTransaction.value = transaction
  showEditScheduledTransactionModal.value = true
}

const closeEditScheduledTransactionModal = () => {
  showEditScheduledTransactionModal.value = false
  editingScheduledTransaction.value = null
}

const handleUpdateScheduledTransaction = async (id: string, data: UpdateScheduledTransactionDto) => {
  if (isSubmittingScheduled.value) return

  isSubmittingScheduled.value = true

  try {
    const updatedScheduledTransaction = await scheduledTransactionService.update(id, data)
    scheduledTransactionStore.updateScheduledTransaction(id, updatedScheduledTransaction)
    closeEditScheduledTransactionModal()
    // No success toast - optimistic update provides instant feedback
  } catch (error) {
    console.error('Error updating scheduled transaction:', error)
    $toast.error('Failed to update scheduled transaction')
  } finally {
    isSubmittingScheduled.value = false
  }
}

const handleScheduledSelectionChange = (ids: string[]) => {
  // When scheduled transactions are selected, clear regular transaction selection
  if (ids.length > 0) {
    selectedTransactionIds.value = []
  }
  selectedScheduledTransactionIds.value = ids
}

const handleDeleteScheduledTransactions = async (transactionIds: string[]) => {
  try {
    // Delete all selected scheduled transactions
    await Promise.all(
      transactionIds.map(id => scheduledTransactionService.remove(id))
    )

    // Remove from store
    transactionIds.forEach(id => {
      scheduledTransactionStore.removeScheduledTransaction(id)
    })

    // Clear selection
    selectedScheduledTransactionIds.value = []
    // No success toast - optimistic update provides instant feedback
  } catch (error) {
    console.error('Error deleting scheduled transaction(s):', error)
    $toast.error('Failed to delete scheduled transaction(s)')
  }
}

// Transactions are now loaded via the main-data API call in the parent component
// No need to load them separately here
</script>
