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
  // User date context for timezone handling (added automatically by service)
  userDate?: string;
  userYear?: number;
  userMonth?: number;
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
  // User date context for timezone handling (added automatically by service)
  userDate?: string;
  userYear?: number;
  userMonth?: number;
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

export interface TransactionWithAccountsResponse {
  transaction: TransactionResponse;
  sourceAccount?: any; // AccountResponse from accounts module
  targetAccount?: any; // AccountResponse from accounts module
}

export interface TransactionDeleteResponse {
  sourceAccount?: any; // AccountResponse from accounts module
  targetAccount?: any; // AccountResponse from accounts module
}

export interface TransactionWithReadyToAssignResponse {
  transaction: TransactionResponse;
  readyToAssign: number;
}

export interface TransactionWithAccountsAndReadyToAssignResponse {
  transaction: TransactionResponse;
  sourceAccount?: any; // AccountResponse from accounts module
  targetAccount?: any; // AccountResponse from accounts module
  readyToAssign: number;
}

export interface TransactionDeleteWithReadyToAssignResponse {
  sourceAccount?: any; // AccountResponse from accounts module
  targetAccount?: any; // AccountResponse from accounts module
  readyToAssign: number;
}

export interface TransactionWithReadyToAssignAndCategoryBalanceResponse {
  transaction: TransactionResponse;
  readyToAssign: number;
  categoryBalance?: any; // CategoryBalanceResponse from category-balances module (deprecated, use categoryBalances)
  categoryBalances?: any[]; // Array of CategoryBalanceResponse from category-balances module
}

export interface TransactionWithAccountsAndReadyToAssignAndCategoryBalanceResponse {
  transaction: TransactionResponse;
  sourceAccount?: any; // AccountResponse from accounts module
  targetAccount?: any; // AccountResponse from accounts module
  readyToAssign: number;
  categoryBalance?: any; // CategoryBalanceResponse from category-balances module (deprecated, use categoryBalances)
  categoryBalances?: any[]; // Array of CategoryBalanceResponse from category-balances module
}

export interface BulkDeleteTransactionsDto {
  transaction_ids: string[];
}

export interface BulkDeleteTransactionsResponse {
  deletedCount: number;
  affectedAccounts: any[]; // Array of AccountResponse from accounts module
  readyToAssign: number;
}
