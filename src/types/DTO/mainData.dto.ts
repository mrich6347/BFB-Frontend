import type { Budget } from "../models/budget";
import type { Account } from "../models/account";
export interface MainDataResponse {
    budget?: Budget
    accounts?: Account[]
}