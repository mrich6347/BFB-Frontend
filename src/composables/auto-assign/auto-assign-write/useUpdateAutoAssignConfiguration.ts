import { ref, readonly } from 'vue'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import AutoAssignService from '@/services/auto-assign.service'
import type { UpdateAutoAssignConfigurationDto } from '@/services/auto-assign.service'

export const useUpdateAutoAssignConfiguration = () => {
  const autoAssignStore = useAutoAssignStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const updateConfiguration = async (budgetId: string, name: string, formData: UpdateAutoAssignConfigurationDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Prep the data
      const requestData: UpdateAutoAssignConfigurationDto = {
        ...formData
      }

      if (formData.name) {
        requestData.name = formData.name.trim()
      }

      if (formData.items) {
        requestData.items = formData.items.filter(item => item.amount > 0) // Remove zero amounts
      }

      // Call service
      const updatedConfig = await AutoAssignService.updateConfiguration(budgetId, name, requestData)

      // Store responsibility: Know HOW to find and update the correct configuration
      autoAssignStore.updateConfiguration(name, updatedConfig)

      return updatedConfig
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update auto-assign configuration'
      console.error('Error updating auto-assign configuration:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    updateConfiguration
  }
}
