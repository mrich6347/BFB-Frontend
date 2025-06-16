<template>
  <Dialog :open="isOpen" @update:open="(value) => !value && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Unhide Category</DialogTitle>
        <DialogDescription>
          Choose which category group to move "{{ categoryName }}" to.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 mt-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Select Category Group</label>
          <select
            v-model="selectedGroupId"
            class="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a group...</option>
            <option
              v-for="group in availableGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button
          @click="close"
          class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
        >
          Cancel
        </button>
        <button
          @click="handleUnhide"
          :disabled="!selectedGroupId || isLoading"
          class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {{ isLoading ? 'Moving...' : 'Unhide Category' }}
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CategoryGroupResponse } from '@/types/DTO/category-group.dto'
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

const categoryStore = useCategoryStore()
const selectedGroupId = ref('')
const isLoading = ref(false)

// Get available category groups (exclude system groups)
const availableGroups = computed(() => {
  return categoryStore.categoryGroups.filter(group =>
    !group.is_system_group
  )
})

const close = () => {
  selectedGroupId.value = ''
  emit('close')
}

const handleUnhide = async () => {
  if (!selectedGroupId.value) return

  isLoading.value = true

  try {
    await categoryStore.unhideCategory(props.categoryId, selectedGroupId.value)
    emit('unhidden', props.categoryId)
    close()
  } catch (error) {
    console.error('Failed to unhide category:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
