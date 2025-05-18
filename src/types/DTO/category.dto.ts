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
