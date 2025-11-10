<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-black/50 transition-opacity"
      :class="isClosing ? 'opacity-0' : 'opacity-100'"
      @click="handleClose"
    >
      <!-- Modal that slides up from bottom -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-lg transition-transform duration-300"
        :class="isClosing ? 'translate-y-full' : 'translate-y-0'"
        @click.stop
        style="padding-bottom: max(2rem, calc(2rem + env(safe-area-inset-bottom)));"
      >
        <!-- Header -->
        <div class="px-4 py-4 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Create Category</h3>
            <button @click="handleClose" class="p-2 hover:bg-accent rounded-md">
              <XIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
          <!-- Category Name Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium">Category Name</label>
            <input
              ref="nameInputRef"
              v-model="categoryName"
              type="text"
              placeholder="Enter category name"
              class="w-full px-4 py-3 border border-input rounded-md bg-background text-lg"
              @keydown.enter="handleSave"
            />
          </div>

          <!-- Save Button -->
          <button
            @click="handleSave"
            :disabled="!categoryName.trim() || isLoading"
            class="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Creating...' : 'Create Category' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { useCreateCategory } from '@/composables/categories/category-write/useCreateCategory'
import type { CategoryResponse } from '@/types/DTO/category.dto'

const props = defineProps<{
  show: boolean
  categoryGroupId: string
  budgetId: string
}>()

const emit = defineEmits<{
  close: []
  created: [category: CategoryResponse]
}>()

const { createCategory } = useCreateCategory()
const categoryName = ref('')
const isLoading = ref(false)
const isClosing = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)

// Auto-focus input when modal opens
watch(() => props.show, async (newValue) => {
  if (newValue) {
    isClosing.value = false
    categoryName.value = ''
    await nextTick()
    nameInputRef.value?.focus()
  }
})

const handleClose = () => {
  if (isLoading.value) return
  
  isClosing.value = true
  setTimeout(() => {
    emit('close')
  }, 300)
}

const handleSave = async () => {
  if (!categoryName.value.trim() || isLoading.value) return

  isLoading.value = true

  try {
    const category = await createCategory({
      name: categoryName.value.trim(),
      category_group_id: props.categoryGroupId,
      budget_id: props.budgetId
    })

    emit('created', category)
    
    // Close modal with animation
    isClosing.value = true
    setTimeout(() => {
      emit('close')
    }, 300)
  } catch (error) {
    console.error('Failed to create category:', error)
    // Error is already handled by the composable
  } finally {
    isLoading.value = false
  }
}
</script>

