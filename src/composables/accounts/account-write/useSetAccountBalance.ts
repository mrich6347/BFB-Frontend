import { useAccountStore } from '@/stores/account.store'

export const useSetAccountBalance = () => {
  const accountStore = useAccountStore()

  // Direct update from backend data
  const setAccountBalance = (accountId: string, accountData: any) => {
    accountStore.updateAccountBalances(accountId, {
      account_balance: accountData.account_balance,
      cleared_balance: accountData.cleared_balance,
      uncleared_balance: accountData.uncleared_balance,
      working_balance: accountData.working_balance
    })
  }

  return {
    setAccountBalance
  }
}
