<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div class="bg-background dark:bg-background rounded-lg shadow-lg w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-foreground dark:text-foreground">Create New Account</h3>
        <button @click="close" class="text-muted-foreground hover:text-foreground">
          <X class="h-6 w-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="name">
            Account Name
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
            placeholder="Enter account name"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="accountType">
            Account Type
          </label>
          <select
            id="accountType"
            v-model="form.account_type"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
          >
            <option v-for="type in accountTypes" :key="type" :value="type">
              {{ formatAccountType(type) }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="currentBalance">
            Current Balance
          </label>
          <input
            id="currentBalance"
            v-model="form.current_balance"
            type="text"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
            placeholder="0.00"
            />
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Creating...</span>
            <span v-else>Create Account</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { X } from 'lucide-vue-next'
import { useAccountStore } from '@/stores/accountStore'
import { AccountType } from '@/types/models/account'
import type { CreateAccountRequest } from '@/types/DTO/account.dto'

const props = defineProps<{
  isOpen: boolean,
  budgetId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const accountStore = useAccountStore()
const isLoading = ref(false)

const accountTypes = Object.values(AccountType)

const form = reactive<CreateAccountRequest>({
  id: '',
  name: '',
  account_type: AccountType.CASH,
  current_balance: 0,   
  budget_id: props.budgetId
})

const formatAccountType = (type: AccountType): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const close = () => {
  emit('close')
}

const handleSubmit = async () => {
  try {
    isLoading.value = true
    await accountStore.createAccount(form)
    close()
  } catch (error) {
    console.error('Failed to create account:', error)
  } finally {
    isLoading.value = false
    resetForm()
  }
}

const resetForm = () => {
  form.id = ''
  form.name = ''
  form.account_type = AccountType.CASH
  form.current_balance = 0
  form.budget_id = props.budgetId
}
</script> 