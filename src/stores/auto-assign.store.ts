import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  AutoAssignConfigurationSummary,
  AutoAssignConfigurationResponse
} from '@/services/auto-assign.service'

export const useAutoAssignStore = defineStore('autoAssign', () => {
  // State
  const configurations = ref<AutoAssignConfigurationSummary[]>([])
  const currentConfiguration = ref<AutoAssignConfigurationResponse | null>(null)

  // Getters
  const getConfigurationByName = computed(() => (name: string) => {
    return configurations.value.find(config => config.name === name)
  })

  const hasConfigurations = computed(() => {
    return configurations.value.length > 0
  })

  // Helper function to create summary from full configuration
  const createSummaryFromConfig = (config: AutoAssignConfigurationResponse): AutoAssignConfigurationSummary => {
    return {
      name: config.name,
      budget_id: config.budget_id,
      user_id: config.user_id,
      item_count: config.items.length,
      total_amount: config.items.reduce((sum, item) => sum + item.amount, 0),
      created_at: config.created_at,
      updated_at: config.updated_at
    }
  }

  // State mutations
  const setConfigurations = (newConfigurations: AutoAssignConfigurationSummary[]) => {
    configurations.value = newConfigurations
  }

  const addConfiguration = (config: AutoAssignConfigurationResponse) => {
    const summary = createSummaryFromConfig(config)
    configurations.value.unshift(summary) // Add to beginning
  }

  const updateConfiguration = (name: string, config: AutoAssignConfigurationResponse) => {
    const index = configurations.value.findIndex(c => c.name === name)
    if (index !== -1) {
      const summary = createSummaryFromConfig(config)
      configurations.value[index] = summary
    }

    // Update current configuration if it matches
    if (currentConfiguration.value?.name === name) {
      currentConfiguration.value = config
    }
  }

  const removeConfiguration = (name: string) => {
    configurations.value = configurations.value.filter(config => config.name !== name)

    // Clear current configuration if it matches
    if (currentConfiguration.value?.name === name) {
      currentConfiguration.value = null
    }
  }

  const setCurrentConfiguration = (config: AutoAssignConfigurationResponse | null) => {
    currentConfiguration.value = config
  }

  const reset = () => {
    configurations.value = []
    currentConfiguration.value = null
  }

  return {
    // State (readonly)
    configurations: readonly(configurations),
    currentConfiguration: readonly(currentConfiguration),

    // Getters
    getConfigurationByName,
    hasConfigurations,

    // Mutations
    setConfigurations,
    addConfiguration,
    updateConfiguration,
    removeConfiguration,
    setCurrentConfiguration,
    reset
  }
})
