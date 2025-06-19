import { ref, computed } from 'vue'
import { MainDataService } from '../../services/common/mainData.service'
import { useBudgetStore } from '../../stores/budget.store'
import { useAccountStore } from '../../stores/account.store'
import { useCategoryStore } from '../../stores/category.store'
import { useTransactionStore } from '../../stores/transaction.store'
import { useUserProfileStore } from '../../stores/user-profile.store'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import type { MainDataResponse } from '../../types/DTO/mainData.dto'
import type { UserDateContext } from '../../utils/dateContext'

export function useMainDataOperations() {
  const budgetStore = useBudgetStore()
  const accountStore = useAccountStore()
  const categoryStore = useCategoryStore()
  const transactionStore = useTransactionStore()
  const userProfileStore = useUserProfileStore()
  const sharedGoalsStore = useSharedGoalsStore()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastLoadedBudgetId = ref<string | null>(null)

  const clearError = () => {
    error.value = null
  }

  const setError = (errorMessage: string) => {
    error.value = errorMessage
    console.error('Main data loading error:', errorMessage)
  }

  const resetAllStores = () => {
    budgetStore.reset()
    accountStore.reset()
    categoryStore.reset()
    transactionStore.reset()
    userProfileStore.reset()
    sharedGoalsStore.reset()
  }

  const distributeMainDataToStores = async (mainData: MainDataResponse) => {
    try {
      // Budget data
      if (mainData?.budget) {
        budgetStore.setCurrentBudget(mainData.budget)
      }

      // Account data
      if (mainData?.accounts?.length) {
        accountStore.setAccounts(mainData.accounts)
      }

      // Category data
      if (mainData?.categoryGroups) {
        categoryStore.setCategoryGroups(mainData.categoryGroups)
      }
      if (mainData?.categories) {
        categoryStore.setCategories(mainData.categories)
      }
      if (mainData?.categoryBalances) {
        categoryStore.setCategoryBalances(mainData.categoryBalances)
      }

      // Ready to assign
      if (mainData?.readyToAssign !== undefined) {
        budgetStore.setReadyToAssign(mainData.readyToAssign)
      }

      // Auto assign configurations (lazy loaded)
      if (mainData?.autoAssignConfigurations) {
        const { useAutoAssignStore } = await import('../../stores/auto-assign.store')
        const autoAssignStore = useAutoAssignStore()
        autoAssignStore.setConfigurations(mainData.autoAssignConfigurations)
      }

      // Transaction data
      if (mainData?.transactions) {
        transactionStore.setTransactions(mainData.transactions)
      }

      // User profile data
      if (mainData?.userProfile) {
        userProfileStore.setCurrentProfile(mainData.userProfile)
      }

      // Shared goals data
      if (mainData?.sharedGoals) {
        sharedGoalsStore.setGoals(mainData.sharedGoals)
      }

      // Set loading states to false
      categoryStore.setIsLoading(false)

    } catch (error: any) {
      throw new Error(`Failed to distribute main data to stores: ${error.message}`)
    }
  }

  const loadMainData = async (budgetId: string, userDateContext?: UserDateContext, forceReload: boolean = false): Promise<MainDataResponse | null> => {
    // Skip loading if we already have data for this budget and not forcing reload
    if (!forceReload && lastLoadedBudgetId.value === budgetId && budgetStore.currentBudget?.id === budgetId) {
      return null
    }

    try {
      isLoading.value = true
      clearError()

      const mainData = await MainDataService.getMainData(budgetId, userDateContext)

      if (!mainData) {
        throw new Error('No data received from main data service')
      }

      await distributeMainDataToStores(mainData)
      lastLoadedBudgetId.value = budgetId

      return mainData
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load main data'
      setError(errorMessage)

      // Reset stores on error to prevent stale data
      resetAllStores()
      lastLoadedBudgetId.value = null

      throw error
    } finally {
      isLoading.value = false
    }
  }

  const refreshMainData = async (budgetId?: string, userDateContext?: UserDateContext): Promise<MainDataResponse | null> => {
    const targetBudgetId = budgetId || budgetStore.currentBudget?.id

    if (!targetBudgetId) {
      setError('No budget ID available for refresh')
      return null
    }

    return loadMainData(targetBudgetId, userDateContext, true)
  }

  const switchBudget = async (newBudgetId: string, userDateContext?: UserDateContext): Promise<MainDataResponse | null> => {
    // Always force reload when switching budgets
    return loadMainData(newBudgetId, userDateContext, true)
  }

  const isDataLoadedForBudget = computed(() => (budgetId: string) => {
    return lastLoadedBudgetId.value === budgetId &&
           budgetStore.currentBudget?.id === budgetId &&
           !isLoading.value
  })

  const needsDataLoad = computed(() => (budgetId: string) => {
    return !isDataLoadedForBudget.value(budgetId)
  })

  const ensureDataLoaded = async (budgetId: string, userDateContext?: UserDateContext): Promise<boolean> => {
    // If data is already loaded for this budget, return true
    if (isDataLoadedForBudget.value(budgetId)) {
      return true
    }

    // Otherwise, load the data
    try {
      await loadMainData(budgetId, userDateContext)
      return true
    } catch (error) {
      console.error('Failed to ensure data loaded:', error)
      return false
    }
  }

  return {
    // State
    isLoading,
    error,
    lastLoadedBudgetId,

    // Computed
    isDataLoadedForBudget,
    needsDataLoad,

    // Operations
    loadMainData,
    refreshMainData,
    switchBudget,
    ensureDataLoaded,
    resetAllStores,
    clearError,

    // Store references for convenience
    budgetStore,
    accountStore,
    categoryStore,
    transactionStore,
    userProfileStore,
    sharedGoalsStore
  }
}
