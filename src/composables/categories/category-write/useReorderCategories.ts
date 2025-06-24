import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryService from '@/services/category.service'

export const useReorderCategories = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const reorderCategories = async (categoryIds: string[]) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service first
      await CategoryService.reorderCategories({ category_ids: categoryIds })

      // Store responsibility: Update display orders after successful API call
      categoryStore.reorderCategories(categoryIds)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder categories'
      console.error('Error reordering categories:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    reorderCategories
  }
}
