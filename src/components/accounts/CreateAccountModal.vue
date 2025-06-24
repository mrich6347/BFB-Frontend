<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Account</DialogTitle>
      </DialogHeader>

      <AccountForm
        :isLoading="isLoading"
        :budgetId="budgetId"
        mode="create"
        @submit="handleFormSubmit"
        @cancel="close"
      />

    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useCreateAccount } from '@/composables/accounts/account-write/useCreateAccount'
import { useFetchAllCategoryData } from '@/composables/categories/category-read/useFetchAllCategoryData'
import type { CreateAccountDto } from '@/types/DTO/account.dto'
import AccountForm from './forms/AccountForm.vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'

const props = defineProps<{
  isOpen: boolean,
  budgetId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { createAccount, isLoading } = useCreateAccount()
const { fetchAllCategoryData } = useFetchAllCategoryData()

const close = () => {
  emit('close')
}

const handleFormSubmit = async (formData: CreateAccountDto | { name: string }) => {
  try {
    if ('account_type' in formData) {
      const createdAccount = await createAccount(formData)

      // If this is a credit card account, refresh category data to show the new payment category
      if (createdAccount.account_type === 'CREDIT') {
        await fetchAllCategoryData(props.budgetId)
      }

      close()
    }
  } catch (error) {
    console.error('Failed to create account:', error)
  }
}

</script>
