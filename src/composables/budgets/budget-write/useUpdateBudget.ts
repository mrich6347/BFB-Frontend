import { ref, readonly } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import BudgetService from '@/services/budget.service'
import type { CreateBudgetDto } from '@/types/DTO/budget.dto'

export const useUpdateBudget = () => {
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const updateBudget = async (id: string, formData: Partial<CreateBudgetDto>) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Prep the data
      const requestData: Partial<CreateBudgetDto> = {
        ...formData
      }

      if (formData.name) {
        requestData.name = formData.name.trim()
      }

      // Call service
      const updatedBudget = await BudgetService.updateBudget(id, requestData as CreateBudgetDto)

      // Store responsibility: Know HOW to find and update the correct budget
      budgetStore.updateBudget(id, updatedBudget)

      return updatedBudget
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update budget'
      console.error('Error updating budget:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    updateBudget
  }
}
