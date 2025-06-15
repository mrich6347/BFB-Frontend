<template>
  <Dialog :open="isOpen" @update:open="(value) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ mode === 'edit' ? 'Edit Category Group' : 'Create Category Group' }}</DialogTitle>
      </DialogHeader>

      <CategoryGroupForm
        :is-loading="isLoading"
        :mode="mode"
        :initial-values="initialValues"
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
          Delete Group & Hide Categories
        </button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Confirmation Dialog -->
  <Dialog :open="showConfirmation" @update:open="(value) => !value && cancelDelete()">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Delete Category Group</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete the "{{ categoryGroup?.name }}" category group?
        </DialogDescription>
      </DialogHeader>

      <div class="mt-4 p-4 bg-muted/50 rounded-lg border">
        <h4 class="font-medium text-sm mb-2">What will happen:</h4>
        <ul class="text-sm text-muted-foreground space-y-1">
          <li class="flex items-start gap-2">
            <span class="text-destructive mt-0.5">•</span>
            <span>The "{{ categoryGroup?.name }}" group will be permanently deleted</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">•</span>
            <span>All categories in this group will be moved to "Hidden Categories"</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-600 mt-0.5">•</span>
            <span>All transaction history and balances will be preserved</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 mt-0.5">•</span>
            <span>You can unhide categories later and move them to other groups</span>
          </li>
        </ul>
      </div>

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
          {{ isDeleting ? 'Delete Group & Hide Categories' : 'Delete Group & Hide Categories' }}
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CategoryGroupResponse, CreateCategoryGroupDto, UpdateCategoryGroupDto } from '@/types/DTO/category-group.dto'
import CategoryGroupForm from './forms/CategoryGroupForm.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn-ui'
import { Trash2 } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  mode: 'create' | 'edit'
  categoryGroup?: CategoryGroupResponse
  budgetId: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  categoryGroup: undefined
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', categoryGroup: CategoryGroupResponse): void
  (e: 'updated', categoryGroup: CategoryGroupResponse): void
  (e: 'deleted', categoryGroupId: string): void
}>()

const categoryStore = useCategoryStore()
const isLoading = ref(false)
const isDeleting = ref(false)
const showConfirmation = ref(false)

const initialValues = computed(() => {
  if (props.mode === 'edit' && props.categoryGroup) {
    return {
      name: props.categoryGroup.name
    }
  }
  return {}
})

const close = () => {
  emit('close')
}

const handleSubmit = async (formData: CreateCategoryGroupDto) => {
  isLoading.value = true

  try {
    if (props.mode === 'create') {
      const response = await categoryStore.createCategoryGroup(formData)
      emit('created', response)
    } else if (props.mode === 'edit' && props.categoryGroup) {
      const updateData: UpdateCategoryGroupDto = {
        name: formData.name
      }
      const response = await categoryStore.updateCategoryGroup(props.categoryGroup.id, updateData)
      emit('updated', response)
    }
    close()
  } catch (error) {
    console.error(`Failed to ${props.mode} category group:`, error)
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
  if (!props.categoryGroup) return

  isDeleting.value = true

  try {
    await categoryStore.deleteCategoryGroup(props.categoryGroup.id)
    emit('deleted', props.categoryGroup.id)
    close()
  } catch (error) {
    console.error('Failed to delete category group:', error)
  } finally {
    isDeleting.value = false
    showConfirmation.value = false
  }
}
</script>
