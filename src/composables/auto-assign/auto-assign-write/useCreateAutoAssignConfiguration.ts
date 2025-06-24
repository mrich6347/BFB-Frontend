import { ref, readonly } from 'vue'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import AutoAssignService from '@/services/auto-assign.service'
import type { CreateAutoAssignConfigurationDto } from '@/services/auto-assign.service'

export const useCreateAutoAssignConfiguration = () => {
  const autoAssignStore = useAutoAssignStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const createConfiguration = async (formData: CreateAutoAssignConfigurationDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Format/validate data before sending
      const requestData = {
        ...formData,
        name: formData.name.trim(),
        items: formData.items.filter(item => item.amount > 0) // Remove zero amounts
      }

      // Call service to get data
      const newConfig = await AutoAssignService.createConfiguration(requestData)

      // Store responsibility: Know HOW to add the configuration to state
      autoAssignStore.addConfiguration(newConfig)
      autoAssignStore.setCurrentConfiguration(newConfig)

      return newConfig
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create auto-assign configuration'
      console.error('Error creating auto-assign configuration:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    createConfiguration
  }
}
