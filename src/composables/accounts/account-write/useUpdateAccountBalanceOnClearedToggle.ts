import { useAccountStore } from '@/stores/account.store'
import type { AccountResponse } from '@/types/DTO/account.dto'

export const useUpdateAccountBalanceOnClearedToggle = () => {
  const accountStore = useAccountStore()

  // Moves amount between cleared and uncleared balances
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

  return {
    updateAccountBalanceOnClearedToggle
  }
}
