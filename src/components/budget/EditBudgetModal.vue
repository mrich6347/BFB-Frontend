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

      <!-- Delete Budget Section -->
      <div class="mt-6 pt-6 border-t border-border">
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-foreground mb-1">Delete Budget</h4>
            <p class="text-xs text-muted-foreground">
              Permanently delete this budget and all associated data. This action cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            @click="showDeleteConfirm = true"
            :disabled="isDeleting"
          >
            Delete
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <Dialog :open="showDeleteConfirm" @update:open="(value) => !value && (showDeleteConfirm = false)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete Budget?</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Are you sure you want to delete <span class="font-semibold text-foreground">{{ budget.name }}</span>?
        </p>
        <p class="text-sm text-muted-foreground">
          This will permanently delete:
        </p>
        <ul class="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
          <li>All accounts and transactions</li>
          <li>All categories and budgets</li>
          <li>All scheduled transactions</li>
          <li>All shared goals</li>
          <li>All historical data</li>
        </ul>
        <p class="text-sm font-semibold text-destructive">
          This action cannot be undone.
        </p>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          @click="showDeleteConfirm = false"
          :disabled="isDeleting"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          @click="handleDelete"
          :disabled="isDeleting"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete Budget' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUpdateBudget } from '@/composables/budgets/budget-write/useUpdateBudget'
import { useDeleteBudget } from '@/composables/budgets/budget-write/useDeleteBudget'
import type { CreateBudgetDto, BudgetResponse } from '@/types/DTO/budget.dto'
import BudgetForm from './forms/BudgetForm.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'

const props = defineProps<{
  isOpen: boolean
  budget: BudgetResponse
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
  (e: 'deleted'): void
}>()

const { updateBudget, isLoading } = useUpdateBudget()
const { deleteBudget, isLoading: isDeleting } = useDeleteBudget()
const showDeleteConfirm = ref(false)

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

const handleDelete = async () => {
  try {
    await deleteBudget(props.budget.id)
    showDeleteConfirm.value = false
    emit('deleted')
    close()
  } catch (error) {
    // Error is already handled by composable
    // Just prevent modal from closing
  }
}
</script>
