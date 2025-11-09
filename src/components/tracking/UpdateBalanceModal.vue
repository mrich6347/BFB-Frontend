<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Update Balance</DialogTitle>
        <DialogDescription>
          Update the balance for {{ account?.name }}. This will create an adjustment transaction.
        </DialogDescription>
      </DialogHeader>

      <FormKit
        type="form"
        @submit="handleSubmit"
        :actions="false"
        :value="formData"
        validation-visibility="live"
        #default="{ state }"
      >
        <!-- Current Balance Display -->
        <div class="mb-4 p-3 bg-muted rounded-lg">
          <div class="text-sm text-muted-foreground">Current Balance</div>
          <div class="text-lg font-semibold">
            {{ formatCurrency(account?.working_balance || 0) }}
          </div>
        </div>

        <!-- New Balance Input -->
        <FormKit
          type="text"
          name="new_balance"
          label="New Balance"
          :validation-rules="{
            validBalance: validBalanceRule
          }"
          :validation-messages="{
            validBalance: 'Please enter a valid number (e.g., 500, -500, 1,234.56)'
          }"
          validation="required|validBalance"
          placeholder="0.00"
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <!-- Memo Input -->
        <FormKit
          type="text"
          name="memo"
          label="Memo (Optional)"
          placeholder="Balance adjustment reason..."
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
          >
            Cancel
          </button>
          <FormKit
            type="submit"
            :disabled="isLoading || state.valid === false"
            input-class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <span>{{ isLoading ? 'Updating...' : 'Update Balance' }}</span>
          </FormKit>
        </div>
      </FormKit>

    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn-ui'
import type { AccountResponse } from '@/types/DTO/account.dto'
import { formatCurrency } from '@/utils/currencyUtil'
import { parseFormattedNumberToDecimal } from '@/utils/numberFormatUtil'
import { TrackingAccountService } from '@/services/tracking-account.service'
import { useSetAccountBalance } from '@/composables/accounts/account-write/useSetAccountBalance'
import { useToast } from 'vue-toast-notification'

const props = defineProps<{
  isOpen: boolean,
  account?: AccountResponse
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const { setAccountBalance } = useSetAccountBalance()
const toast = useToast()
const isLoading = ref(false)

const formData = computed(() => ({
  new_balance: props.account?.working_balance?.toString() || '0',
  memo: ''
}))

const close = () => {
  emit('close')
}

// Validation rule for balance input
const validBalanceRule = (node: any) => {
  const value = node.value
  if (!value) return false

  try {
    parseFormattedNumberToDecimal(value)
    return true
  } catch {
    return false
  }
}

const handleSubmit = async (data: any) => {
  if (!props.account) return

  try {
    isLoading.value = true

    const newBalance = parseFloat(parseFormattedNumberToDecimal(data.new_balance))
    const currentBalance = props.account.working_balance || 0

    // Check if balance actually changed
    if (Math.abs(newBalance - currentBalance) < 0.01) {
      toast.warning('Balance is already at the specified amount')
      return
    }

    const response = await TrackingAccountService.updateBalance(props.account.id, {
      new_balance: newBalance,
      memo: data.memo || ''
    })

    // Update account in store using the response data
    setAccountBalance(props.account.id, response.account)

    emit('updated')
  } catch (error) {
    console.error('Failed to update balance:', error)
    toast.error('Failed to update balance')
  } finally {
    isLoading.value = false
  }
}
</script>
