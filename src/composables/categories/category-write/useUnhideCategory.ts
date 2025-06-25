import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryService from '@/services/category.service'

export const useUnhideCategory = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const unhideCategory = async (id: string, targetGroupId?: string) => {
    isLoading.value = true
    error.value = null

    try {
      // If no target group specified, use the first non-system group
      let targetGroup = targetGroupId
      if (!targetGroup) {
        const firstGroup = categoryStore.categoryGroups.find(group => !group.is_system_group)
        if (!firstGroup) {
          throw new Error('No available category group to move to')
        }
        targetGroup = firstGroup.id
      }

      const response = await CategoryService.unhideCategory(id, targetGroup)

      budgetStore.setReadyToAssign(response.readyToAssign)

      categoryStore.unhideCategory(id, targetGroup)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to unhide category'
      console.error('Error unhiding category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    unhideCategory
  }
}
