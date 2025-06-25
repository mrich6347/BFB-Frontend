import { ref, readonly } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import AutoAssignService from '@/services/auto-assign.service'
import type { ApplyAutoAssignConfigurationDto, ApplyAutoAssignResponse } from '@/services/auto-assign.service'

export const useApplyAutoAssignConfiguration = () => {
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const applyConfiguration = async (formData: ApplyAutoAssignConfigurationDto): Promise<ApplyAutoAssignResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const requestData = {
        ...formData,
        name: formData.name.trim()
      }

      const result = await AutoAssignService.applyConfiguration(requestData)

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

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    applyConfiguration
  }
}
