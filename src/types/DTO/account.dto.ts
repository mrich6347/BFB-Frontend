export enum AccountType {
    CASH = 'CASH',
    CREDIT = 'CREDIT',
    LOAN = 'LOAN',
    TRACKING = 'TRACKING',
}

export interface CreateAccountDto {
    id: string;
    name: string;
    account_type: AccountType;
    current_balance: number;
    interest_rate: number | null;   
    minimum_monthly_payment: number | null;
    budget_id: string;
}

export interface AccountResponse {
    id: string;
    name: string;
    account_type: AccountType;
    budget_id: string;
    interest_rate?: number;
    minimum_monthly_payment?: number;
    cleared_balance: number;
    uncleared_balance: number;
    working_balance: number;
    is_active: boolean;
}