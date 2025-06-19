import { ref, readonly } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import BudgetService from '@/services/budget.service'
import type { BudgetResponse, CreateBudgetDto } from '@/types/DTO/budget.dto'

export const useBudgetOperations = () => {
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadAllBudgets = async () => {
    isLoading.value = true
    error.value = null

    try {
      const budgets = await BudgetService.getAllBudgets()
      budgetStore.setBudgets(budgets)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load budgets'
      console.error('Error loading budgets:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadBudget = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const budget = await BudgetService.getBudget(id)
      budgetStore.setCurrentBudget(budget)
      return budget
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load budget'
      console.error('Error loading budget:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createBudget = async (formData: CreateBudgetDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Format/validate data before sending
      const requestData = {
        ...formData,
        name: formData.name.trim()
      }

      // Call service to get data
      const newBudget = await BudgetService.createBudget(requestData)

      // Store responsibility: Know HOW to add the budget to state
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

  const setCurrentBudget = (budget: BudgetResponse | null) => {
    budgetStore.setCurrentBudget(budget)
  }

  const setReadyToAssign = (amount: number) => {
    budgetStore.setReadyToAssign(amount)
  }

  const ensureCurrentMonth = () => {
    budgetStore.ensureCurrentMonth()
  }

  const checkAndHandleMonthRollover = () => {
    // Just ensure current month - backend handles the rest
    budgetStore.ensureCurrentMonth()
  }

  const resetBudgetData = () => {
    budgetStore.reset()
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Operations
    loadAllBudgets,
    loadBudget,
    createBudget,
    updateBudget,
    setCurrentBudget,
    setReadyToAssign,
    ensureCurrentMonth,
    checkAndHandleMonthRollover,
    resetBudgetData,
    setLoading
  }
}
