import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryGroupService from '@/services/category-group.service'

export const useFetchCategoryGroups = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategoryGroups = async (budgetId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const categoryGroups = await CategoryGroupService.getAllCategoryGroups(budgetId)
      categoryStore.setCategoryGroups(categoryGroups)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load category groups'
      console.error('Error loading category groups:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchCategoryGroups
  }
}
