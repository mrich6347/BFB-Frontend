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

// Global state to track which budget has been loaded
// This persists across different composable instances
const globalLastLoadedBudgetId = ref<string | null>(null)
const globalIsLoading = ref(false)
const globalError = ref<string | null>(null)

export function useMainDataOperations() {
  const budgetStore = useBudgetStore()
  const accountStore = useAccountStore()
  const categoryStore = useCategoryStore()
  const transactionStore = useTransactionStore()
  const userProfileStore = useUserProfileStore()
  const sharedGoalsStore = useSharedGoalsStore()

  // Use global state instead of local refs
  const isLoading = globalIsLoading
  const error = globalError
  const lastLoadedBudgetId = globalLastLoadedBudgetId

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

      // Invitations data
      if (mainData?.invitations) {
        sharedGoalsStore.setInvitations(mainData.invitations)
      }

      // All data distributed to stores successfully

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

      // Check if this is a "budget not found" error
      const isBudgetNotFound = errorMessage.includes('Budget not found') ||
                               errorMessage.includes('not found') ||
                               error.response?.status === 404

      if (isBudgetNotFound) {
        // Budget not found - this is handled gracefully now
        console.log('Budget not found')

        // Don't set error for budget not found - just silently redirect
        // This prevents showing error messages to users for deleted/missing budgets
      } else {
        // Only set error for non-budget-not-found errors
        setError(errorMessage)
      }

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
    // Check if we have a successful load recorded for this budget
    const hasLoadedBudget = lastLoadedBudgetId.value === budgetId

    // Check if the budget store has the current budget set
    const hasBudgetData = budgetStore.currentBudget?.id === budgetId

    // Check if we have essential data in other stores (categories are a good indicator)
    const hasCategoryData = categoryStore.categories.length > 0

    // Check if we have account data
    const hasAccountData = accountStore.accounts.length > 0

    // Not currently loading
    const notLoading = !isLoading.value

    return hasLoadedBudget && hasBudgetData && hasCategoryData && hasAccountData && notLoading
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
