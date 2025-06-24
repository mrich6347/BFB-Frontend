import { ref, readonly } from 'vue'
import { useAccountStore } from '@/stores/account.store'
import { useBudgetOperations } from '@/composables/budgets/useBudgetOperations'
import { AccountService } from '@/services/account.service'

export const useCloseAccount = () => {
  const accountStore = useAccountStore()
  const { setReadyToAssign } = useBudgetOperations()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const closeAccount = async (accountId: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await AccountService.closeAccount(accountId)

      // Update Ready to Assign in budget store
      setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to find and update the account status
      accountStore.updateAccount(accountId, response.account)

      // If this was a credit card account, we need to refresh categories
      // This will be handled by the calling component since it involves category store

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to close account'
      console.error('Error closing account:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Operations
    closeAccount
  }
}
