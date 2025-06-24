import { ref, readonly } from 'vue'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import AutoAssignService from '@/services/auto-assign.service'

export const useFetchAutoAssignConfigurations = () => {
  const autoAssignStore = useAutoAssignStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchConfigurations = async (budgetId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const configurations = await AutoAssignService.getConfigurationsByBudget(budgetId)
      autoAssignStore.setConfigurations(configurations)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load auto-assign configurations'
      console.error('Error loading auto-assign configurations:', err)
      autoAssignStore.setConfigurations([])
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchConfigurations
  }
}
