<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && close()">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Close Account</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <div class="text-sm text-foreground">
          Before you can close this account, the balance will have to be zeroed out.
          An adjustment transaction will be created for
          <span class="font-semibold">{{ formatCurrency(Math.abs(account?.working_balance || 0)) }}</span>.
        </div>

        <div class="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span class="text-white text-xs font-bold">i</span>
            </div>
            <div class="text-sm text-blue-800 dark:text-blue-200">
              The money in this account will be removed from your plan.
              If you would like to keep it in your plan, you can transfer it
              to another account before closing this one.
            </div>
          </div>
        </div>
        

        <div class="flex gap-3 pt-2">
          <Button
            @click="close"
            variant="outline"
            class="flex-1"
            :disabled="isLoading"
          >
            Cancel
          </Button>
          <Button
            @click="handleCloseAccount"
            class="flex-1"
            :disabled="isLoading"
          >
            <LoadingSpinner v-if="isLoading" class="w-4 h-4 mr-2" />
            Adjust Balance & Close
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AccountResponse } from '@/types/DTO/account.dto'
import { useCloseAccount } from '@/composables/accounts/account-write/useCloseAccount'
import { useFetchAllCategoryData } from '@/composables/categories/category-read/useFetchAllCategoryData'
import { useToast } from 'vue-toast-notification'

const props = defineProps<{
  isOpen: boolean
  account?: AccountResponse
}>()

const emit = defineEmits<{
  close: []
  closed: []
}>()

const { closeAccount, isLoading } = useCloseAccount()
const { fetchAllCategoryData } = useFetchAllCategoryData()
const $toast = useToast()

const handleCloseAccount = async () => {
  if (!props.account) return

  try {
    const wasCredit = props.account.account_type === 'CREDIT'
    await closeAccount(props.account.id)

    // If this was a credit card account, refresh category data to remove the payment category
    if (wasCredit) {
      await fetchAllCategoryData(props.account.budget_id)
    }

    $toast.success('Account closed successfully')
    emit('closed')
    close()
  } catch (error) {
    console.error('Failed to close account:', error)
    $toast.error('Failed to close account')
  }
}

const close = () => {
  emit('close')
}
</script>
