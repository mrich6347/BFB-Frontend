import { ref, readonly } from 'vue'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import AutoAssignService from '@/services/auto-assign.service'

export const useFetchAutoAssignConfiguration = () => {
  const autoAssignStore = useAutoAssignStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchConfiguration = async (budgetId: string, name: string) => {
    isLoading.value = true
    error.value = null

    try {
      const configuration = await AutoAssignService.getConfigurationByName(budgetId, name)
      autoAssignStore.setCurrentConfiguration(configuration)
      return configuration
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load auto-assign configuration'
      console.error('Error loading auto-assign configuration:', err)
      autoAssignStore.setCurrentConfiguration(null)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchConfiguration
  }
}
