import type { Ref } from 'vue'
import { useReorderAccounts } from '@/composables/accounts/account-write/useReorderAccounts'
import type { AccountResponse, AccountType } from '@/types/DTO/account.dto'

export function useAccountDragAndDrop(
  accountLists: Record<AccountType, AccountResponse[]>,
  getAccountsForType: (type: AccountType) => AccountResponse[]
) {
  const { reorderAccounts } = useReorderAccounts()

  // Handle change event from account draggable
  const onChange = async (event: any, accountType: AccountType) => {
    // Only process if this is a moved event
    if (!event.moved) {
      return
    }

    // Get the account IDs in the new order
    const accountIds = accountLists[accountType].map(account => account.id)

    // Validate that all account IDs are valid UUIDs
    const validAccountIds = accountIds.filter(id => id && typeof id === 'string' && id.trim() !== '')
    if (validAccountIds.length !== accountIds.length) {
      console.error('Invalid account IDs detected:', accountIds)
      // Reset to original order
      accountLists[accountType] = [...getAccountsForType(accountType)]
      return
    }

    try {
      // Call composable to handle the reorder
      await reorderAccounts(validAccountIds)
    } catch (error) {
      console.error('Failed to reorder accounts:', error)
      // Reset to original order if there's an error
      accountLists[accountType] = [...getAccountsForType(accountType)]
    }
  }

  return {
    // Methods
    onChange
  }
}
