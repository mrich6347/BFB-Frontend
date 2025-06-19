<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && close()">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Reconcile Account</DialogTitle>
      </DialogHeader>

      <!-- Step 1: Confirm cleared balance -->
      <div v-if="step === 1" class="space-y-4">
        <div class="text-center space-y-2">
          <p class="text-sm text-muted-foreground">
            Your cleared balance in YNAB is:
          </p>
          <div class="text-2xl font-bold" :class="getBalanceColor(clearedBalance)">
            {{ formatCurrency(clearedBalance) }}
          </div>
        </div>

        <div class="space-y-3">
          <p class="text-sm text-center">
            Is this the balance you see in your bank account?
          </p>

          <div class="flex flex-col gap-3">
            <Button
              @click="confirmBalance"
              class="w-full"
              :disabled="isLoading"
            >
              Yes, that's correct
            </Button>
            <Button
              @click="step = 2"
              variant="outline"
              class="w-full"
              :disabled="isLoading"
            >
              No, let me enter the correct amount
            </Button>
          </div>
        </div>
      </div>

      <!-- Step 2: Enter actual bank balance -->
      <div v-if="step === 2" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">
            What is the actual balance in your bank account?
          </label>
          <FormKit
            type="number"
            v-model="actualBalance"
            step="0.01"
            placeholder="0.00"
            validation="required"
            :classes="{
              input: 'w-full px-3 py-2 border rounded-md bg-background border-input text-center text-lg font-semibold',
              outer: 'space-y-2',
              message: 'text-red-500 text-sm mt-1'
            }"
          />
        </div>

        <div v-if="adjustmentAmount !== 0" class="p-3 bg-muted rounded-md">
          <div class="text-sm text-muted-foreground">Adjustment needed:</div>
          <div class="font-semibold" :class="getBalanceColor(adjustmentAmount)">
            {{ formatCurrency(adjustmentAmount) }}
          </div>
        </div>

        <div class="flex gap-3">
          <Button
            @click="step = 1"
            variant="outline"
            class="flex-1"
            :disabled="isLoading"
          >
            Back
          </Button>
          <Button
            @click="reconcileWithAdjustment"
            class="flex-1"
            :disabled="isLoading || actualBalance === null"
          >
            <LoadingSpinner v-if="isLoading" class="w-4 h-4 mr-2" />
            Reconcile
          </Button>
        </div>
      </div>

      <!-- Success message -->
      <div v-if="step === 3" class="text-center space-y-4">
        <div class="text-green-600">
          <CheckCircle class="w-12 h-12 mx-auto mb-2" />
          <p class="font-semibold">Account Reconciled Successfully!</p>
        </div>
        <Button @click="close" class="w-full">
          Done
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { CheckCircle } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AccountResponse } from '@/types/DTO/account.dto'
import { useAccountOperations } from '@/composables/accounts/useAccountOperations'
import { useTransactionStore } from '@/stores/transaction.store'
import { useToast } from 'vue-toast-notification'

const props = defineProps<{
  isOpen: boolean
  account?: AccountResponse
}>()

const emit = defineEmits<{
  close: []
  reconciled: []
}>()

const { reconcileAccount, isLoading } = useAccountOperations()
const transactionStore = useTransactionStore()
const $toast = useToast()

const step = ref(1)
const actualBalance = ref<number | null>(null)

const clearedBalance = computed(() => {
  return props.account?.cleared_balance || 0
})

const adjustmentAmount = computed(() => {
  if (actualBalance.value === null) return 0
  return actualBalance.value - clearedBalance.value
})

const getBalanceColor = (balance: number) => {
  return balance < 0 ? 'text-destructive' : 'text-foreground'
}

const close = () => {
  step.value = 1
  actualBalance.value = null
  emit('close')
}

const confirmBalance = async () => {
  if (!props.account) return

  try {
    // Reconcile with current cleared balance (no adjustment needed)
    await reconcileAccount(props.account.id, clearedBalance.value)
    step.value = 3
    emit('reconciled')
    $toast.success('Account reconciled successfully')
  } catch (error) {
    $toast.error('Failed to reconcile account')
    console.error('Reconciliation error:', error)
  }
}

const reconcileWithAdjustment = async () => {
  if (!props.account || actualBalance.value === null) return

  try {
    // Ensure actualBalance is a number
    const balanceAsNumber = typeof actualBalance.value === 'string'
      ? parseFloat(actualBalance.value)
      : actualBalance.value

    // Validate the number
    if (isNaN(balanceAsNumber)) {
      $toast.error('Please enter a valid number')
      return
    }

    // Reconcile with adjustment
    await reconcileAccount(props.account.id, balanceAsNumber)
    step.value = 3
    emit('reconciled')
    $toast.success('Account reconciled successfully with adjustment')
  } catch (error) {
    $toast.error('Failed to reconcile account')
    console.error('Reconciliation error:', error)
  }
}

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    step.value = 1
    actualBalance.value = null
  }
})
</script>
