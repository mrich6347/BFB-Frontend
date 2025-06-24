import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryGroupService from '@/services/category-group.service'

export const useDeleteCategoryGroup = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const deleteCategoryGroup = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await CategoryGroupService.deleteCategoryGroup(id)

      // Store responsibility: Know HOW to remove the group and handle moved categories
      categoryStore.removeCategoryGroup(id, response.movedCategories)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete category group'
      console.error('Error deleting category group:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    deleteCategoryGroup
  }
}
