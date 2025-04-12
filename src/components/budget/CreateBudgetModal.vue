<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div class="bg-background dark:bg-background rounded-lg shadow-lg w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-foreground dark:text-foreground">Create New Budget</h3>
        <button @click="close" class="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="name">
            Budget Name
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
            placeholder="Enter budget name"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="currency">
            Currency
          </label>
          <input
            id="currency"
            v-model="form.currency"
            type="text"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
            placeholder="USD"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="currency_placement">
            Currency Placement
          </label>
          <select
            id="currency_placement"
            v-model="form.currency_placement"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
          >
            <option value="BEFORE">Before</option>
            <option value="AFTER">After</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="number_format">
            Number Format
          </label>
          <input
            id="number_format"
            v-model="form.number_format"
            type="text"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
            placeholder="1,234.56"
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
            <span v-else>Create Budget</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useBudgetStore } from '@/stores/budgetStore'
import type { CreateBudgetRequest } from '@/types/api/budgets/createBudget/createBudget'
import { CurrencyPlacement } from '@/types/models/budget'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const budgetStore = useBudgetStore()
const isLoading = ref(false)

const form = reactive<CreateBudgetRequest>({
  name: '',
  currency: 'USD',
  currency_placement: CurrencyPlacement.BEFORE,
  number_format: '1,234.56'
})

const close = () => {
  emit('close')
}

const handleSubmit = async () => {
  try {
    isLoading.value = true
    await budgetStore.createBudget(form)
    emit('created')
    close()
  } catch (error) {
    console.error('Failed to create budget:', error)
  } finally {
    isLoading.value = false
  }
}
</script> 