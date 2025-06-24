import { ref, readonly } from 'vue'
import { useAccountStore } from '@/stores/account.store'
import { AccountService } from '@/services/account.service'

export const useReconcileAccount = () => {
  const accountStore = useAccountStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const reconcileAccount = async (accountId: string, actualBalance: number) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await AccountService.reconcileAccount(accountId, actualBalance)

      // Update the account balance optimistically
      const accountIndex = accountStore.accounts.findIndex(account => account.id === accountId)
      if (accountIndex !== -1) {
        const account = accountStore.accounts[accountIndex]
        accountStore.updateAccount(accountId, {
          account_balance: actualBalance,
          cleared_balance: actualBalance,
          working_balance: actualBalance + account.uncleared_balance
        })
      }

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reconcile account'
      console.error('Error reconciling account:', err)
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
    reconcileAccount
  }
}
