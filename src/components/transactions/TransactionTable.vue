<template>
  <div class="space-y-4">
    <!-- Header with Add Transaction Button and Filters -->
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-semibold text-foreground">Transactions</h2>

        <!-- Show Reconciled Toggle -->
        <div class="flex items-center gap-2 text-sm">
          <input
            id="show-reconciled"
            type="checkbox"
            v-model="showReconciled"
            class="rounded border-input"
          />
          <label for="show-reconciled" class="text-muted-foreground cursor-pointer">
            Show reconciled transactions
          </label>
        </div>
      </div>

      <Button @click="showAddTransactionModal = true" class="flex items-center gap-2">
        <PlusIcon class="w-4 h-4" />
        Add Transaction
      </Button>
    </div>

    <!-- Transaction Table -->
    <div class="bg-card rounded-lg border border-border overflow-hidden">
      <div v-if="transactionStore.isLoading" class="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>

      <div v-else-if="transactions.length === 0" class="text-center py-8 text-muted-foreground">
        No transactions found. Add your first transaction to get started.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50 border-b border-border">
            <tr>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground w-12">
                C
              </th>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground w-24">Date</th>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground">Payee</th>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground w-32">Category</th>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground w-56">Memo</th>
              <th class="text-right p-3 text-sm font-medium text-muted-foreground w-32">Outflow</th>
              <th class="text-right p-3 text-sm font-medium text-muted-foreground w-32">Inflow</th>
              <th class="w-12"></th>
            </tr>
          </thead>
          <tbody>
            <TransactionRow
              v-for="transaction in transactions"
              :key="transaction.id"
              :transaction="transaction"
              @edit="editTransaction"
              @delete="deleteTransactionHandler"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusIcon } from 'lucide-vue-next'
import Button from '@/components/shadcn-ui/button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TransactionRow from './TransactionRow.vue'
import TransactionModal from './TransactionModal.vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import type { TransactionResponse, CreateTransactionDto, UpdateTransactionDto } from '@/types/DTO/transaction.dto'
import { useToast } from 'vue-toast-notification'

const props = defineProps<{
  accountId: string
}>()

const transactionStore = useTransactionStore()
const {
  loadTransactionsByAccount,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  toggleCleared,
  isLoading
} = useTransactionOperations()
const $toast = useToast()

const showAddTransactionModal = ref(false)
const showEditTransactionModal = ref(false)
const editingTransaction = ref<TransactionResponse | null>(null)
const showReconciled = ref(false)

const transactions = computed(() => {
  const allTransactions = transactionStore.getTransactionsByAccount(props.accountId)

  if (showReconciled.value) {
    return allTransactions
  } else {
    // Hide reconciled transactions by default
    return allTransactions.filter(transaction => !transaction.is_reconciled)
  }
})

const editTransaction = (transaction: TransactionResponse) => {
  editingTransaction.value = transaction
  showEditTransactionModal.value = true
}

const deleteTransactionHandler = async (transaction: TransactionResponse) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      await deleteTransaction(transaction.id)
      $toast.success('Transaction deleted successfully')
    } catch (error) {
      $toast.error('Failed to delete transaction')
    }
  }
}

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

const isSubmitting = ref(false)

const handleSaveTransaction = async (transactionData: CreateTransactionDto | UpdateTransactionDto) => {
  if (isSubmitting.value) return // Prevent duplicate submissions

  isSubmitting.value = true
  try {
    if (editingTransaction.value) {
      // Update existing transaction
      await updateTransaction(editingTransaction.value.id, transactionData as UpdateTransactionDto)
      $toast.success('Transaction updated successfully')
    } else {
      // Create new transaction
      await createTransaction(transactionData as CreateTransactionDto)
      $toast.success('Transaction created successfully')
    }
    closeModal()
  } catch (error) {
    $toast.error('Failed to save transaction')
  } finally {
    isSubmitting.value = false
  }
}

// Transactions are now loaded via the main-data API call in the parent component
// No need to load them separately here
</script>
