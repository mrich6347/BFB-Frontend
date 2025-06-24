import { ref, readonly } from 'vue'
import { TransferService } from '@/services/transfer.service'
import type { AccountResponse } from '@/types/DTO/account.dto'

export const useGetTransferOptions = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const getTransferOptions = async (accountId: string): Promise<AccountResponse[]> => {
    isLoading.value = true
    error.value = null

    try {
      return await TransferService.getTransferOptions(accountId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get transfer options'
      console.error('Error getting transfer options:', err)
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
    getTransferOptions
  }
}
