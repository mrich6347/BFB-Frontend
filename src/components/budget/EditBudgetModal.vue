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
import { useUpdateBudget } from '@/composables/budgets/budget-write/useUpdateBudget'
import type { CreateBudgetDto, BudgetResponse } from '@/types/DTO/budget.dto'
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

const { updateBudget, isLoading } = useUpdateBudget()

const close = () => {
  emit('close')
}

const handleSubmit = async (formData: CreateBudgetDto) => {
  try {
    await updateBudget(props.budget.id, formData)
    emit('updated')
    close()
  } catch (error) {
    // Error is already handled by composable
    // Just prevent modal from closing
  }
}
</script>
