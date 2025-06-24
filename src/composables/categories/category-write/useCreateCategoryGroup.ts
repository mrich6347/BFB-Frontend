import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryGroupService from '@/services/category-group.service'
import type { CreateCategoryGroupDto } from '@/types/DTO/category-group.dto'

export const useCreateCategoryGroup = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const createCategoryGroup = async (formData: CreateCategoryGroupDto) => {
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
      const response = await CategoryGroupService.createCategoryGroup(requestData)

      // Store responsibility: Know HOW to add the group to state
      categoryStore.addCategoryGroup(response)

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create category group'
      console.error('Error creating category group:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    createCategoryGroup
  }
}
