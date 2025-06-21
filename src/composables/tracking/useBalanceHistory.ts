import { ref, computed } from 'vue'
import { TrackingAccountService, type BalanceHistoryPoint } from '@/services/tracking-account.service'

// Shared state for balance history to avoid duplicate API calls
const balanceHistoryCache = ref<Record<string, BalanceHistoryPoint[]>>({})
const loadingStates = ref<Record<string, boolean>>({})
const errorStates = ref<Record<string, string | null>>({})

export function useBalanceHistory(accountId: string) {
  const isLoading = computed(() => loadingStates.value[accountId] || false)
  const error = computed(() => errorStates.value[accountId] || null)
  const balanceHistory = computed(() => balanceHistoryCache.value[accountId] || [])

  const loadBalanceHistory = async (forceReload: boolean = false) => {
    // Skip loading if we already have data and not forcing reload
    if (!forceReload && balanceHistoryCache.value[accountId]) {
      return balanceHistoryCache.value[accountId]
    }

    try {
      loadingStates.value[accountId] = true
      errorStates.value[accountId] = null
      
      const history = await TrackingAccountService.getBalanceHistory(accountId)
      balanceHistoryCache.value[accountId] = history
      
      return history
    } catch (err) {
      console.error('Failed to load balance history:', err)
      errorStates.value[accountId] = 'Failed to load balance history'
      throw err
    } finally {
      loadingStates.value[accountId] = false
    }
  }

  const refreshBalanceHistory = () => {
    return loadBalanceHistory(true)
  }

  const clearCache = (specificAccountId?: string) => {
    if (specificAccountId) {
      delete balanceHistoryCache.value[specificAccountId]
      delete loadingStates.value[specificAccountId]
      delete errorStates.value[specificAccountId]
    } else {
      balanceHistoryCache.value = {}
      loadingStates.value = {}
      errorStates.value = {}
    }
  }

  return {
    balanceHistory,
    isLoading,
    error,
    loadBalanceHistory,
    refreshBalanceHistory,
    clearCache
  }
}
