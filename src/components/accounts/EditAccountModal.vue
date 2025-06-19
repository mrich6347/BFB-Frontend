<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Account</DialogTitle>
      </DialogHeader>

      <AccountForm
        :isLoading="isLoading"
        :budgetId="account?.budget_id || ''"
        mode="edit"
        :initialValues="initialValues"
        @submit="handleFormSubmit"
        @cancel="close"
      />

    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccountOperations } from '@/composables/accounts/useAccountOperations'
import type { UpdateAccountDto, AccountResponse } from '@/types/DTO/account.dto'
import AccountForm from './forms/AccountForm.vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import { useToast } from 'vue-toast-notification'

const props = defineProps<{
  isOpen: boolean,
  account?: AccountResponse
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const { updateAccount, isLoading } = useAccountOperations()
const $toast = useToast()

const initialValues = computed(() => {
  if (!props.account) return {}

  return {
    id: props.account.id,
    name: props.account.name,
    account_type: props.account.account_type,
    account_balance: props.account.account_balance,
    interest_rate: props.account.interest_rate,
    minimum_monthly_payment: props.account.minimum_monthly_payment,
    budget_id: props.account.budget_id
  }
})

const handleFormSubmit = async (formData: { name: string }) => {
  if (!props.account) return

  try {
    const updateData: UpdateAccountDto = {
      name: formData.name
    }

    await updateAccount(props.account.id, updateData)

    $toast.success('Account updated successfully')
    emit('updated')
    close()
  } catch (error: any) {
    console.error('Failed to update account:', error)
    if (error.response?.data?.message?.includes('already exists')) {
      $toast.error('An account with this name already exists')
    } else {
      $toast.error('Failed to update account')
    }
  }
}

const close = () => {
  emit('close')
}
</script>
