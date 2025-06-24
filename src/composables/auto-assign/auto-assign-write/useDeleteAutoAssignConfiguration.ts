import { ref, readonly } from 'vue'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import AutoAssignService from '@/services/auto-assign.service'

export const useDeleteAutoAssignConfiguration = () => {
  const autoAssignStore = useAutoAssignStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const deleteConfiguration = async (budgetId: string, name: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      await AutoAssignService.deleteConfiguration(budgetId, name)

      // Store responsibility: Know HOW to remove the configuration from state
      autoAssignStore.removeConfiguration(name)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete auto-assign configuration'
      console.error('Error deleting auto-assign configuration:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    deleteConfiguration
  }
}
