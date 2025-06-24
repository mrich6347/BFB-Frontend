import { ref, readonly } from 'vue'
import { useAccountStore } from '@/stores/account.store'
import { useBudgetUtils } from '@/composables/budgets/budget-read/useBudgetUtils'
import { AccountService } from '@/services/account.service'

export const useReopenAccount = () => {
  const accountStore = useAccountStore()
  const { setReadyToAssign } = useBudgetUtils()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const reopenAccount = async (accountId: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await AccountService.reopenAccount(accountId)

      // Update Ready to Assign in budget store
      setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to find and update the account status
      accountStore.updateAccount(accountId, response.account)

      // If this is a credit card account, we need to refresh categories
      // This will be handled by the calling component since it involves category store

      return response.account
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reopen account'
      console.error('Error reopening account:', err)
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
    reopenAccount
  }
}
