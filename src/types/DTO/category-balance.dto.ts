export interface CategoryBalanceDto {
  id: string;
  category_id: string;
  budget_id: string;
  user_id: string;
  year: number;
  month: number;
  assigned: number;
  activity: number;
  available: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryBalanceDto {
  category_id: string;
  budget_id: string;
  year: number;
  month: number;
  assigned?: number;
  activity?: number;
  available?: number;
}

export interface UpdateCategoryBalanceDto {
  assigned?: number;
  activity?: number;
  available?: number;
}

export interface CategoryBalanceResponse {
  id: string;
  category_id: string;
  budget_id: string;
  user_id: string;
  year: number;
  month: number;
  assigned: number;
  activity: number;
  available: number;
  created_at: Date;
  updated_at: Date;
}
