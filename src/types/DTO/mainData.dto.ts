import type { AccountResponse } from "./account.dto";
import type { BudgetResponse } from "./budget.dto";
export interface MainDataResponse {
    budget?: BudgetResponse;
    accounts?: AccountResponse[]
}