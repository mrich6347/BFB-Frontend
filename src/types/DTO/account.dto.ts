import type { AccountType } from "../models/account";

export interface CreateAccountRequest {
    name: string;
    account_type: AccountType;
    current_balance: number;
}
