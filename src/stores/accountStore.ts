import { AccountType, type Account } from "../types/models/account";
import { defineStore } from "pinia";
import type { CreateAccountRequest } from "@/types/DTO/account.dto";
import { AccountService } from "@/services/accountService";
import { useAccounts } from "@/composables/accounts/useCreateAccount";

export const useAccountStore = defineStore('accountStore', {
    state: () => ({
        accounts: [] as Account[],
        isLoading: true
    }),
    getters: {
        getAccountsByType: (state) => (type: AccountType) => {
            return state.accounts.filter(account => account.account_type === type);
        },
    },
    actions: {
        setAccounts(accounts: Account[]) {
            this.accounts = accounts
        },
        async createAccount(request: CreateAccountRequest) {
            const { prepareAccountCreation } = useAccounts();
            const preparedAccount = prepareAccountCreation(request);
            
            const response = await AccountService.createAccount(preparedAccount);
            this.accounts.push(response);
            return response;
        },
        reset() {
            this.accounts = []
            this.isLoading = true
        }
    }
})