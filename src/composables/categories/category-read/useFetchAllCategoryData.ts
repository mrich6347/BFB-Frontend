import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryGroupService from '@/services/category-group.service'
import CategoryService from '@/services/category.service'

export const useFetchAllCategoryData = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchAllCategoryData = async (budgetId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const [categoryGroups, categories] = await Promise.all([
        CategoryGroupService.getAllCategoryGroups(budgetId),
        CategoryService.getCategoriesByBudget(budgetId)
      ])

      categoryStore.setCategoryGroups(categoryGroups)
      categoryStore.setCategories(categories)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load category data'
      console.error('Error loading category data:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAllCategoryData
  }
}
