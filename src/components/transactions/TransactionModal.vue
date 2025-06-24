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
          :validation-messages="{
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
          type="select"
          name="payee"
          label="Payee"
          :options="payeeOptions"
          placeholder="Select or enter payee"
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
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import { useCategoryStore } from '@/stores/category.store'
import { useAccountStore } from '@/stores/account.store'
import { useGetTransferOptions } from '@/composables/accounts/account-read/useGetTransferOptions'
import { TransferService } from '@/services/transfer.service'
import type { TransactionResponse, CreateTransactionDto, UpdateTransactionDto } from '@/types/DTO/transaction.dto'
import type { AccountResponse } from '@/types/DTO/account.dto'

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
const accountStore = useAccountStore()
const { getTransferOptions } = useGetTransferOptions()
const amountType = ref<'inflow' | 'outflow'>('outflow')
const payeeField = ref(null)
const transferOptions = ref<AccountResponse[]>([])
const selectedPayee = ref('')

// Prevent future dates - max date is today
const maxDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const payeeOptions = computed(() => {
  const options = []

  // Add transfer options at the top
  if (transferOptions.value.length > 0) {
    options.push({ label: '--- Transfers ---', value: '', disabled: true })
    transferOptions.value.forEach(account => {
      options.push({
        label: TransferService.formatTransferPayee(account.name),
        value: TransferService.formatTransferPayee(account.name)
      })
    })
    options.push({ label: '--- Payees ---', value: '', disabled: true })
  }

  // Add regular payee option (allow custom input)
  options.push({ label: 'Enter custom payee...', value: 'custom' })

  return options
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

const isTransferTransaction = computed(() => {
  return TransferService.isTransferPayee(selectedPayee.value)
})

const shouldShowCategory = computed(() => {
  // Always show category field - transfers from cash accounts require categories
  return true
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

// Load transfer options when component mounts
onMounted(async () => {
  try {
    transferOptions.value = await getTransferOptions(props.accountId)
  } catch (error) {
    console.error('Failed to load transfer options:', error)
    // Don't throw - just continue without transfer options
  }
})

// Set amount type based on transaction amount
watch(() => props.transaction, (transaction) => {
  if (transaction) {
    amountType.value = transaction.amount < 0 ? 'outflow' : 'inflow'
  }
}, { immediate: true })

// Watch for payee changes to update selectedPayee
watch(() => selectedPayee.value, (newPayee) => {
  // For transfers, force outflow type
  if (TransferService.isTransferPayee(newPayee)) {
    amountType.value = 'outflow'
  }
})

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
  // Update selectedPayee for transfer detection
  selectedPayee.value = data.payee

  const isTransfer = TransferService.isTransferPayee(data.payee)

  // For transfers, validate that category is selected
  if (isTransfer && !data.category_id) {
    // This should be caught by form validation, but just in case
    throw new Error('Transfer transactions require a category selection')
  }

  // For transfers, always use outflow (negative amount)
  const amount = (isTransfer || amountType.value === 'outflow')
    ? -Math.abs(data.amount)
    : Math.abs(data.amount)

  const transactionData = {
    ...data,
    amount,
    account_id: props.accountId,
    category_id: data.category_id || undefined
  }

  emit('save', transactionData)
}
</script>
