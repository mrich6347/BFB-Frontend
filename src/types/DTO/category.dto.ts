export interface CategoryDto {
  id: string;
  name: string;
  category_group_id: string;
  budget_id: string;
  user_id: string;
  assigned: number;
  activity: number;
  available: number;
  display_order: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryDto {
  name: string;
  category_group_id: string;
  budget_id: string;
  display_order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  assigned?: number;
  activity?: number;
  available?: number;
  display_order?: number;
}

export interface ReorderCategoriesDto {
  category_ids: string[];
}

export interface CategoryResponse {
  id: string;
  name: string;
  category_group_id: string;
  budget_id: string;
  assigned: number;
  activity: number;
  available: number;
  display_order: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

import type { CategoryBalanceResponse } from './category-balance.dto';

export interface CategoryWithReadyToAssignResponse {
  category: CategoryResponse;
  readyToAssign: number;
  categoryBalance?: CategoryBalanceResponse; // Optional for backward compatibility
}

export interface CategoryUpdateWithAffectedCategoriesResponse {
  readyToAssign: number;
  category: CategoryResponse; // The updated category data
  categoryBalance: CategoryBalanceResponse; // The updated balance
  affectedCategories?: CategoryResponse[];
  affectedCategoryBalances?: CategoryBalanceResponse[]; // Payment category balances that were updated due to credit card debt coverage
}

export interface MoveMoneyResponse {
  readyToAssign: number;
  sourceCategoryBalance: CategoryBalanceResponse;
  destinationCategoryBalance: CategoryBalanceResponse;
  affectedCategoryBalances?: CategoryBalanceResponse[]; // Payment categories that were updated due to credit card debt coverage
}
