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

      <div class="flex items-center gap-2">
        <Button
          v-if="selectedCount"
          variant="ghost"
          size="sm"
          class="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          @click="deleteSelectedTransactions"
        >
          <TrashIcon class="w-4 h-4" />
          Delete
        </Button>
        <Button
          v-if="isCashAccount"
          size="sm"
          variant="outline"
          @click="showTransferModal = true"
          class="flex items-center gap-2"
        >
          <ArrowRightLeftIcon class="w-4 h-4" />
          Transfer Money
        </Button>
        <Button size="sm" @click="showAddTransactionModal = true" class="flex items-center gap-2">
          <PlusIcon class="w-4 h-4" />
          Add Transaction
        </Button>
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

    <!-- Transaction Table -->
    <div class="rounded-md border border-border bg-card/50 overflow-hidden">
      <div v-if="isLoading" class="py-10 text-center text-sm text-muted-foreground">
        Loading transactions…
      </div>

      <div v-else-if="transactions.length === 0" class="text-center py-10 text-sm text-muted-foreground">
        No transactions yet. Add your first transaction to get started.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm border-collapse">
          <thead class="bg-muted/40 text-muted-foreground uppercase tracking-wide text-[0.65rem]">
            <tr>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { PlusIcon, TrashIcon, ArrowRightLeftIcon } from 'lucide-vue-next'
import Button from '@/components/shadcn-ui/button.vue'
import TransactionRow from './TransactionRow.vue'
import TransactionModal from './TransactionModal.vue'
import TransferModal from './TransferModal.vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useAccountStore } from '@/stores/account.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import type { TransactionResponse, CreateTransactionDto, UpdateTransactionDto } from '@/types/DTO/transaction.dto'
import { useToast } from 'vue-toast-notification'

const props = defineProps<{
  accountId: string
}>()

const transactionStore = useTransactionStore()
const accountStore = useAccountStore()
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
const editingTransaction = ref<TransactionResponse | null>(null)
const showReconciled = ref(false)
const selectedTransactionIds = ref<string[]>([])
const lastSelectedId = ref<string | null>(null)

// Check if current account is a cash account
const currentAccount = computed(() => {
  return accountStore.accounts.find(acc => acc.id === props.accountId)
})

const isCashAccount = computed(() => {
  return currentAccount.value?.account_type === 'CASH'
})

const transactions = computed(() => {
  const allTransactions = transactionStore.getTransactionsByAccount(props.accountId)

  if (showReconciled.value) {
    return allTransactions
  } else {
    // Hide reconciled transactions by default
    return allTransactions.filter(transaction => !transaction.is_reconciled)
  }
})

const selectedTransactions = computed(() => {
  if (!selectedTransactionIds.value.length) return []
  const idSet = new Set(selectedTransactionIds.value)
  return transactions.value.filter(transaction => idSet.has(transaction.id))
})

const selectedCount = computed(() => selectedTransactionIds.value.length)

const clearSelection = () => {
  selectedTransactionIds.value = []
  lastSelectedId.value = null
}

watch(transactions, newTransactions => {
  if (!selectedTransactionIds.value.length) return
  const nextIds = selectedTransactionIds.value.filter(id => newTransactions.some(transaction => transaction.id === id))
  if (nextIds.length !== selectedTransactionIds.value.length) {
    selectedTransactionIds.value = nextIds
  }
  if (!nextIds.length) {
    lastSelectedId.value = null
  }
})

type RowSelectEvent = { transaction: TransactionResponse; shiftKey: boolean; metaKey: boolean }

const handleRowSelect = ({ transaction, shiftKey, metaKey }: RowSelectEvent) => {
  const id = transaction.id
  const currentIds = new Set(selectedTransactionIds.value)
  const orderedTransactions = transactions.value

  if (shiftKey && lastSelectedId.value) {
    const startIndex = orderedTransactions.findIndex(item => item.id === lastSelectedId.value)
    const endIndex = orderedTransactions.findIndex(item => item.id === id)

    if (startIndex !== -1 && endIndex !== -1) {
      const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
      const rangeIds = orderedTransactions.slice(from, to + 1).map(item => item.id)
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
  selectedTransactionIds.value = [transaction.id]
  lastSelectedId.value = transaction.id
  editTransaction(transaction)
}

const deleteTransactionsHandler = async (transactionsToDelete: TransactionResponse[]) => {
  const count = transactionsToDelete.length
  if (!count) return false

  const confirmationMessage = count === 1
    ? 'Are you sure you want to delete this transaction?'
    : `Delete ${count} transactions?`

  if (!confirm(confirmationMessage)) {
    return false
  }

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
  const deleted = await deleteTransactionsHandler(selectedTransactions.value)
  if (deleted) {
    clearSelection()
  }
}

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (!selectedTransactionIds.value.length) return

  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
    return
  }

  if (showAddTransactionModal.value || showEditTransactionModal.value || showTransferModal.value) {
    return
  }

  if (event.key === 'Delete' || (event.key === 'Backspace' && (event.metaKey || event.ctrlKey))) {
    event.preventDefault()
    deleteSelectedTransactions()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

const toggleClearedHandler = async (transaction: TransactionResponse) => {
  try {
    await toggleCleared(transaction.id)
  } catch (error) {
    $toast.error('Failed to update transaction status')
  }
}

const closeModal = () => {
  showAddTransactionModal.value = false
  showEditTransactionModal.value = false
  editingTransaction.value = null
}

const closeTransferModal = () => {
  showTransferModal.value = false
}

const isSubmitting = ref(false)

const handleSaveTransaction = async (transactionData: CreateTransactionDto | UpdateTransactionDto) => {
  if (isSubmitting.value) return // Prevent duplicate submissions

  isSubmitting.value = true

  // Capture the editing transaction ID before closing modal
  const transactionIdToUpdate = editingTransaction.value?.id

  // Close modal immediately for instant feedback (optimistic)
  closeModal()

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

// Transactions are now loaded via the main-data API call in the parent component
// No need to load them separately here
</script>
