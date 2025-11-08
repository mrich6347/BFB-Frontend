<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Transfer Money</DialogTitle>
      </DialogHeader>

      <FormKit
        type="form"
        @submit="handleSubmit"
        :actions="false"
        :value="formData"
        validation-visibility="live"
        #default="{ state }"
      >
        <!-- Transfer To Account -->
        <FormKit
          type="select"
          name="target_account_id"
          label="Transfer To"
          v-model="selectedTargetAccountId"
          :options="targetAccountOptions"
          placeholder="Select account"
          validation="required"
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <!-- Category (only for transfers to tracking accounts) -->
        <FormKit
          v-if="isTransferToTracking"
          type="select"
          name="category_id"
          label="Category"
          :options="categoryOptions"
          placeholder="Select a category"
          validation="required"
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
            <span v-if="props.isSubmitting">Transferring...</span>
            <span v-else>Transfer</span>
          </Button>
        </div>
      </FormKit>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import { useCategoryStore } from '@/stores/category.store'
import { useGetTransferOptions } from '@/composables/accounts/account-read/useGetTransferOptions'
import { TransferService } from '@/services/transfer.service'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import type { AccountResponse } from '@/types/DTO/account.dto'

const props = defineProps<{
  isOpen: boolean
  accountId: string
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateTransactionDto]
}>()

const categoryStore = useCategoryStore()
const { getTransferOptions } = useGetTransferOptions()
const transferOptions = ref<AccountResponse[]>([])
const selectedTargetAccountId = ref('')
const currentFormData = ref({
  target_account_id: '',
  category_id: '',
  memo: '',
  amount: 0,
  is_cleared: false
})

const targetAccountOptions = computed(() => {
  if (transferOptions.value.length === 0) {
    return []
  }

  return transferOptions.value.map(account => ({
    label: account.name,
    value: account.id
  }))
})

const categoryOptions = computed(() => {
  return [
    { label: 'Ready to Assign', value: 'ready-to-assign' },
    ...categoryStore.categories.map(category => ({
      label: category.name,
      value: category.id
    }))
  ]
})

const selectedTargetAccount = computed(() => {
  return transferOptions.value.find(acc => acc.id === selectedTargetAccountId.value)
})

const isTransferToTracking = computed(() => {
  return selectedTargetAccount.value?.account_type === 'TRACKING'
})

const formData = computed(() => currentFormData.value)

// Load transfer options when component mounts
onMounted(async () => {
  try {
    transferOptions.value = await getTransferOptions(props.accountId)
  } catch (error) {
    console.error('Failed to load transfer options:', error)
  }
})

const handleSubmit = (data: any) => {
  // Update selected target account ID for reactivity
  selectedTargetAccountId.value = data.target_account_id

  const targetAccount = transferOptions.value.find(acc => acc.id === data.target_account_id)
  if (!targetAccount) {
    throw new Error('Target account not found')
  }

  // Create transfer payee format
  const transferPayee = TransferService.formatTransferPayee(targetAccount.name)

  // Set date to today
  const date = new Date().toISOString().split('T')[0]

  // Amount is always negative (outflow) for the source account
  const amount = -Math.abs(data.amount)

  // Determine if target is tracking account
  const isTargetTracking = targetAccount.account_type === 'TRACKING'

  const transactionData: CreateTransactionDto = {
    date,
    amount,
    account_id: props.accountId,
    payee: transferPayee,
    memo: data.memo || undefined,
    is_cleared: data.is_cleared ?? false,
    // For cash-to-cash transfers, no category needed
    // For cash-to-tracking transfers, category is required
    category_id: isTargetTracking ? (data.category_id || undefined) : undefined
  }

  emit('save', transactionData)
}

// Watch for changes in form to update selected target account
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    // Reset form when modal closes
    selectedTargetAccountId.value = ''
    currentFormData.value = {
      target_account_id: '',
      category_id: '',
      memo: '',
      amount: 0,
      is_cleared: false
    }
  }
})
</script>

