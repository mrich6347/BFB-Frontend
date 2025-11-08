<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Transfer Money</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Transfer To Account -->
        <AccountSelector
          ref="accountSelector"
          v-model="selectedTargetAccountId"
          :available-accounts="transferOptions"
          label="Transfer To"
          placeholder="Select account..."
          :error="accountError"
          @select="handleAccountSelect"
        />

        <!-- Category (only for transfers to tracking accounts) -->
        <CategorySelector
          v-if="isTransferToTracking"
          ref="categorySelector"
          v-model="selectedCategoryId"
          :available-categories="availableCategories"
          label="Category"
          placeholder="Select category..."
          :include-ready-to-assign="true"
          :show-group-headers="false"
          :error="categoryError"
          @select="handleCategorySelect"
        />

        <!-- Memo -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Memo</label>
          <input
            v-model="memo"
            type="text"
            placeholder="Enter memo (optional)"
            class="w-full px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        <!-- Amount -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Amount</label>
          <input
            ref="amountInput"
            v-model="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            class="w-full px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <div v-if="amountError" class="text-sm text-red-500">{{ amountError }}</div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button type="button" @click="handleSubmit" :disabled="!isFormValid || props.isSubmitting">
            <span v-if="props.isSubmitting">Transferring...</span>
            <span v-else>Transfer</span>
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import { useCategoryStore } from '@/stores/category.store'
import { useGetTransferOptions } from '@/composables/accounts/account-read/useGetTransferOptions'
import { TransferService } from '@/services/transfer.service'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import type { AccountResponse } from '@/types/DTO/account.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import AccountSelector from '@/components/accounts/AccountSelector.vue'
import CategorySelector from '@/components/categories/CategorySelector.vue'

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

// Refs
const accountSelector = ref<InstanceType<typeof AccountSelector>>()
const categorySelector = ref<InstanceType<typeof CategorySelector>>()
const amountInput = ref<HTMLInputElement>()

// Form state
const transferOptions = ref<AccountResponse[]>([])
const selectedTargetAccountId = ref<string>('')
const selectedCategoryId = ref<string>('')
const memo = ref('')
const amount = ref<number | null>(null)

// Validation errors
const accountError = ref('')
const categoryError = ref('')
const amountError = ref('')

// Filter out credit card payment categories
const isCreditCardPaymentCategory = (categoryId: string) => {
  const category = categoryStore.categories.find(c => c.id === categoryId)
  if (!category) return false

  const categoryGroup = categoryStore.getCategoryGroupById(category.category_group_id)
  return categoryGroup?.name === 'Credit Card Payments' && categoryGroup?.is_system_group === true
}

const availableCategories = computed(() => {
  return categoryStore.categories.filter(category => !isCreditCardPaymentCategory(category.id))
})

const selectedTargetAccount = computed(() => {
  return transferOptions.value.find(acc => acc.id === selectedTargetAccountId.value)
})

const isTransferToTracking = computed(() => {
  return selectedTargetAccount.value?.account_type === 'TRACKING'
})

const isFormValid = computed(() => {
  if (!selectedTargetAccountId.value) return false
  if (!amount.value || amount.value <= 0) return false
  if (isTransferToTracking.value && !selectedCategoryId.value) return false
  return true
})

// Handlers
const handleAccountSelect = (account: AccountResponse | null) => {
  accountError.value = ''
  if (account) {
    selectedTargetAccountId.value = account.id

    // Focus the next field based on account type
    nextTick(() => {
      setTimeout(() => {
        if (account.account_type === 'TRACKING') {
          // If transferring to tracking account, focus category selector
          categorySelector.value?.focus()
        } else {
          // Otherwise, focus amount input
          amountInput.value?.focus()
        }
      }, 50)
    })
  }
}

const handleCategorySelect = (category: CategoryResponse | null) => {
  categoryError.value = ''
  if (category) {
    selectedCategoryId.value = category.id
  } else if (selectedCategoryId.value === 'ready-to-assign') {
    // Keep ready-to-assign selection
  }

  // Focus amount input after selecting category
  nextTick(() => {
    setTimeout(() => {
      amountInput.value?.focus()
    }, 50)
  })
}

// Load transfer options when component mounts
onMounted(async () => {
  try {
    transferOptions.value = await getTransferOptions(props.accountId)
  } catch (error) {
    console.error('Failed to load transfer options:', error)
  }
})

const validateForm = () => {
  let isValid = true

  if (!selectedTargetAccountId.value) {
    accountError.value = 'Please select a transfer account'
    isValid = false
  }

  if (!amount.value || amount.value <= 0) {
    amountError.value = 'Please enter a valid amount'
    isValid = false
  }

  if (isTransferToTracking.value && !selectedCategoryId.value) {
    categoryError.value = 'Please select a category for tracking account transfers'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  // Clear previous errors
  accountError.value = ''
  categoryError.value = ''
  amountError.value = ''

  // Validate form
  if (!validateForm()) {
    return
  }

  const targetAccount = transferOptions.value.find(acc => acc.id === selectedTargetAccountId.value)
  if (!targetAccount) {
    throw new Error('Target account not found')
  }

  // Create transfer payee format
  const transferPayee = TransferService.formatTransferPayee(targetAccount.name)

  // Set date to today
  const date = new Date().toISOString().split('T')[0]

  // Amount is always negative (outflow) for the source account
  const transferAmount = -Math.abs(amount.value!)

  // Determine if target is tracking account
  const isTargetTracking = targetAccount.account_type === 'TRACKING'

  const transactionData: CreateTransactionDto = {
    date,
    amount: transferAmount,
    account_id: props.accountId,
    payee: transferPayee,
    memo: memo.value || undefined,
    is_cleared: false,
    // For cash-to-cash transfers, no category needed
    // For cash-to-tracking transfers, category is required
    category_id: isTargetTracking ? (selectedCategoryId.value || undefined) : undefined
  }

  emit('save', transactionData)
}

// Watch for changes in form to reset when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Focus the account selector when modal opens
    nextTick(() => {
      setTimeout(() => {
        accountSelector.value?.focus()
      }, 50)
    })
  } else {
    // Reset form when modal closes
    selectedTargetAccountId.value = ''
    selectedCategoryId.value = ''
    memo.value = ''
    amount.value = null
    accountError.value = ''
    categoryError.value = ''
    amountError.value = ''
  }
})
</script>

