import { ref, readonly } from 'vue'
import { useAccountStore } from '@/stores/account.store'
import { useBudgetOperations } from '@/composables/budgets/useBudgetOperations'
import { AccountService } from '@/services/account.service'
import { TransferService } from '@/services/transfer.service'
import type { CreateAccountDto, UpdateAccountDto, AccountResponse } from '@/types/DTO/account.dto'
import { v4 as uuidv4 } from 'uuid'
import { parseFormattedNumberToDecimal } from '@/utils/numberFormatUtil'

export const useAccountOperations = () => {
  const accountStore = useAccountStore()
  const { setReadyToAssign } = useBudgetOperations()
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
      // Composable responsibility: Format/validate data before sending
      const preparedAccount = prepareAccountCreation(request)

      // Call service to get data
      const response = await AccountService.createAccount(preparedAccount)

      // Update Ready to Assign in budget store
      setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to add the account to state
      accountStore.addAccount(response.account)

      // If this is a credit card account, we need to refresh categories
      // This will be handled by the calling component since it involves category store

      return response.account
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create account'
      console.error('Error creating account:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

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

  // Balance management operations (these handle business logic and update local state)
  const updateAccountBalance = (accountId: string, amount: number, isCleared: boolean) => {
    const account = accountStore.accounts.find(acc => acc.id === accountId)
    if (!account) return

    const updates: Partial<AccountResponse> = {}

    if (isCleared) {
      updates.cleared_balance = account.cleared_balance + amount
    } else {
      updates.uncleared_balance = account.uncleared_balance + amount
    }

    updates.working_balance = (updates.cleared_balance ?? account.cleared_balance) + (updates.uncleared_balance ?? account.uncleared_balance)

    accountStore.updateAccountBalances(accountId, updates)
  }

  const setAccountBalance = (accountId: string, accountData: any) => {
    // This is just a direct update from backend data
    accountStore.updateAccountBalances(accountId, {
      account_balance: accountData.account_balance,
      cleared_balance: accountData.cleared_balance,
      uncleared_balance: accountData.uncleared_balance,
      working_balance: accountData.working_balance
    })
  }

  const updateAccountBalanceOnClearedToggle = (accountId: string, amount: number, newClearedStatus: boolean) => {
    const account = accountStore.accounts.find(acc => acc.id === accountId)
    if (!account) return

    const updates: Partial<AccountResponse> = {}

    if (newClearedStatus) {
      // Moving from uncleared to cleared
      updates.uncleared_balance = account.uncleared_balance - amount
      updates.cleared_balance = account.cleared_balance + amount
    } else {
      // Moving from cleared to uncleared
      updates.cleared_balance = account.cleared_balance - amount
      updates.uncleared_balance = account.uncleared_balance + amount
    }

    // Working balance stays the same since we're just moving between cleared/uncleared
    updates.working_balance = account.working_balance

    accountStore.updateAccountBalances(accountId, updates)
  }

  const removeAccountBalance = (accountId: string, amount: number, isCleared: boolean) => {
    const account = accountStore.accounts.find(acc => acc.id === accountId)
    if (!account) return

    const updates: Partial<AccountResponse> = {}

    if (isCleared) {
      updates.cleared_balance = account.cleared_balance - amount
    } else {
      updates.uncleared_balance = account.uncleared_balance - amount
    }

    updates.working_balance = (updates.cleared_balance ?? account.cleared_balance) + (updates.uncleared_balance ?? account.uncleared_balance)

    accountStore.updateAccountBalances(accountId, updates)
  }

  const setAccounts = (accounts: AccountResponse[]) => {
    accountStore.setAccounts(accounts)
  }

  const resetAccountData = () => {
    accountStore.reset()
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),

    // CRUD Operations
    createAccount,
    updateAccount,
    closeAccount,
    reopenAccount,

    // Account-specific operations
    reconcileAccount,
    getTransferOptions,

    // Balance management
    updateAccountBalance,
    setAccountBalance,
    updateAccountBalanceOnClearedToggle,
    removeAccountBalance,

    // Utility operations
    setAccounts,
    resetAccountData,
    setLoading
  }
}
