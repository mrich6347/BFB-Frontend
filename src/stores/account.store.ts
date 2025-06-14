import { defineStore } from "pinia";
import type { CreateAccountDto, AccountResponse, AccountType, AccountWithReadyToAssignResponse } from "@/types/DTO/account.dto";
import { AccountService } from "@/services/account.service";
import { useAccounts } from "@/composables/accounts/useCreateAccount";
import { useBudgetStore } from "./budget.store";

export const useAccountStore = defineStore('accountStore', {
    state: () => ({
        accounts: [] as AccountResponse[],
        isLoading: true
    }),
    getters: {
        getAccountsByType: (state) => (type: AccountType) => {
            return state.accounts.filter(account => account.account_type === type);
        },
        accountExistsByName: (state) => (name: string) => {
            return state.accounts.find(account => account.name.toLowerCase() === name.toLowerCase())
        }
    },
    actions: {
        setAccounts(accounts: AccountResponse[]) {
            this.accounts = accounts
        },
        async createAccount(request: CreateAccountDto) {
            const { prepareAccountCreation } = useAccounts();
            const preparedAccount = prepareAccountCreation(request);

            const response = await AccountService.createAccount(preparedAccount);

            // Update Ready to Assign in budget store
            const budgetStore = useBudgetStore();
            budgetStore.setReadyToAssign(response.readyToAssign);

            // Add the account to the accounts list
            this.accounts.push(response.account);
            return response.account;
        },
        updateAccountBalance(accountId: string, amount: number, isCleared: boolean) {
            const accountIndex = this.accounts.findIndex(account => account.id === accountId)
            if (accountIndex === -1) return

            const account = this.accounts[accountIndex]

            if (isCleared) {
                account.cleared_balance += amount
            } else {
                account.uncleared_balance += amount
            }

            account.working_balance = account.cleared_balance + account.uncleared_balance
        },

        updateAccountBalanceOnClearedToggle(accountId: string, amount: number, newClearedStatus: boolean) {
            const accountIndex = this.accounts.findIndex(account => account.id === accountId)
            if (accountIndex === -1) return

            const account = this.accounts[accountIndex]

            if (newClearedStatus) {
                // Moving from uncleared to cleared
                account.uncleared_balance -= amount
                account.cleared_balance += amount
            } else {
                // Moving from cleared to uncleared
                account.cleared_balance -= amount
                account.uncleared_balance += amount
            }

            // Working balance stays the same since we're just moving between cleared/uncleared
        },

        removeAccountBalance(accountId: string, amount: number, isCleared: boolean) {
            const accountIndex = this.accounts.findIndex(account => account.id === accountId)
            if (accountIndex === -1) return

            const account = this.accounts[accountIndex]

            if (isCleared) {
                account.cleared_balance -= amount
            } else {
                account.uncleared_balance -= amount
            }

            account.working_balance = account.cleared_balance + account.uncleared_balance
        },

        reset() {
            this.accounts = []
            this.isLoading = true
        }
    }
})
