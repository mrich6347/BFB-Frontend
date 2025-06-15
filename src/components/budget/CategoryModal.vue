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
          @click="confirmHide"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50"
        >
          <EyeOff class="h-4 w-4" />
          Hide Category
        </button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Confirmation Dialog -->
  <Dialog :open="showConfirmation" @update:open="(value) => !value && cancelHide()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Hide Category</DialogTitle>
        <DialogDescription>
          Are you sure you want to hide this category? It will be moved to the Hidden Categories section and won't be available for new transactions or auto-assign configurations.
        </DialogDescription>
      </DialogHeader>

      <div class="flex justify-end gap-3 mt-6">
        <button
          @click="cancelHide"
          class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
        >
          Cancel
        </button>
        <button
          @click="handleHide"
          :disabled="isDeleting"
          class="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md hover:bg-muted/80 disabled:opacity-50"
        >
          {{ isDeleting ? 'Hiding...' : 'Hide Category' }}
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
import { EyeOff } from 'lucide-vue-next'

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
  (e: 'hidden', categoryId: string): void
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
  console.log('🚀 CategoryModal handleSubmit called:', { mode: props.mode, formData });
  isLoading.value = true

  try {
    if (props.mode === 'create') {
      const createData = formData as CreateCategoryDto
      console.log('➕ Creating category:', createData);
      const response = await categoryStore.createCategory(createData)
      console.log('✅ Category created, emitting event:', response);
      emit('created', response)
    } else if (props.mode === 'edit' && props.category) {
      const updateData = formData as UpdateCategoryDto
      console.log('✏️ Updating category:', { id: props.category.id, from: props.category.name, to: updateData.name });
      const response = await categoryStore.updateCategory(props.category.id, updateData)
      console.log('✅ Category updated, emitting event:', response);
      emit('updated', response)
    }
    console.log('🔒 Closing modal');
    close()
  } catch (error) {
    console.error(`❌ Failed to ${props.mode} category:`, error)
  } finally {
    isLoading.value = false
  }
}

const confirmHide = () => {
  showConfirmation.value = true
}

const cancelHide = () => {
  showConfirmation.value = false
}

const handleHide = async () => {
  if (!props.category) return

  isDeleting.value = true

  try {
    await categoryStore.hideCategory(props.category.id)
    emit('hidden', props.category.id)
    close()
  } catch (error) {
    console.error('Failed to hide category:', error)
  } finally {
    isDeleting.value = false
    showConfirmation.value = false
  }
}
</script>
