import { ref, readonly } from 'vue'
import { useAccountStore } from '@/stores/account.store'
import { AccountService } from '@/services/account.service'
import type { CreateAccountDto } from '@/types/DTO/account.dto'
import { v4 as uuidv4 } from 'uuid'
import { parseFormattedNumberToDecimal } from '@/utils/numberFormatUtil'
import { useBudgetUtils } from '../../budgets/budget-read/useBudgetUtils'

export const useCreateAccount = () => {
  const accountStore = useAccountStore()
  const { setReadyToAssign } = useBudgetUtils()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Helper function to prepare account creation data
  const prepareAccountCreation = (request: CreateAccountDto) => {
    const id = uuidv4()
    const inputBalanceStr = String(request.account_balance).trim()

    // parsing the number to our DB format ex: 1,234.56 -> 1234.56
    const decimalBalanceStr = parseFormattedNumberToDecimal(inputBalanceStr)

    let numericBalance = parseFloat(decimalBalanceStr)

    return {
      ...request,
      id,
      account_balance: numericBalance,
    }
  }

  const createAccount = async (request: CreateAccountDto) => {
    isLoading.value = true
    error.value = null

    try {
      const preparedAccount = prepareAccountCreation(request)

      const response = await AccountService.createAccount(preparedAccount)

      setReadyToAssign(response.readyToAssign)
      accountStore.addAccount(response.account)

      return response.account
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create account'
      console.error('Error creating account:', err)
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
    createAccount
  }
}
