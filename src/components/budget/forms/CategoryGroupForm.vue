<template>
  <FormKit
    type="form"
    @submit="handleSubmit"
    :actions="false"
    :value="initialValues"
    validation-visibility="live"
    #default="{ state }"
  >
    <FormKit
      type="text"
      name="name"
      label="Category Group Name"
      :validation-visibility="props.mode === 'edit' ? 'live' : 'dirty'"
      :validation-rules="{
        uniqueCategoryGroupName: uniqueCategoryGroupNameRule
      }"
      :validation-messages="{
        uniqueCategoryGroupName: 'Category group already exists with this name'
      }"
      validation="required|uniqueCategoryGroupName"
      placeholder="Enter category group name"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />

    <div class="flex justify-end gap-3 mt-6">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
      >
        Cancel
      </button>
      <FormKit
        type="submit"
        :disabled="isLoading || state.valid === false"
        input-class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        <span>{{ isLoading ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Group' : 'Create Group') }}</span>
      </FormKit>
    </div>
  </FormKit>
</template>

<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CreateCategoryGroupDto } from '@/types/DTO/category-group.dto'
import type { FormKitNode } from '@formkit/core'

const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()

interface Props {
  isLoading: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<CreateCategoryGroupDto>
  budgetId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialValues: () => ({}),
  mode: 'create',
  budgetId: ''
})

const emit = defineEmits<{
  (e: 'submit', data: CreateCategoryGroupDto): void
  (e: 'cancel'): void
}>()

// Custom validation rule for unique category group name
const uniqueCategoryGroupNameRule = (node: FormKitNode): boolean => {
  const value = node.value as string
  if (!value) return true

  // If we're in edit mode and the name hasn't changed, it's valid
  if (props.mode === 'edit' && value === props.initialValues?.name) {
    return true
  }

  // Get the budget ID from props or from the current budget
  const budgetId = props.budgetId || budgetStore.currentBudget?.id
  if (!budgetId) return true

  // Check against the store, case-insensitive
  return !categoryStore.categoryGroupExistsByName(value, budgetId)
}

const handleSubmit = (formData: { name: string }) => {
  // Get the budget ID from props or from the current budget
  const budgetId = props.budgetId || budgetStore.currentBudget?.id

  if (!budgetId) {
    console.error('No budget ID available')
    return
  }

  const data: CreateCategoryGroupDto = {
    name: formData.name,
    budget_id: budgetId
  }

  emit('submit', data)
}
</script>
