import { AccountType, type Account } from "../types/models/account";
import { defineStore } from "pinia";
import type { CreateAccountRequest } from "@/types/DTO/account.dto";
import { AccountService } from "@/services/accountService";
import { v4 as uuidv4 } from 'uuid';
import { useBudgetStore } from "./budgetStore";

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
            const id = uuidv4()

            const balanceStr = String(request.current_balance).trim();
            if (balanceStr.startsWith('+')) {
                request.current_balance = Math.abs(parseFloat(balanceStr.substring(1)));
            } else {
                request.current_balance = -Math.abs(parseFloat(balanceStr));
            }

            request.budget_id = useBudgetStore().currentBudget?.id || ''
            const response = await AccountService.createAccount({...request, id})
            this.accounts.unshift(response)
            return response
        }
    }
})