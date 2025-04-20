<template>
  <Dialog :open="isOpen" @update:open="(value) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Budget</DialogTitle>
      </DialogHeader>
      
      <BudgetForm
        :is-loading="isLoading"
        mode="edit"
        :initial-values="budget"
        @submit="handleSubmit"
        @cancel="close"
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import type { CreateBudgetDto, BudgetResponse } from '@/types/DTO/budget.dto'
import { useRouter } from 'vue-router'
import BudgetForm from './forms/BudgetForm.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'

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