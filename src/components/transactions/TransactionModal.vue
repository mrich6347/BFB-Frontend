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
        <!-- Date -->
        <FormKit
          type="date"
          name="date"
          label="Date"
          :validation="[['required'], ['date_max', maxDate]]"
          validation-messages="{
            date_max: 'Future dates are not allowed'
          }"
          validation-visibility="live"
          :max="maxDate"
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <!-- Payee -->
        <FormKit
          type="text"
          name="payee"
          label="Payee"
          placeholder="Enter payee name"
          ref="payeeField"
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <!-- Category -->
        <FormKit
          type="select"
          name="category_id"
          label="Category"
          :options="categoryOptions"
          placeholder="Select a category"
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
              :class="{ 'bg-destructive text-destructive-foreground': amountType === 'outflow' }"
              @click="amountType = 'outflow'"
            >
              Outflow
            </Button>
            <Button
              type="button"
              variant="outline"
              :class="{ 'bg-green-600 text-white': amountType === 'inflow' }"
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
          <Button type="submit" :disabled="!state.valid">
            {{ transaction ? 'Update' : 'Add' }} Transaction
          </Button>
        </div>
      </FormKit>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import { useCategoryStore } from '@/stores/category.store'
import type { TransactionResponse, CreateTransactionDto, UpdateTransactionDto } from '@/types/DTO/transaction.dto'

const props = defineProps<{
  isOpen: boolean
  transaction?: TransactionResponse | null
  accountId: string
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateTransactionDto | UpdateTransactionDto]
}>()

const categoryStore = useCategoryStore()
const amountType = ref<'inflow' | 'outflow'>('outflow')
const payeeField = ref(null)

// Prevent future dates - max date is today
const maxDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

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
      date: props.transaction.date,
      payee: props.transaction.payee || '',
      category_id: props.transaction.category_id === null ? 'ready-to-assign' : (props.transaction.category_id || ''),
      memo: props.transaction.memo || '',
      amount: Math.abs(props.transaction.amount),
      is_cleared: props.transaction.is_cleared
    }
  }

  return {
    date: new Date().toISOString().split('T')[0],
    payee: '',
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

// Focus payee field when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      // Find the payee input field and focus it
      const payeeInput = document.querySelector('input[name="payee"]') as HTMLInputElement
      if (payeeInput) {
        payeeInput.focus()
      }
    })
  }
})

const handleSubmit = (data: any) => {
  const amount = amountType.value === 'outflow' ? -Math.abs(data.amount) : Math.abs(data.amount)

  const transactionData = {
    ...data,
    amount,
    account_id: props.accountId,
    category_id: data.category_id || undefined
  }

  emit('save', transactionData)
}
</script>
