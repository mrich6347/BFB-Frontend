import type { AccountResponse } from "./account.dto";
import type { BudgetResponse } from "./budget.dto";
import type { CategoryGroupResponse } from "./category-group.dto";
import type { CategoryResponse } from "./category.dto";

export interface MainDataResponse {
    budget?: BudgetResponse;
    accounts?: AccountResponse[];
    categoryGroups?: CategoryGroupResponse[];
    categories?: CategoryResponse[];
}
