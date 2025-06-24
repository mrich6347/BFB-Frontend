import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import CategoryGroupService from '@/services/category-group.service'

export const useReorderCategoryGroups = () => {
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const reorderCategoryGroups = async (groupIds: string[]) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      await CategoryGroupService.reorderCategoryGroups({ group_ids: groupIds })

      // Store responsibility: Know HOW to update display orders
      categoryStore.reorderCategoryGroups(groupIds)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder category groups'
      console.error('Error reordering category groups:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    reorderCategoryGroups
  }
}
