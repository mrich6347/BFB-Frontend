import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryGroupService from '@/services/category-group.service'
import type { UpdateCategoryGroupDto } from '@/types/DTO/category-group.dto'

export const useUpdateCategoryGroup = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const updateCategoryGroup = async (id: string, formData: UpdateCategoryGroupDto) => {
    isLoading.value = true
    error.value = null

    try {
      const requestData = {
        ...formData,
        name: formData.name?.trim()
      }

      const response = await CategoryGroupService.updateCategoryGroup(id, requestData)

      categoryStore.updateCategoryGroup(id, response)

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category group'
      console.error('Error updating category group:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    updateCategoryGroup
  }
}
