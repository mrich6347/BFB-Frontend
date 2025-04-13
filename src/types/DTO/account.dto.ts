import type { AccountType } from "../models/account";

export interface CreateAccountRequest {
    id: string;
    name: string;
    account_type: AccountType;
    current_balance: number;
}
