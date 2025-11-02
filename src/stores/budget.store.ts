import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { BudgetResponse } from '@/types/DTO/budget.dto'
import { getCurrentMonthYear } from '@/utils/dateContext'

export const useBudgetStore = defineStore('budgetStore', () => {
  // Initialize current month/year
  const { year, month } = getCurrentMonthYear()

  // State
  const budgets = ref<BudgetResponse[]>([])
  const currentBudget = ref<BudgetResponse | null>(null)
  const currentYear = ref<number>(year)
  const currentMonth = ref<number>(month)
  const readyToAssign = ref<number>(0)

  // Getters
  const getBudgetById = computed(() => (id: string) => {
    if (!Array.isArray(budgets.value)) {
      console.error('budgets.value is not an array:', budgets.value)
      return undefined
    }
    return budgets.value.find(b => b.id === id)
  })

  const budgetExistsByName = computed(() => (name: string) => {
    if (!Array.isArray(budgets.value)) {
      console.error('budgets.value is not an array:', budgets.value)
      return undefined
    }
    return budgets.value.find(b => b.name.toLowerCase() === name.toLowerCase())
  })

  const currentMonthName = computed(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return `${monthNames[currentMonth.value - 1]} ${currentYear.value}`
  })

  // State mutations
  const setBudgets = (newBudgets: BudgetResponse[]) => {
    if (!Array.isArray(newBudgets)) {
      console.error('setBudgets received non-array:', newBudgets)
      budgets.value = []
      return
    }
    budgets.value = newBudgets
  }

  const addBudget = (budget: BudgetResponse) => {
    if (!Array.isArray(budgets.value)) {
      console.error('budgets.value is not an array when adding budget:', budgets.value)
      budgets.value = [budget]
      return
    }
    budgets.value.unshift(budget)
  }

  const updateBudget = (id: string, updates: Partial<BudgetResponse>) => {
    if (!Array.isArray(budgets.value)) {
      console.error('budgets.value is not an array when updating budget:', budgets.value)
      return
    }
    const index = budgets.value.findIndex(b => b.id === id)
    if (index !== -1) {
      budgets.value[index] = { ...budgets.value[index], ...updates }
    }

    // Also update currentBudget if it's the same one
    if (currentBudget.value?.id === id) {
      currentBudget.value = { ...currentBudget.value, ...updates }
    }
  }

  const removeBudget = (id: string) => {
    if (!Array.isArray(budgets.value)) {
      console.error('budgets.value is not an array when removing budget:', budgets.value)
      return
    }
    const index = budgets.value.findIndex(b => b.id === id)
    if (index !== -1) {
      budgets.value.splice(index, 1)
    }
  }

  const setCurrentBudget = (budget: BudgetResponse | null) => {
    currentBudget.value = budget
  }

  const setReadyToAssign = (amount: number) => {
    readyToAssign.value = amount
  }

  const setCurrentMonth = (year: number, month: number) => {
    currentYear.value = year
    currentMonth.value = month
  }

  const ensureCurrentMonth = () => {
    const { year, month } = getCurrentMonthYear()
    currentYear.value = year
    currentMonth.value = month
  }

  const reset = () => {
    budgets.value = []
    currentBudget.value = null
    readyToAssign.value = 0
    const { year, month } = getCurrentMonthYear()
    currentYear.value = year
    currentMonth.value = month
  }

  return {
    // State (readonly)
    budgets: readonly(budgets),
    currentBudget: readonly(currentBudget),
    currentYear: readonly(currentYear),
    currentMonth: readonly(currentMonth),
    readyToAssign: readonly(readyToAssign),

    // Getters
    getBudgetById,
    budgetExistsByName,
    currentMonthName,

    // Mutations
    setBudgets,
    addBudget,
    updateBudget,
    removeBudget,
    setCurrentBudget,
    setReadyToAssign,
    setCurrentMonth,
    ensureCurrentMonth,
    reset
  }
})
