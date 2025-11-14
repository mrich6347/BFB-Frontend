<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Mobile Transaction Flow -->
    <MobileTransactionFlow
      ref="transactionFlowRef"
      @save-transaction="handleSaveTransaction"
      @save-transfer="handleSaveTransfer"
      @save-payment="handleSavePayment"
      @update-balance="handleUpdateBalance"
      @category-balance-change="handleCategoryBalanceChange"
    />

    <!-- Mobile Category Balance Toast -->
    <MobileCategoryBalanceToast
      ref="categoryBalanceToastRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toast-notification'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import { useMakeCreditCardPayment } from '@/composables/accounts/account-write/useMakeCreditCardPayment'
import { TrackingAccountService } from '@/services/tracking-account.service'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import MobileTransactionFlow from '@/components/mobile/MobileTransactionFlow.vue'
import MobileCategoryBalanceToast from '@/components/mobile/MobileCategoryBalanceToast.vue'

const { createTransaction } = useTransactionOperations()
const { makeCreditCardPayment } = useMakeCreditCardPayment()
const $toast = useToast()

const transactionFlowRef = ref<InstanceType<typeof MobileTransactionFlow> | null>(null)
const categoryBalanceToastRef = ref<InstanceType<typeof MobileCategoryBalanceToast> | null>(null)

// Open the transaction flow immediately on mount
onMounted(() => {
  transactionFlowRef.value?.openFlow()
})

const handleSaveTransaction = async (data: CreateTransactionDto) => {
  try {
    await createTransaction(data)
  } catch (error) {
    console.error('Failed to create transaction:', error)
    $toast.error('Failed to create transaction')
  }
}

const handleSaveTransfer = async (data: CreateTransactionDto) => {
  try {
    await createTransaction(data)
  } catch (error) {
    console.error('Failed to create transfer:', error)
    $toast.error('Failed to create transfer')
  }
}

const handleSavePayment = async (creditCardAccountId: string, amount: number, fromAccountId: string, memo?: string) => {
  try {
    await makeCreditCardPayment(creditCardAccountId, amount, fromAccountId, memo)
  } catch (error) {
    console.error('Failed to create payment:', error)
    $toast.error('Failed to create payment')
  }
}

const handleUpdateBalance = async (accountId: string, newBalance: number) => {
  try {
    await TrackingAccountService.updateBalance(accountId, {
      new_balance: newBalance,
      memo: 'Balance update'
    })
  } catch (error) {
    console.error('Failed to update balance:', error)
    $toast.error('Failed to update balance')
  }
}

const handleCategoryBalanceChange = (categoryName: string, oldBalance: number, newBalance: number) => {
  categoryBalanceToastRef.value?.show(categoryName, oldBalance, newBalance)
}
</script>

