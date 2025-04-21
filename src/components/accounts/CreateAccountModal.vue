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
import { ref } from 'vue'
import { useAccountStore } from '@/stores/account.store'
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

const accountStore = useAccountStore()
const isLoading = ref(false)

const close = () => {
  emit('close')
}

const handleFormSubmit = async (formData: CreateAccountDto) => {
  try {
    isLoading.value = true
    await accountStore.createAccount(formData)
    close()
  } catch (error) {
    console.error('Failed to create account:', error)
  } finally {
    isLoading.value = false
  }
}

</script> 