export interface UpsertRetirementSettingsDto {
  monthly_contribution: number;
  retirement_age: number;
}

export interface RetirementSettingsResponse {
  id: string;
  user_id: string;
  budget_id: string;
  monthly_contribution: number;
  retirement_age: number;
  created_at: string;
  updated_at: string;
}

