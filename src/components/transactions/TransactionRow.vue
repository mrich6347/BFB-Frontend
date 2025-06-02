<template>
  <tr class="border-b border-border hover:bg-muted/30 transition-colors">
    <!-- Cleared Status -->
    <td class="p-3">
      <button
        @click="$emit('toggle-cleared', transaction)"
        class="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors"
        :class="transaction.is_cleared
          ? 'bg-green-500 border-green-500 text-white'
          : 'border-muted-foreground hover:border-green-500'"
      >
        <CheckIcon v-if="transaction.is_cleared" class="w-3 h-3" />
      </button>
    </td>

    <!-- Date -->
    <td class="p-3 text-sm text-foreground">
      {{ formatDate(transaction.date, budgetStore.currentBudget?.date_format || DateFormat.ISO) }}
    </td>

    <!-- Payee -->
    <td class="p-3 text-sm text-foreground">
      {{ transaction.payee || '-' }}
    </td>

    <!-- Category -->
    <td class="p-3 text-sm text-foreground">
      {{ getCategoryName(transaction.category_id) }}
    </td>

    <!-- Memo -->
    <td class="p-3 text-sm text-muted-foreground">
      {{ transaction.memo || '-' }}
    </td>

    <!-- Outflow -->
    <td class="p-3 text-sm text-right tabular-nums">
      <span v-if="transaction.amount < 0" class="text-destructive">
        {{ formatCurrency(Math.abs(transaction.amount)) }}
      </span>
      <span v-else class="text-muted-foreground">-</span>
    </td>

    <!-- Inflow -->
    <td class="p-3 text-sm text-right tabular-nums">
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
          title="Edit transaction"
        >
          <EditIcon class="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          @click="$emit('delete', transaction)"
          class="p-1 rounded hover:bg-muted transition-colors"
          title="Delete transaction"
        >
          <TrashIcon class="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckIcon, EditIcon, TrashIcon } from 'lucide-vue-next'
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

const getCategoryName = (categoryId?: string) => {
  if (!categoryId) return 'Uncategorized'
  const category = categoryStore.categories.find(cat => cat.id === categoryId)
  return category?.name || 'Unknown Category'
}
</script>
