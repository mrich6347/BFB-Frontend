import { useAccountStore } from '@/stores/account.store'
import type { AccountResponse } from '@/types/DTO/account.dto'

export const useUpdateAccountBalance = () => {
  const accountStore = useAccountStore()

  // Balance management operation - adds amount to account balance
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

  return {
    updateAccountBalance
  }
}
