<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ transaction ? 'Edit Transaction' : 'Add Transaction' }}</DialogTitle>
      </DialogHeader>

      <FormKit
        type="form"
        @submit="handleSubmit"
        :actions="false"
        :value="formData"
        validation-visibility="live"
        #default="{ state }"
      >
        <!-- Category -->
        <FormKit
          type="select"
          name="category_id"
          label="Category"
          :options="categoryOptions"
          placeholder="Select a category"
          :validation="isTransferTransaction ? 'required' : ''"
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <!-- Memo -->
        <FormKit
          type="text"
          name="memo"
          label="Memo"
          placeholder="Enter memo (optional)"
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <!-- Amount Type Toggle -->
        <div class="mb-4">
          <label class="text-sm font-medium text-foreground mb-2 block">Transaction Type</label>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="outline"
              :class="amountType === 'outflow' ? 'bg-destructive text-destructive-foreground' : ''"
              @click="amountType = 'outflow'"
            >
              Outflow
            </Button>
            <Button
              type="button"
              variant="outline"
              :class="amountType === 'inflow' ? 'bg-green-600 text-white' : ''"
              @click="amountType = 'inflow'"
            >
              Inflow
            </Button>
          </div>
        </div>

        <!-- Amount -->
        <FormKit
          type="number"
          name="amount"
          label="Amount"
          validation="required|min:0.01"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <!-- Cleared Status -->
        <FormKit
          type="checkbox"
          name="is_cleared"
          label="Mark as cleared"
          :classes="{
            input: 'mr-2',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            wrapper: 'flex items-center'
          }"
        />

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button type="submit" :disabled="!state.valid || props.isSubmitting">
            <span v-if="props.isSubmitting">{{ transaction ? 'Updating...' : 'Adding...' }}</span>
            <span v-else>{{ transaction ? 'Update' : 'Add' }} Transaction</span>
          </Button>
        </div>
      </FormKit>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import { useCategoryStore } from '@/stores/category.store'
import type { TransactionResponse, CreateTransactionDto, UpdateTransactionDto } from '@/types/DTO/transaction.dto'

const props = defineProps<{
  isOpen: boolean
  transaction?: TransactionResponse | null
  accountId: string
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateTransactionDto | UpdateTransactionDto]
}>()

const categoryStore = useCategoryStore()
const amountType = ref<'inflow' | 'outflow'>('outflow')

const categoryOptions = computed(() => {
  return [
    { label: 'Uncategorized', value: '' },
    { label: 'Ready to Assign', value: 'ready-to-assign' },
    ...categoryStore.categories.map(category => ({
      label: category.name,
      value: category.id
    }))
  ]
})

const formData = computed(() => {
  if (props.transaction) {
    return {
      category_id: props.transaction.category_id === null ? 'ready-to-assign' : (props.transaction.category_id || ''),
      memo: props.transaction.memo || '',
      amount: Math.abs(props.transaction.amount),
      is_cleared: props.transaction.is_cleared
    }
  }

  return {
    category_id: '',
    memo: '',
    amount: 0,
    is_cleared: false
  }
})

// Set amount type based on transaction amount
watch(() => props.transaction, (transaction) => {
  if (transaction) {
    amountType.value = transaction.amount < 0 ? 'outflow' : 'inflow'
  }
}, { immediate: true })

const handleSubmit = (data: any) => {
  // Regular transactions use the selected amount type
  const amount = amountType.value === 'outflow'
    ? -Math.abs(data.amount)
    : Math.abs(data.amount)

  // Set date: use existing transaction's date if editing, otherwise use today
  const date = props.transaction
    ? props.transaction.date
    : new Date().toISOString().split('T')[0]

  const transactionData = {
    ...data,
    date,
    amount,
    account_id: props.accountId,
    category_id: data.category_id || undefined,
    payee: undefined // No payee for regular transactions
  }

  emit('save', transactionData)
}
</script>
