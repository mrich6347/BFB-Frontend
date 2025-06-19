<template>
  <Dialog :open="isOpen" @update:open="(value) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Budget</DialogTitle>
      </DialogHeader>

      <BudgetForm
        :is-loading="isLoading"
        mode="create"
        @submit="handleSubmit"
        @cancel="close"
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useBudgetOperations } from '@/composables/budgets/useBudgetOperations'
import type { CreateBudgetDto } from '@/types/DTO/budget.dto'
import { useRouter } from 'vue-router'
import BudgetForm from './forms/BudgetForm.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'

const router = useRouter()
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { createBudget, isLoading } = useBudgetOperations()

const close = () => {
  emit('close')
}

const handleSubmit = async (formData: CreateBudgetDto) => {
  try {
    const budget = await createBudget(formData)
    close()
    router.push(`/budget/${budget.id}`)
  } catch (error) {
    // Error is already handled by composable
    // Just prevent modal from closing
  }
}
</script>
