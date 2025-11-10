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
            <h3 class="text-lg font-semibold">Edit Category</h3>
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
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>

          <!-- Hide Category Button -->
          <button
            @click="handleHide"
            :disabled="isLoading"
            class="w-full py-3 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <EyeOffIcon class="h-4 w-4" />
            Hide Category
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { XIcon, EyeOffIcon } from 'lucide-vue-next'
import { useUpdateCategory } from '@/composables/categories/category-write/useUpdateCategory'
import { useHideCategory } from '@/composables/categories/category-write/useHideCategory'
import type { CategoryResponse } from '@/types/DTO/category.dto'

const props = defineProps<{
  show: boolean
  category: CategoryResponse | null
}>()

const emit = defineEmits<{
  close: []
  updated: [category: CategoryResponse]
  hidden: [categoryId: string]
}>()

const { updateCategory } = useUpdateCategory()
const { hideCategory } = useHideCategory()
const categoryName = ref('')
const isLoading = ref(false)
const isClosing = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)

// Auto-focus input when modal opens and populate with current name
watch(() => props.show, async (newValue) => {
  if (newValue && props.category) {
    isClosing.value = false
    categoryName.value = props.category.name
    await nextTick()
    nameInputRef.value?.focus()
    // Select all text for easy editing
    nameInputRef.value?.select()
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
  if (!categoryName.value.trim() || isLoading.value || !props.category) return

  // Don't save if name hasn't changed
  if (categoryName.value.trim() === props.category.name) {
    handleClose()
    return
  }

  isLoading.value = true

  try {
    const updatedCategory = await updateCategory(props.category.id, {
      name: categoryName.value.trim()
    })

    emit('updated', updatedCategory)
    
    // Close modal with animation
    isClosing.value = true
    setTimeout(() => {
      emit('close')
    }, 300)
  } catch (error) {
    console.error('Failed to update category:', error)
    // Error is already handled by the composable
  } finally {
    isLoading.value = false
  }
}

const handleHide = async () => {
  if (isLoading.value || !props.category) return

  isLoading.value = true

  try {
    await hideCategory(props.category.id)

    emit('hidden', props.category.id)

    // Close modal with animation
    isClosing.value = true
    setTimeout(() => {
      emit('close')
    }, 300)
  } catch (error) {
    console.error('Failed to hide category:', error)
    // Error is already handled by the composable
  } finally {
    isLoading.value = false
  }
}
</script>

