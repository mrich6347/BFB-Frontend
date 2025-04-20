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
import { ref } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
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

const budgetStore = useBudgetStore()
const isLoading = ref(false)

const close = () => {
  emit('close')
}

const handleSubmit = async (formData: CreateBudgetDto) => {
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