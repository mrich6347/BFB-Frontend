import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'
import type { CreateCategoryDto } from '@/types/DTO/category.dto'

export const useCreateCategory = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const createCategory = async (formData: CreateCategoryDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Format/validate data before sending
      const requestData = {
        ...formData,
        name: formData.name.trim(),
        display_order: 0 // Always add to top
      }

      // Call service to get data
      const response = await CategoryService.createCategory(requestData)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign in budget store
      budgetStore.setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to add the category to state
      categoryStore.addCategory(response.category)

      return response.category
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create category'
      console.error('Error creating category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    createCategory
  }
}
