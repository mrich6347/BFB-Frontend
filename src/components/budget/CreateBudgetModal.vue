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

      <CreateBudgetForm
        :is-loading="isLoading"
        @submit="handleSubmit"
        @cancel="close"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import type { CreateBudgetRequest } from '@/types/DTO/budget.dto'
import { useRouter } from 'vue-router'
import CreateBudgetForm from './forms/CreateBudgetForm.vue'

const router = useRouter()
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const budgetStore = useBudgetStore()
const isLoading = ref(false)

const close = () => {
  emit('close')
}

const handleSubmit = async (formData: CreateBudgetRequest) => {
  try {
    isLoading.value = true
    const budget = await budgetStore.createBudget(formData)
    close()
    router.push(`/budget/${budget.id}`)
  } catch (error) {
    console.error('Failed to create budget:', error)
  } finally {
    isLoading.value = false
  }
}
</script> 