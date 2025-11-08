<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
      <button @click="$emit('close')" class="p-2">
        <XIcon class="h-5 w-5" />
      </button>
      <h2 class="text-lg font-semibold">Make Payment</h2>
      <button
        @click="handleSubmit"
        :disabled="!isValid"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
      >
        Save
      </button>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-auto p-4 space-y-4">
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
          type="number"
          inputmode="decimal"
          step="0.01"
          min="0.01"
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
    </div>

    <!-- Account Picker Modal -->
    <Teleport to="body">
      <div
        v-if="showAccountPicker"
        class="fixed inset-0 z-[60] bg-background"
      >
        <div class="h-full flex flex-col">
          <div class="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
            <button @click="showAccountPicker = false" class="p-2">
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <h3 class="text-lg font-semibold">Select Account</h3>
            <div class="w-10"></div>
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
import { ref, computed } from 'vue'
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
const amount = ref<number | null>(null)
const memo = ref('')
const showAccountPicker = ref(false)

const cashAccounts = computed(() => accountStore.getAccountsByType('CASH'))

const paymentCategoryName = computed(() => {
  return `${props.accountName} Payment`
})

const isValid = computed(() => {
  return selectedFromAccount.value && amount.value && amount.value > 0
})

const selectAccount = (account: AccountResponse) => {
  selectedFromAccount.value = account
  showAccountPicker.value = false
}

const handleSubmit = () => {
  if (!isValid.value || !selectedFromAccount.value) return

  emit('save', amount.value!, selectedFromAccount.value.id, memo.value || undefined)
}
</script>

