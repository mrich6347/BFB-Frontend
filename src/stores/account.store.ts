import { defineStore } from "pinia";
import type { CreateAccountDto, AccountResponse, AccountType, AccountWithReadyToAssignResponse, UpdateAccountDto, CloseAccountResponse } from "@/types/DTO/account.dto";
import { AccountService } from "@/services/account.service";
import { useAccounts } from "@/composables/accounts/useCreateAccount";
import { useBudgetStore } from "./budget.store";
import { useCategoryStore } from "./category.store";

export const useAccountStore = defineStore('accountStore', {
    state: () => ({
        accounts: [] as AccountResponse[],
        isLoading: true
    }),
    getters: {
        getAccountsByType: (state) => (type: AccountType) => {
            return state.accounts.filter(account => account.account_type === type && account.is_active !== false);
        },
        accountExistsByName: (state) => (name: string, excludeAccountId?: string) => {
            return state.accounts.find(account =>
                account.name.toLowerCase() === name.toLowerCase() &&
                account.id !== excludeAccountId
            )
        },
        activeAccounts: (state) => {
            return state.accounts.filter(account => account.is_active !== false);
        },
        closedAccounts: (state) => {
            return state.accounts.filter(account => account.is_active === false);
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

            // If this is a credit card account, refresh categories to show the new payment category
            if (response.account.account_type === 'CREDIT') {
                const categoryStore = useCategoryStore();
                await categoryStore.fetchAllCategoryData(response.account.budget_id);
            }

            return response.account;
        },
        async updateAccount(accountId: string, request: UpdateAccountDto) {
            try {
                const response = await AccountService.updateAccount(accountId, request);

                // Update Ready to Assign in budget store
                const budgetStore = useBudgetStore();
                budgetStore.setReadyToAssign(response.readyToAssign);

                // Update the account in the accounts list
                const accountIndex = this.accounts.findIndex(account => account.id === accountId);
                if (accountIndex !== -1) {
                    this.accounts[accountIndex] = response.account;
                }

                return response.account;
            } catch (error) {
                console.error('Failed to update account:', error);
                throw error;
            }
        },
        async closeAccount(accountId: string) {
            try {
                const response = await AccountService.closeAccount(accountId);

                // Update Ready to Assign in budget store
                const budgetStore = useBudgetStore();
                budgetStore.setReadyToAssign(response.readyToAssign);

                // Update the account in the accounts list to mark as inactive
                const accountIndex = this.accounts.findIndex(account => account.id === accountId);
                if (accountIndex !== -1) {
                    this.accounts[accountIndex] = response.account;
                }

                // If this was a credit card account, refresh categories to remove the payment category
                const account = this.accounts[accountIndex];
                if (account && account.account_type === 'CREDIT') {
                    const categoryStore = useCategoryStore();
                    await categoryStore.fetchAllCategoryData(account.budget_id);
                }

                return response;
            } catch (error) {
                console.error('Failed to close account:', error);
                throw error;
            }
        },
        async reopenAccount(accountId: string) {
            try {
                const response = await AccountService.reopenAccount(accountId);

                // Update Ready to Assign in budget store
                const budgetStore = useBudgetStore();
                budgetStore.setReadyToAssign(response.readyToAssign);

                // Update the account in the accounts list to mark as active
                const accountIndex = this.accounts.findIndex(account => account.id === accountId);
                if (accountIndex !== -1) {
                    this.accounts[accountIndex] = response.account;
                }

                // If this is a credit card account, refresh categories to show the payment category again
                if (response.account.account_type === 'CREDIT') {
                    const categoryStore = useCategoryStore();
                    await categoryStore.fetchAllCategoryData(response.account.budget_id);
                }

                return response.account;
            } catch (error) {
                console.error('Failed to reopen account:', error);
                throw error;
            }
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

        async reconcileAccount(accountId: string, actualBalance: number) {
            try {
                const response = await AccountService.reconcileAccount(accountId, actualBalance)

                // Update the account balance optimistically
                const accountIndex = this.accounts.findIndex(account => account.id === accountId)
                if (accountIndex !== -1) {
                    this.accounts[accountIndex].account_balance = actualBalance
                    this.accounts[accountIndex].cleared_balance = actualBalance
                    this.accounts[accountIndex].working_balance = actualBalance + this.accounts[accountIndex].uncleared_balance
                }

                return response
            } catch (error) {
                console.error('Failed to reconcile account:', error)
                throw error
            }
        },

        reset() {
            this.accounts = []
            this.isLoading = true
        }
    }
})
