import { ref, readonly } from 'vue'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import { useBudgetStore } from '@/stores/budget.store'
import AutoAssignService from '@/services/auto-assign.service'
import type {
  AutoAssignConfigurationResponse,
  CreateAutoAssignConfigurationDto,
  UpdateAutoAssignConfigurationDto,
  ApplyAutoAssignConfigurationDto,
  ApplyAutoAssignResponse
} from '@/services/auto-assign.service'

export const useAutoAssignOperations = () => {
  const autoAssignStore = useAutoAssignStore()
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadConfigurations = async (budgetId: string) => {
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

  const loadConfiguration = async (budgetId: string, name: string) => {
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

  const applyConfiguration = async (formData: ApplyAutoAssignConfigurationDto): Promise<ApplyAutoAssignResponse> => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Format/validate data before sending
      const requestData = {
        ...formData,
        name: formData.name.trim()
      }

      // Call service
      const result = await AutoAssignService.applyConfiguration(requestData)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign in budget store
      budgetStore.setReadyToAssign(result.readyToAssign)

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to apply auto-assign configuration'
      console.error('Error applying auto-assign configuration:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentConfiguration = (config: AutoAssignConfigurationResponse | null) => {
    autoAssignStore.setCurrentConfiguration(config)
  }

  const resetAutoAssignData = () => {
    autoAssignStore.reset()
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Operations
    loadConfigurations,
    loadConfiguration,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    applyConfiguration,
    setCurrentConfiguration,
    resetAutoAssignData,
    setLoading
  }
}
