import { AccountType, type Account } from "../types/models/account";
import { defineStore } from "pinia";
import type { CreateAccountRequest } from "@/types/DTO/account.dto";
import { AccountService } from "@/services/accountService";
import { v4 as uuidv4 } from 'uuid';
import { useBudgetStore } from "./budgetStore";
import { parseFormattedNumberToDecimal } from "../utils/numberFormatUtil";

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

            const inputBalanceStr = String(request.current_balance).trim();

            console.log('inputBalanceStr', inputBalanceStr)
            
            // parsing the number to our DB format ex: 1,234.56 -> 1234.56
            const decimalBalanceStr = parseFormattedNumberToDecimal(inputBalanceStr);

            console.log('decimalBalanceStr', decimalBalanceStr)
            
            let numericBalance = parseFloat(decimalBalanceStr);

            console.log('numericBalance', numericBalance)

            console.log('request.account_type', request.account_type)

            if (request.account_type === AccountType.LOAN || request.account_type === AccountType.CREDIT) {
                if (inputBalanceStr.startsWith('+')) {
                    numericBalance = Math.abs(numericBalance);
                } else {
                    numericBalance = -Math.abs(numericBalance);
                }
            }

            console.log('numericBalance', numericBalance)

            request.current_balance = numericBalance;

            request.budget_id = useBudgetStore().currentBudget?.id || ''
            const response = await AccountService.createAccount({ ...request, id })
            this.accounts.push(response)
            return response
        },
        reset() {
            this.accounts = []
            this.isLoading = true
        }
    }
})