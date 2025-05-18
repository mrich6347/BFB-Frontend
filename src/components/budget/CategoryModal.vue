<template>
  <Dialog :open="isOpen" @update:open="(value) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ mode === 'edit' ? 'Edit Category' : 'Create Category' }}</DialogTitle>
      </DialogHeader>

      <CategoryForm
        :is-loading="isLoading"
        :mode="mode"
        :initial-values="initialValues"
        :category-group-id="categoryGroupId"
        :budget-id="budgetId"
        @submit="handleSubmit"
        @cancel="close"
      />

      <div v-if="mode === 'edit'" class="mt-4 pt-4 border-t">
        <button
          @click="confirmDelete"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-destructive border border-destructive rounded-md hover:bg-destructive/10"
        >
          <Trash2 class="h-4 w-4" />
          Delete Category
        </button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Confirmation Dialog -->
  <Dialog :open="showConfirmation" @update:open="(value) => !value && cancelDelete()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this category? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <div class="flex justify-end gap-3 mt-6">
        <button
          @click="cancelDelete"
          class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
        >
          Cancel
        </button>
        <button
          @click="handleDelete"
          :disabled="isDeleting"
          class="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90 disabled:opacity-50"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CategoryResponse, CreateCategoryDto, UpdateCategoryDto } from '@/types/DTO/category.dto'
import CategoryForm from './forms/CategoryForm.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn-ui'
import { Trash2 } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  mode: 'create' | 'edit'
  category?: CategoryResponse
  categoryGroupId: string
  budgetId: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  category: undefined
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', category: CategoryResponse): void
  (e: 'updated', category: CategoryResponse): void
  (e: 'deleted', categoryId: string): void
}>()

const categoryStore = useCategoryStore()
const isLoading = ref(false)
const isDeleting = ref(false)
const showConfirmation = ref(false)

const initialValues = computed(() => {
  if (props.mode === 'edit' && props.category) {
    return {
      name: props.category.name
    }
  }
  return {}
})

const close = () => {
  emit('close')
}

const handleSubmit = async (formData: CreateCategoryDto | UpdateCategoryDto) => {
  isLoading.value = true

  try {
    if (props.mode === 'create') {
      const createData = formData as CreateCategoryDto
      const response = await categoryStore.createCategory(createData)
      emit('created', response)
    } else if (props.mode === 'edit' && props.category) {
      const updateData = formData as UpdateCategoryDto
      const response = await categoryStore.updateCategory(props.category.id, updateData)
      emit('updated', response)
    }
    close()
  } catch (error) {
    console.error(`Failed to ${props.mode} category:`, error)
  } finally {
    isLoading.value = false
  }
}

const confirmDelete = () => {
  showConfirmation.value = true
}

const cancelDelete = () => {
  showConfirmation.value = false
}

const handleDelete = async () => {
  if (!props.category) return

  isDeleting.value = true

  try {
    await categoryStore.deleteCategory(props.category.id)
    emit('deleted', props.category.id)
    close()
  } catch (error) {
    console.error('Failed to delete category:', error)
  } finally {
    isDeleting.value = false
    showConfirmation.value = false
  }
}
</script>
