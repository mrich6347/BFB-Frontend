<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Make a Payment</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Informational Text -->
        <div class="p-3 bg-muted/50 rounded-md border border-border">
          <p class="text-sm text-muted-foreground">
            Funds will be automatically deducted from the <span class="font-medium text-foreground">{{ paymentCategoryName }}</span> category.
          </p>
        </div>

        <!-- Pay From Account -->
        <AccountSelector
          ref="accountSelector"
          v-model="selectedFromAccountId"
          :available-accounts="cashAccounts"
          label="Pay From"
          placeholder="Select account..."
          :error="accountError"
          @select="handleAccountSelect"
        />

        <!-- Amount -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Payment Amount</label>
          <input
            v-model="amount"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            class="w-full px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            @keydown.enter="handleSubmit"
          />
          <div v-if="amountError" class="text-sm text-red-500">{{ amountError }}</div>
        </div>

        <!-- Memo (optional) -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Memo (optional)</label>
          <input
            v-model="memo"
            type="text"
            placeholder="Enter memo..."
            class="w-full px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            @keydown.enter="handleSubmit"
          />
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button
            ref="submitButton"
            type="button"
            @click="handleSubmit"
            @keydown.enter="handleSubmit"
            :disabled="!isFormValid || props.isSubmitting"
          >
            <span v-if="props.isSubmitting">Processing...</span>
            <span v-else>Make Payment</span>
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import AccountSelector from '@/components/accounts/AccountSelector.vue'
import { useAccountStore } from '@/stores/account.store'
import type { AccountResponse } from '@/types/DTO/account.dto'

const props = defineProps<{
  isOpen: boolean
  accountName: string
  defaultAmount?: number
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [amount: number, fromAccountId: string, memo?: string]
}>()

const accountStore = useAccountStore()

// Form state
const amount = ref<string>('')
const memo = ref('')
const selectedFromAccountId = ref<string | null>(null)
const amountError = ref('')
const accountError = ref('')
const submitButton = ref<InstanceType<typeof Button> | null>(null)
const accountSelector = ref<InstanceType<typeof AccountSelector> | null>(null)

// Computed
const paymentCategoryName = computed(() => `${props.accountName} Payment`)

// Get only cash accounts for payment source
const cashAccounts = computed(() => {
  return accountStore.accounts.filter(acc => acc.account_type === 'CASH' && acc.is_active)
})

const isFormValid = computed(() => {
  const amountNum = parseFloat(amount.value)
  return amount.value && !isNaN(amountNum) && amountNum > 0 && selectedFromAccountId.value !== null
})

// Validation
const validateAmount = () => {
  amountError.value = ''

  const amountNum = parseFloat(amount.value)
  if (!amount.value || isNaN(amountNum) || amountNum <= 0) {
    amountError.value = 'Please enter a valid payment amount'
    return false
  }

  return true
}

const validateAccount = () => {
  accountError.value = ''

  if (!selectedFromAccountId.value) {
    accountError.value = 'Please select an account to pay from'
    return false
  }

  return true
}

// Handlers
const handleAccountSelect = () => {
  accountError.value = ''

  // Focus the submit button after account selection so user can hit enter
  nextTick(() => {
    setTimeout(() => {
      submitButton.value?.$el?.focus()
    }, 50)
  })
}

const handleSubmit = () => {
  // Clear previous errors
  amountError.value = ''
  accountError.value = ''

  // Validate form
  if (!validateAccount() || !validateAmount()) {
    return
  }

  const amountNum = parseFloat(amount.value)
  emit('save', amountNum, selectedFromAccountId.value!, memo.value || undefined)
}

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Set default amount if provided (e.g., cleared balance)
    // Format to 2 decimal places as a string to preserve trailing zeros
    amount.value = props.defaultAmount ? Math.abs(props.defaultAmount).toFixed(2) : ''
    memo.value = ''
    selectedFromAccountId.value = null
    amountError.value = ''
    accountError.value = ''

    // Focus the account selector with a small delay
    nextTick(() => {
      setTimeout(() => {
        accountSelector.value?.focus()
      }, 50)
    })
  }
})
</script>

