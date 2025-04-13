import type { Account, AccountType } from "../types/models/account";
import { defineStore } from "pinia";
import type { CreateAccountRequest } from "@/types/DTO/account.dto";
import { AccountService } from "@/services/accountService";

export const useAccountStore = defineStore('accountStore', {
    state: () => ({
        accounts: [] as Account[],
        isLoading: true
    }),
    getters: {
      getAccountsByType: (state) => (type: AccountType) => {
        console.log('Account type filter:', type);
        return state.accounts.filter(account => account.account_type === type);
      },
    },
    actions: {
        setAccounts(accounts: Account[]) {
            this.accounts = accounts
        },   
        async createAccount(request: CreateAccountRequest) {
            const response = await AccountService.createAccount(request)
            console.log(response)
            this.accounts.unshift(response)
            return response
        }
    }
})