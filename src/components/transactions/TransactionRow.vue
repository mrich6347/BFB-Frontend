<template>
  <tr
    class="border-b border-border hover:bg-muted/30 transition-colors"
    :class="{ 'opacity-60 bg-muted/20': transaction.is_reconciled }"
  >
    <!-- Cleared Status -->
    <td class="p-3">
      <div class="flex items-center gap-1">
        <button
          @click="$emit('toggle-cleared', transaction)"
          class="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors font-semibold text-xs"
          :class="transaction.is_cleared
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-muted-foreground hover:border-green-500 text-muted-foreground hover:text-green-500'"
          :disabled="transaction.is_reconciled"
          :title="transaction.is_reconciled ? 'Cannot modify reconciled transaction' : 'Toggle cleared status'"
        >
          C
        </button>
        <!-- Reconciled indicator -->
        <div
          v-if="transaction.is_reconciled"
          class="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"
          title="Reconciled transaction"
        >
          <span class="text-white text-xs font-bold">R</span>
        </div>
      </div>
    </td>

    <!-- Date -->
    <td class="p-3 text-sm text-foreground w-24">
      {{ formatDate(transaction.date, budgetStore.currentBudget?.date_format || DateFormat.ISO) }}
    </td>

    <!-- Payee -->
    <td class="p-3 text-sm text-foreground w-40 max-w-40">
      <div class="truncate">
        {{ transaction.payee || '-' }}
      </div>
    </td>

    <!-- Category -->
    <td class="p-3 text-sm text-foreground w-40 max-w-40">
      <div class="truncate">
        {{ getCategoryName(transaction.category_id) }}
      </div>
    </td>

    <!-- Memo -->
    <td class="p-3 text-sm text-muted-foreground w-40 max-w-40">
      <div v-if="transaction.memo" class="space-y-1">
        <div class="flex items-start gap-2">
          <div
            :class="[
              'flex-1 min-w-0',
              isMemoExpanded ? 'whitespace-normal break-words' : 'truncate'
            ]"
          >
            {{ transaction.memo }}
          </div>
          <button
            v-if="isMemoLong"
            @click="toggleMemoExpansion"
            class="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
            :title="isMemoExpanded ? 'Collapse memo' : 'Expand memo'"
          >
            <ChevronDownIcon
              :class="[
                'w-3 h-3 text-muted-foreground transition-transform',
                isMemoExpanded ? 'rotate-180' : ''
              ]"
            />
          </button>
        </div>
      </div>
      <span v-else>-</span>
    </td>

    <!-- Outflow -->
    <td class="p-3 text-sm text-right tabular-nums w-32">
      <span v-if="transaction.amount < 0" class="text-destructive">
        {{ formatCurrency(Math.abs(transaction.amount)) }}
      </span>
      <span v-else class="text-muted-foreground">-</span>
    </td>

    <!-- Inflow -->
    <td class="p-3 text-sm text-right tabular-nums w-32">
      <span v-if="transaction.amount > 0" class="text-green-600">
        {{ formatCurrency(transaction.amount) }}
      </span>
      <span v-else class="text-muted-foreground">-</span>
    </td>

    <!-- Actions -->
    <td class="p-3">
      <div class="flex items-center gap-1">
        <button
          @click="$emit('edit', transaction)"
          class="p-1 rounded hover:bg-muted transition-colors"
          :disabled="transaction.is_reconciled"
          :title="transaction.is_reconciled ? 'Cannot edit reconciled transaction' : 'Edit transaction'"
          :class="{ 'opacity-50 cursor-not-allowed': transaction.is_reconciled }"
        >
          <EditIcon class="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          @click="$emit('delete', transaction)"
          class="p-1 rounded hover:bg-muted transition-colors"
          :disabled="transaction.is_reconciled"
          :title="transaction.is_reconciled ? 'Cannot delete reconciled transaction' : 'Delete transaction'"
          :class="{ 'opacity-50 cursor-not-allowed': transaction.is_reconciled }"
        >
          <TrashIcon class="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { EditIcon, TrashIcon, ChevronDownIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import { formatDate } from '@/utils/dateFormatUtil'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import { DateFormat } from '@/types/DTO/budget.dto'
import type { TransactionResponse } from '@/types/DTO/transaction.dto'

const props = defineProps<{
  transaction: TransactionResponse
}>()

defineEmits<{
  edit: [transaction: TransactionResponse]
  delete: [transaction: TransactionResponse]
  'toggle-cleared': [transaction: TransactionResponse]
}>()

const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()

// Memo expansion state
const isMemoExpanded = ref(false)

// Check if memo is long enough to need expansion (more than ~50 characters)
const isMemoLong = computed(() => {
  return props.transaction.memo && props.transaction.memo.length > 50
})

const toggleMemoExpansion = () => {
  isMemoExpanded.value = !isMemoExpanded.value
}

const getCategoryName = (categoryId?: string | null) => {
  if (categoryId === null) return 'Ready to Assign'
  if (!categoryId) return 'Uncategorized'
  const category = categoryStore.categories.find(cat => cat.id === categoryId)
  return category?.name || 'Unknown Category'
}
</script>
