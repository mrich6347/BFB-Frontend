import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryGroupService from '@/services/category-group.service'

export const useHideCategoryGroup = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hideCategoryGroup = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await CategoryGroupService.hideCategoryGroup(id)

      // Store responsibility: Know HOW to hide the group and handle moved categories
      categoryStore.hideCategoryGroup(id, response.movedCategories)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to hide category group'
      console.error('Error hiding category group:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    hideCategoryGroup
  }
}
