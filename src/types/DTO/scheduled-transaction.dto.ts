export enum ScheduledFrequency {
  ONCE = 'ONCE',
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  YEARLY = 'YEARLY'
}

export interface CreateScheduledTransactionDto {
  budget_id: string;
  account_id: string;
  category_id?: string;
  payee: string;
  amount: number;
  memo?: string;
  frequency: ScheduledFrequency;
  specific_date?: string; // For ONCE frequency (YYYY-MM-DD format)
  day_of_month?: number; // For MONTHLY and YEARLY (1-31)
  day_of_week?: number; // For WEEKLY and BIWEEKLY (0=Sunday, 6=Saturday)
  month_of_year?: number; // For YEARLY only (1-12)
  is_active?: boolean;
}

export interface UpdateScheduledTransactionDto {
  account_id?: string;
  category_id?: string;
  payee?: string;
  amount?: number;
  memo?: string;
  frequency?: ScheduledFrequency;
  specific_date?: string;
  day_of_month?: number;
  day_of_week?: number;
  month_of_year?: number;
  is_active?: boolean;
}

export interface ScheduledTransactionResponse {
  id: string;
  user_id: string;
  budget_id: string;
  account_id: string;
  category_id?: string;
  payee: string;
  amount: number;
  memo?: string;
  frequency: ScheduledFrequency;
  specific_date?: string;
  day_of_month?: number;
  day_of_week?: number;
  month_of_year?: number;
  is_active: boolean;
  last_created_date?: string;
  created_at: string;
  updated_at: string;
}

