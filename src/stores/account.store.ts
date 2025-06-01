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
        reset() {
            this.accounts = []
            this.isLoading = true
        }
    }
})
