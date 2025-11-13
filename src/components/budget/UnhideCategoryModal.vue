<template>
  <Dialog :open="isOpen" @update:open="(value) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Unhide Category</DialogTitle>
        <DialogDescription>
          Are you sure you want to unhide "{{ categoryName }}"? It will be restored to its original category group.
        </DialogDescription>
      </DialogHeader>

      <div class="flex justify-end gap-3 mt-6">
        <button
          @click="close"
          class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
        >
          Cancel
        </button>
        <button
          @click="handleUnhide"
          :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {{ isLoading ? 'Unhiding...' : 'Unhide Category' }}
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUnhideCategory } from '@/composables/categories/category-write/useUnhideCategory'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn-ui'

interface Props {
  isOpen: boolean
  categoryId: string
  categoryName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'unhidden', categoryId: string): void
}>()

const { unhideCategory } = useUnhideCategory()
const isLoading = ref(false)

const close = () => {
  emit('close')
}

const handleUnhide = async () => {
  isLoading.value = true

  try {
    await unhideCategory(props.categoryId)
    emit('unhidden', props.categoryId)
    close()
  } catch (error) {
    console.error('Failed to unhide category:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
