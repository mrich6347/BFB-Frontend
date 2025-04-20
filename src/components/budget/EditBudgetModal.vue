<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div class="bg-background dark:bg-background rounded-lg shadow-lg w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-foreground dark:text-foreground">Edit Budget</h3>
        <button @click="close" class="text-muted-foreground hover:text-foreground">
          <X class="h-6 w-6" />
        </button>
      </div>

      <BudgetForm
        :is-loading="isLoading"
        mode="edit"
        :initial-values="budget"
        @submit="handleSubmit"
        @cancel="close"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import type { CreateBudgetDto, BudgetResponse } from '@/types/DTO/budget.dto'
import { useRouter } from 'vue-router'
import BudgetForm from './forms/BudgetForm.vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  budget: BudgetResponse
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const budgetStore = useBudgetStore()
const isLoading = ref(false)

const close = () => {
  emit('close')
}

const handleSubmit = async (formData: CreateBudgetDto) => {
  try {
    isLoading.value = true
    await budgetStore.updateBudget(props.budget.id, formData)
    emit('updated')
    close()
  } catch (error) {
    console.error('Failed to update budget:', error)
  } finally {
    isLoading.value = false
  }
}
</script> 