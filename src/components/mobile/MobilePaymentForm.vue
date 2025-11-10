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
    <div class="flex-1 overflow-auto p-4 space-y-4" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">

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

      <!-- Amount -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Amount</label>
        <input
          v-model="amount"
          type="text"
          inputmode="decimal"
          placeholder="0.00"
          class="w-full px-4 py-3 border border-input rounded-md bg-background text-lg"
        />
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
const amount = ref<string>('')
const memo = ref('')
const showAccountPicker = ref(false)
const isLoading = ref(false)

const cashAccounts = computed(() => accountStore.getAccountsByType('CASH'))

// Get the credit card account to populate the cleared balance
const creditCardAccount = computed(() => {
  return accountStore.accounts.find(acc => acc.id === props.accountId)
})

// Initialize amount with cleared balance on mount
onMounted(() => {
  if (creditCardAccount.value) {
    // Credit card cleared balance is negative (money owed), so we take absolute value for payment
    amount.value = Math.abs(creditCardAccount.value.cleared_balance).toFixed(2)
  }
})

const paymentCategoryName = computed(() => {
  return `${props.accountName} Payment`
})

const isValid = computed(() => {
  const amountNum = parseFloat(amount.value)
  return selectedFromAccount.value && amount.value && !isNaN(amountNum) && amountNum > 0
})

const selectAccount = (account: AccountResponse) => {
  selectedFromAccount.value = account
  showAccountPicker.value = false
}

const handleSubmit = async () => {
  if (!isValid.value || !selectedFromAccount.value || isLoading.value) return

  isLoading.value = true

  try {
    const amountNum = parseFloat(amount.value)
    emit('save', amountNum, selectedFromAccount.value.id, memo.value || undefined)

    // Keep loading state until parent closes the form
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoading.value = false
  }
}
</script>

