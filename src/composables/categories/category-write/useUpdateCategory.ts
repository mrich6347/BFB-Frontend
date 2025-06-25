import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'
import type { UpdateCategoryDto } from '@/types/DTO/category.dto'

export const useUpdateCategory = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const updateCategory = async (id: string, formData: UpdateCategoryDto) => {
    isLoading.value = true
    error.value = null

    try {
      const requestData = {
        ...formData,
        name: formData.name?.trim()
      }

      const response = await CategoryService.updateCategory(id, requestData)

      if (response.readyToAssign !== undefined) {
        budgetStore.setReadyToAssign(response.readyToAssign)
      }

      categoryStore.updateCategory(id, response.category)

      return response.category
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category'
      console.error('Error updating category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    updateCategory
  }
}
