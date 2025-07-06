import { ref, readonly } from 'vue'
import { useAccountStore } from '@/stores/account.store'
import { AccountService } from '@/services/account.service'

export const useReorderAccounts = () => {
  const accountStore = useAccountStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const reorderAccounts = async (accountIds: string[]) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service first
      await AccountService.reorderAccounts({ account_ids: accountIds })

      // Store responsibility: Update display orders after successful API call
      accountStore.reorderAccounts(accountIds)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder accounts'
      console.error('Error reordering accounts:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    reorderAccounts
  }
}
