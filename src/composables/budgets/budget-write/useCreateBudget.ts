import { ref, readonly } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import BudgetService from '@/services/budget.service'
import type { CreateBudgetDto } from '@/types/DTO/budget.dto'

export const useCreateBudget = () => {
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const createBudget = async (formData: CreateBudgetDto) => {
    isLoading.value = true
    error.value = null

    try {
      const requestData = {
        ...formData,
        name: formData.name.trim()
      }

      const newBudget = await BudgetService.createBudget(requestData)

      budgetStore.addBudget(newBudget)
      budgetStore.setCurrentBudget(newBudget)

      return newBudget
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create budget'
      console.error('Error creating budget:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    createBudget
  }
}
