export enum AccountType {
    CASH = 'CASH',
    CREDIT = 'CREDIT',
    LOAN = 'LOAN',
    TRACKING = 'TRACKING',
}



export interface Account {
    id: string;
    userId: string | null;
    name: string;
    account_type: AccountType;
    cleared_balance: number;
    uncleared_balance: number;
    working_balance: number;
    display_order: number;
    interest_rate: number | null;
    minimum_monthly_payment: number | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}