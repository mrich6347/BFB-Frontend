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

export interface AccountWithReadyToAssignResponse {
    account: AccountResponse;
    readyToAssign: number;
}

export interface CloseAccountResponse {
    account: AccountResponse;
    adjustmentTransaction?: any;
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
}

