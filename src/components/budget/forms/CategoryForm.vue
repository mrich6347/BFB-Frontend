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
      label="Category Name"
      :validation-visibility="props.mode === 'edit' ? 'live' : 'blur'"
      :validation-rules="{ 
        uniqueCategoryName: uniqueCategoryNameRule 
      }"
      :validation-messages="{
        uniqueCategoryName: 'Category already exists with this name in this group'
      }"
      validation="required|uniqueCategoryName"
      placeholder="Enter category name"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />
    
    <FormKit
      v-if="mode === 'edit'"
      type="number"
      name="assigned"
      label="Assigned Amount"
      step="0.01"
      validation="number"
      placeholder="0.00"
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
        <span>{{ isLoading ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Category' : 'Create Category') }}</span>
      </FormKit>
    </div>
  </FormKit>
</template>

<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CreateCategoryDto, UpdateCategoryDto } from '@/types/DTO/category.dto'
import type { FormKitNode } from '@formkit/core'

const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()

interface Props {
  isLoading: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<CreateCategoryDto & UpdateCategoryDto>
  categoryGroupId: string
  budgetId: string
}

const props = withDefaults(defineProps<Props>(), {
  initialValues: () => ({}),
  mode: 'create'
})

const emit = defineEmits<{
  (e: 'submit', data: CreateCategoryDto | UpdateCategoryDto): void
  (e: 'cancel'): void
}>()

// Custom validation rule for unique category name within a group
const uniqueCategoryNameRule = (node: FormKitNode): boolean => {
  const value = node.value as string
  if (!value) return true
  
  // If we're in edit mode and the name hasn't changed, it's valid
  if (props.mode === 'edit' && value === props.initialValues?.name) {
    return true
  }
  
  // Check against the store, case-insensitive
  return !categoryStore.categoryExistsByName(value, props.categoryGroupId)
}

const handleSubmit = (formData: { name: string, assigned?: number }) => {
  if (props.mode === 'create') {
    const data: CreateCategoryDto = {
      name: formData.name,
      category_group_id: props.categoryGroupId,
      budget_id: props.budgetId
    }
    
    emit('submit', data)
  } else {
    const data: UpdateCategoryDto = {
      name: formData.name
    }
    
    if (formData.assigned !== undefined) {
      data.assigned = formData.assigned
    }
    
    emit('submit', data)
  }
}
</script>
