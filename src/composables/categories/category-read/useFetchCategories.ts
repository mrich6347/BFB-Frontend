import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryService from '@/services/category.service'

export const useFetchCategories = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategories = async (budgetId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const categories = await CategoryService.getCategoriesByBudget(budgetId)
      categoryStore.setCategories(categories)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load categories'
      console.error('Error loading categories:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchCategories
  }
}
