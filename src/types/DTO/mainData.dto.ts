import type { AccountResponse } from "./account.dto";
import type { BudgetResponse } from "./budget.dto";
import type { CategoryGroupResponse } from "./category-group.dto";
import type { CategoryResponse } from "./category.dto";
import type { CategoryBalanceResponse } from "./category-balance.dto";
import type { TransactionResponse } from "./transaction.dto";
import type { AutoAssignConfigurationSummary } from "@/services/auto-assign.service";
import type { UserProfileResponse } from "./user-profile.dto";
import type { SharedGoalResponse, InvitationResponse } from "./shared-goal.dto";
import type { PayeeResponse } from "./payee.dto";
import type { ScheduledTransactionResponse } from "./scheduled-transaction.dto";
import type { RetirementSettingsResponse } from "./retirement-settings.dto";

export interface MainDataResponse {
    budget?: BudgetResponse;
    accounts?: AccountResponse[];
    categoryGroups?: CategoryGroupResponse[];
    categories?: CategoryResponse[];
    categoryBalances?: CategoryBalanceResponse[];
    transactions?: TransactionResponse[];
    readyToAssign?: number;
    autoAssignConfigurations?: AutoAssignConfigurationSummary[];
    userProfile?: UserProfileResponse;
    sharedGoals?: SharedGoalResponse[];
    invitations?: InvitationResponse[];
    payees?: PayeeResponse[];
    scheduledTransactions?: ScheduledTransactionResponse[];
    retirementSettings?: RetirementSettingsResponse;
}
