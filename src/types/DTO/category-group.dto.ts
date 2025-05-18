export interface CategoryGroupDto {
  id: string;
  name: string;
  budget_id: string;
  user_id: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryGroupDto {
  name: string;
  budget_id: string;
  display_order?: number;
}

export interface UpdateCategoryGroupDto {
  name?: string;
  display_order?: number;
}

export interface ReorderCategoryGroupsDto {
  group_ids: string[];
}

export interface CategoryGroupResponse {
  id: string;
  name: string;
  budget_id: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}
