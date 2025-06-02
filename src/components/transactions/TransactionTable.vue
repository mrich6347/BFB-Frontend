<template>
  <div class="space-y-4">
    <!-- Add Transaction Button -->
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold text-foreground">Transactions</h2>
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
                <CheckIcon class="w-4 h-4" />
              </th>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground">Payee</th>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground">Category</th>
              <th class="text-left p-3 text-sm font-medium text-muted-foreground">Memo</th>
              <th class="text-right p-3 text-sm font-medium text-muted-foreground">Outflow</th>
              <th class="text-right p-3 text-sm font-medium text-muted-foreground">Inflow</th>
              <th class="w-12"></th>
            </tr>
          </thead>
          <tbody>
            <TransactionRow
              v-for="transaction in transactions"
              :key="transaction.id"
              :transaction="transaction"
              @edit="editTransaction"
              @delete="deleteTransaction"
              @toggle-cleared="toggleCleared"
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
      @close="closeModal"
      @save="handleSaveTransaction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, CheckIcon } from 'lucide-vue-next'
import Button from '@/components/shadcn-ui/button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TransactionRow from './TransactionRow.vue'
import TransactionModal from './TransactionModal.vue'
import { useTransactionStore } from '@/stores/transaction.store'
import type { TransactionResponse, CreateTransactionDto, UpdateTransactionDto } from '@/types/DTO/transaction.dto'
import { useToast } from 'vue-toast-notification'

const props = defineProps<{
  accountId: string
}>()

const transactionStore = useTransactionStore()
const $toast = useToast()

const showAddTransactionModal = ref(false)
const showEditTransactionModal = ref(false)
const editingTransaction = ref<TransactionResponse | null>(null)

const transactions = computed(() => {
  return transactionStore.getTransactionsByAccount(props.accountId)
})

const editTransaction = (transaction: TransactionResponse) => {
  editingTransaction.value = transaction
  showEditTransactionModal.value = true
}

const deleteTransaction = async (transaction: TransactionResponse) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      await transactionStore.deleteTransaction(transaction.id)
      $toast.success('Transaction deleted successfully')
    } catch (error) {
      $toast.error('Failed to delete transaction')
    }
  }
}

const toggleCleared = async (transaction: TransactionResponse) => {
  try {
    await transactionStore.toggleCleared(transaction.id)
  } catch (error) {
    $toast.error('Failed to update transaction status')
  }
}

const closeModal = () => {
  showAddTransactionModal.value = false
  showEditTransactionModal.value = false
  editingTransaction.value = null
}

const handleSaveTransaction = async (transactionData: CreateTransactionDto | UpdateTransactionDto) => {
  try {
    if (editingTransaction.value) {
      // Update existing transaction
      await transactionStore.updateTransaction(editingTransaction.value.id, transactionData as UpdateTransactionDto)
      $toast.success('Transaction updated successfully')
    } else {
      // Create new transaction
      await transactionStore.createTransaction(transactionData as CreateTransactionDto)
      $toast.success('Transaction created successfully')
    }
    closeModal()
  } catch (error) {
    $toast.error('Failed to save transaction')
  }
}

// Transactions are now loaded via the main-data API call in the parent component
// No need to load them separately here
</script>
