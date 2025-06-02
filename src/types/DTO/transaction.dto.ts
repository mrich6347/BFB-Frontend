export interface CreateTransactionDto {
  account_id: string;
  date: string;
  amount: number;
  memo?: string;
  payee?: string;
  category_id?: string;
  is_cleared?: boolean;
  is_reconciled?: boolean;
  transfer_id?: string;
}

export interface UpdateTransactionDto {
  date?: string;
  amount?: number;
  memo?: string;
  payee?: string;
  category_id?: string;
  is_cleared?: boolean;
  is_reconciled?: boolean;
  transfer_id?: string;
}

export interface TransactionResponse {
  id: string;
  user_id: string;
  account_id: string;
  date: string;
  amount: number;
  memo?: string;
  payee?: string;
  category_id?: string;
  is_cleared: boolean;
  is_reconciled: boolean;
  transfer_id?: string;
  created_at: string;
  updated_at: string;
}
