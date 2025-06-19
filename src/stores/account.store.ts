import { defineStore } from "pinia";
import { ref, computed, readonly } from 'vue'
import type { AccountResponse, AccountType } from "@/types/DTO/account.dto";

export const useAccountStore = defineStore('accountStore', () => {
  // State
  const accounts = ref<AccountResponse[]>([])

  // Getters
  const getAccountsByType = computed(() => (type: AccountType) => {
    return accounts.value.filter(account => account.account_type === type && account.is_active !== false);
  })

  const accountExistsByName = computed(() => (name: string, excludeAccountId?: string) => {
    return accounts.value.find(account =>
      account.name.toLowerCase() === name.toLowerCase() &&
      account.id !== excludeAccountId
    )
  })

  const activeAccounts = computed(() => {
    return accounts.value.filter(account => account.is_active !== false);
  })

  const closedAccounts = computed(() => {
    return accounts.value.filter(account => account.is_active === false);
  })

  const getAccountById = computed(() => (id: string) => {
    return accounts.value.find(account => account.id === id)
  })

  // State mutations
  const setAccounts = (newAccounts: AccountResponse[]) => {
    accounts.value = newAccounts
  }

  const addAccount = (account: AccountResponse) => {
    accounts.value.push(account)
  }

  const updateAccount = (id: string, updates: Partial<AccountResponse>) => {
    const index = accounts.value.findIndex(account => account.id === id)
    if (index !== -1) {
      accounts.value[index] = { ...accounts.value[index], ...updates }
    }
  }

  const removeAccount = (id: string) => {
    const index = accounts.value.findIndex(account => account.id === id)
    if (index !== -1) {
      accounts.value.splice(index, 1)
    }
  }

  // Simple balance update method - just takes the new balance data and updates the account
  const updateAccountBalances = (accountId: string, balanceUpdates: Partial<AccountResponse>) => {
    const accountIndex = accounts.value.findIndex(account => account.id === accountId)
    if (accountIndex !== -1) {
      accounts.value[accountIndex] = { ...accounts.value[accountIndex], ...balanceUpdates }
    }
  }

  const reset = () => {
    accounts.value = []
  }

  return {
    // State (readonly)
    accounts: readonly(accounts),

    // Getters
    getAccountsByType,
    accountExistsByName,
    activeAccounts,
    closedAccounts,
    getAccountById,

    // Mutations
    setAccounts,
    addAccount,
    updateAccount,
    removeAccount,
    updateAccountBalances,
    reset
  }
})
