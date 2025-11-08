export enum AccountType {
    CASH = 'CASH',
    TRACKING = 'TRACKING',
    CREDIT = 'CREDIT',
}

export interface CreateAccountDto {
    id: string;
    name: string;
    account_type: AccountType;
    account_balance: number;
    budget_id: string;
}

export interface UpdateAccountDto {
    name?: string;
}

import type { CategoryResponse } from './category.dto'

export interface AccountWithReadyToAssignResponse {
    account: AccountResponse;
    readyToAssign: number;
    category?: CategoryResponse; // Optional category (e.g., payment category for credit card accounts)
}

export interface CloseAccountResponse {
    account: AccountResponse;
    adjustmentTransaction?: any;
    readyToAssign: number;
}

export interface ReorderAccountsDto {
    account_ids: string[];
}

export interface MakeCreditCardPaymentDto {
    amount: number;
    from_account_id: string;
    memo?: string;
}

export interface MakeCreditCardPaymentResponse {
    transaction: any; // TransactionResponse (source/cash account)
    linkedTransaction: any; // TransactionResponse (target/credit card account)
    account: AccountResponse; // The credit card account
    sourceAccount: AccountResponse; // The cash account money came from
    paymentCategoryBalance: any; // CategoryBalanceResponse
    readyToAssign: number;
}

export interface AccountResponse {
    id: string;
    name: string;
    account_type: AccountType;
    budget_id: string;
    account_balance: number;
    cleared_balance: number;
    uncleared_balance: number;
    working_balance: number;
    is_active: boolean;
    display_order: number;
}

