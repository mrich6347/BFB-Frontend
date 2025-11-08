<template>
  <tr
    class="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer select-none"
    :class="[
      transaction.is_reconciled ? 'opacity-60 bg-muted/10' : '',
      props.isSelected ? 'bg-primary/10 ring-1 ring-primary/40 hover:bg-primary/10' : ''
    ]"
    @click="handleRowClick"
    @dblclick="handleRowDoubleClick"
  >
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
    <td class="p-3 text-sm text-muted-foreground w-48 max-w-48">
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
    <td class="p-3 text-sm text-right tabular-nums w-28">
      <span v-if="transaction.amount < 0" class="text-destructive">
        {{ formatCurrency(Math.abs(transaction.amount)) }}
      </span>
      <span v-else class="text-muted-foreground">-</span>
    </td>

    <!-- Inflow -->
    <td class="p-3 text-sm text-right tabular-nums w-28">
      <span v-if="transaction.amount > 0" class="text-green-600">
        {{ formatCurrency(transaction.amount) }}
      </span>
      <span v-else class="text-muted-foreground">-</span>
    </td>

    <!-- Cleared Status -->
    <td class="p-3">
      <div class="flex items-center gap-1">
        <button
          @click.stop="$emit('toggle-cleared', transaction)"
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
  </tr>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDownIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import { useCategoryStore } from '@/stores/category.store'
import type { TransactionResponse } from '@/types/DTO/transaction.dto'

const props = defineProps<{
  transaction: TransactionResponse
  isSelected?: boolean
}>()

const emit = defineEmits<{
  edit: [transaction: TransactionResponse]
  select: [{ transaction: TransactionResponse; shiftKey: boolean; metaKey: boolean }]
  'toggle-cleared': [transaction: TransactionResponse]
}>()

const categoryStore = useCategoryStore()

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

const handleRowClick = (event: MouseEvent) => {
  emit('select', {
    transaction: props.transaction,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey || event.ctrlKey
  })
}

const handleRowDoubleClick = () => {
  emit('edit', props.transaction)
}
</script>
