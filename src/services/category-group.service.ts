import api from './common/api';
import type {
  CategoryGroupResponse,
  CreateCategoryGroupDto,
  UpdateCategoryGroupDto,
  ReorderCategoryGroupsDto
} from '@/types/DTO/category-group.dto';

export default class CategoryGroupService {
  static async getAllCategoryGroups(budgetId: string): Promise<CategoryGroupResponse[]> {
    const response = await api.get(`/category-groups?budgetId=${budgetId}`);
    return response.data;
  }

  static async createCategoryGroup(request: CreateCategoryGroupDto): Promise<CategoryGroupResponse> {
    const response = await api.post('/category-groups', request);
    return response.data;
  }

  static async updateCategoryGroup(id: string, request: UpdateCategoryGroupDto): Promise<CategoryGroupResponse> {
    const response = await api.patch(`/category-groups/${id}`, request);
    return response.data;
  }

  static async deleteCategoryGroup(id: string): Promise<void> {
    await api.delete(`/category-groups/${id}`);
  }

  static async hideCategoryGroup(id: string): Promise<void> {
    await api.patch(`/category-groups/${id}/hide`);
  }

  static async reorderCategoryGroups(request: ReorderCategoryGroupsDto): Promise<void> {
    await api.post('/category-groups/reorder', request);
  }
}
