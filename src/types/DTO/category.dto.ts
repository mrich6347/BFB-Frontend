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
  created_at: Date;
  updated_at: Date;
}

export interface CategoryWithReadyToAssignResponse {
  category: CategoryResponse;
  readyToAssign: number;
  categoryBalance?: any; // CategoryBalanceResponse - optional for backward compatibility
}

export interface CategoryUpdateWithAffectedCategoriesResponse {
  category: CategoryResponse;
  readyToAssign: number;
  affectedCategories?: CategoryResponse[];
  categoryBalance: any; // CategoryBalanceResponse - the updated balance
}
