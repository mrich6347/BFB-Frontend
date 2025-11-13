<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
      <button @click="$emit('close')" class="p-2">
        <XIcon class="h-5 w-5" />
      </button>
      <h2 class="text-lg font-semibold">Make Payment</h2>
      <div class="w-[60px]"></div>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-auto space-y-4" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">

      <!-- Amount Section (Top) -->
      <div class="px-4 pt-4 pb-6">
        <!-- Large Amount Display -->
        <div class="text-center py-2">
          <input
            ref="amountInputRef"
            v-model="displayAmount"
            @input="handleAmountInput"
            @focus="handleAmountFocus"
            type="text"
            inputmode="decimal"
            placeholder="$0.00"
            class="w-full text-center text-5xl font-bold bg-transparent border-none outline-none text-blue-500"
          />
        </div>
      </div>

      <!-- Form Fields -->
      <div class="px-4 space-y-4">
        <!-- Info Box -->
        <div class="p-3 bg-muted/50 rounded-md border border-border">
          <p class="text-sm text-muted-foreground">
            Funds will be automatically deducted from the <span class="font-medium text-foreground">{{ paymentCategoryName }}</span> category.
          </p>
        </div>

        <!-- Pay From Account -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Pay From</label>
          <button
            @click="showAccountPicker = true"
            class="w-full px-4 py-3 border border-input rounded-md bg-background text-left flex items-center justify-between"
          >
            <span :class="selectedFromAccount ? 'text-foreground' : 'text-muted-foreground'">
              {{ selectedFromAccount?.name || 'Select account...' }}
            </span>
            <ChevronRightIcon class="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <!-- Memo -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Memo (optional)</label>
          <input
            v-model="memo"
            type="text"
            placeholder="Enter memo..."
            class="w-full px-4 py-3 border border-input rounded-md bg-background"
          />
        </div>

        <!-- Save Button -->
        <div class="pt-4">
          <button
            @click="handleSubmit"
            :disabled="!isValid || isLoading"
            class="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            :class="isLoading ? 'animate-pulse' : 'hover:bg-primary/90'"
          >
            {{ isLoading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Account Picker Modal -->
    <Teleport to="body">
      <div
        v-if="showAccountPicker"
        class="fixed inset-0 z-[60] bg-background"
      >
        <div class="h-full flex flex-col">
          <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
            <button @click="showAccountPicker = false" class="p-2">
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <h3 class="text-lg font-semibold">Select Account</h3>
            <button @click="$emit('close')" class="p-2">
              <XIcon class="h-5 w-5" />
            </button>
          </div>

          <div class="flex-1 overflow-auto p-4 space-y-2">
            <button
              v-for="account in cashAccounts"
              :key="account.id"
              @click="selectAccount(account)"
              class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
            >
              <div class="font-medium">{{ account.name }}</div>
              <div class="text-sm text-muted-foreground">{{ formatCurrency(account.account_balance) }}</div>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { XIcon, ChevronRightIcon, ChevronLeftIcon } from 'lucide-vue-next'
import { useAccountStore } from '@/stores/account.store'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AccountResponse } from '@/types/DTO/account.dto'

const props = defineProps<{
  accountId: string
  accountName: string
}>()

const emit = defineEmits<{
  close: []
  save: [amount: number, fromAccountId: string, memo?: string]
}>()

const accountStore = useAccountStore()

const selectedFromAccount = ref<AccountResponse | null>(null)
const amountNumber = ref<number | null>(null)
const memo = ref('')
const showAccountPicker = ref(false)
const isLoading = ref(false)

// Amount input handling
const amountInputRef = ref<HTMLInputElement | null>(null)
const internalAmountValue = ref('000') // Store as cents (e.g., "000" = $0.00, "1234" = $12.34)

// Format the internal value (cents) as a currency display string
const formatAmountAsCurrency = (centsString: string): string => {
  const padded = centsString.padStart(3, '0')
  const dollars = padded.slice(0, -2)
  const cents = padded.slice(-2)
  const dollarsFormatted = dollars.replace(/^0+/, '') || '0'
  return `$${dollarsFormatted}.${cents}`
}

const displayAmount = computed({
  get: () => formatAmountAsCurrency(internalAmountValue.value),
  set: () => {} // Handled by handleAmountInput
})

const handleAmountInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')

  if (digits.length === 0) {
    internalAmountValue.value = '000'
  } else {
    const limitedDigits = digits.slice(-10)
    internalAmountValue.value = limitedDigits.padStart(3, '0')
  }

  // Update the display
  input.value = formatAmountAsCurrency(internalAmountValue.value)

  // Update the amount ref
  const cents = parseInt(internalAmountValue.value, 10)
  amountNumber.value = cents / 100

  // Move cursor to end
  setTimeout(() => {
    input.setSelectionRange(input.value.length, input.value.length)
  }, 0)
}

const handleAmountFocus = () => {
  setTimeout(() => {
    if (amountInputRef.value) {
      const length = amountInputRef.value.value.length
      amountInputRef.value.setSelectionRange(length, length)
    }
  }, 0)
}

const cashAccounts = computed(() => accountStore.getAccountsByType('CASH'))

// Get the credit card account to populate the cleared balance
const creditCardAccount = computed(() => {
  return accountStore.accounts.find(acc => acc.id === props.accountId)
})

// Initialize amount with cleared balance on mount
onMounted(() => {
  if (creditCardAccount.value) {
    // Credit card cleared balance is negative (money owed), so we take absolute value for payment
    const clearedBalance = Math.abs(creditCardAccount.value.cleared_balance)
    amountNumber.value = clearedBalance

    // Update internal amount value to match
    const cents = Math.round(clearedBalance * 100)
    internalAmountValue.value = cents.toString().padStart(3, '0')
  }

  // Auto-focus amount input
  setTimeout(() => {
    if (amountInputRef.value) {
      amountInputRef.value.focus()
    }
  }, 100)
})

const paymentCategoryName = computed(() => {
  return `${props.accountName} Payment`
})

const isValid = computed(() => {
  return selectedFromAccount.value && amountNumber.value !== null && amountNumber.value > 0
})

const selectAccount = (account: AccountResponse) => {
  selectedFromAccount.value = account
  showAccountPicker.value = false
}

const handleSubmit = async () => {
  if (!isValid.value || !selectedFromAccount.value || isLoading.value) return

  isLoading.value = true

  try {
    emit('save', amountNumber.value!, selectedFromAccount.value.id, memo.value || undefined)

    // Keep loading state until parent closes the form
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoading.value = false
  }
}
</script>

