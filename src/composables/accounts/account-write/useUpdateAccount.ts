import { ref, readonly } from 'vue'
import { useAccountStore } from '@/stores/account.store'
import { useBudgetOperations } from '@/composables/budgets/useBudgetOperations'
import { AccountService } from '@/services/account.service'
import type { UpdateAccountDto } from '@/types/DTO/account.dto'

export const useUpdateAccount = () => {
  const accountStore = useAccountStore()
  const { setReadyToAssign } = useBudgetOperations()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const updateAccount = async (accountId: string, request: UpdateAccountDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await AccountService.updateAccount(accountId, request)

      // Update Ready to Assign in budget store
      setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to find and update the correct account
      accountStore.updateAccount(accountId, response.account)

      return response.account
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update account'
      console.error('Error updating account:', err)
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
    updateAccount
  }
}
