import api from './common/api';
import type {
  CategoryResponse,
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
  CategoryWithReadyToAssignResponse,
  CategoryUpdateWithAffectedCategoriesResponse,
  MoveMoneyResponse
} from '@/types/DTO/category.dto';

export default class CategoryService {
  static async getCategoriesByGroup(categoryGroupId: string): Promise<CategoryResponse[]> {
    const response = await api.get(`/categories?categoryGroupId=${categoryGroupId}`);
    return response.data;
  }

  static async getCategoriesByBudget(budgetId: string): Promise<CategoryResponse[]> {
    const response = await api.get(`/categories/budget/${budgetId}`);
    return response.data;
  }

  static async createCategory(request: CreateCategoryDto): Promise<CategoryWithReadyToAssignResponse> {
    const response = await api.post('/categories', request);
    return response.data;
  }

  static async updateCategory(id: string, request: UpdateCategoryDto): Promise<CategoryUpdateWithAffectedCategoriesResponse> {
    const response = await api.patch(`/categories/${id}`, request);
    return response.data;
  }

  static async hideCategory(id: string, year?: number, month?: number): Promise<{ readyToAssign: number }> {
    const params = new URLSearchParams();
    if (year !== undefined) params.append('year', year.toString());
    if (month !== undefined) params.append('month', month.toString());

    const url = `/categories/${id}/hide${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.patch(url);
    return response.data;
  }

  static async unhideCategory(id: string, targetGroupId?: string): Promise<{ readyToAssign: number }> {
    const response = await api.patch(`/categories/${id}/unhide`, { targetGroupId });
    return response.data;
  }

  static async reorderCategories(request: ReorderCategoriesDto): Promise<void> {
    await api.post('/categories/reorder', request);
  }

  static async updateCategoryBalance(categoryId: string, balanceData: { assigned?: number; activity?: number; available?: number }, year: number, month: number): Promise<CategoryUpdateWithAffectedCategoriesResponse> {
    const url = `/categories/${categoryId}?year=${year}&month=${month}`;
    const response = await api.patch(url, balanceData);
    return response.data;
  }

  static async moveMoney(sourceCategoryId: string, destinationCategoryId: string, amount: number, year: number, month: number): Promise<MoveMoneyResponse> {
    const response = await api.post('/categories/move-money', {
      sourceCategoryId,
      destinationCategoryId,
      amount,
      year,
      month
    });
    return response.data;
  }

  static async moveMoneyToReadyToAssign(sourceCategoryId: string, amount: number, year: number, month: number): Promise<CategoryUpdateWithAffectedCategoriesResponse> {
    const response = await api.post('/categories/move-money-to-ready-to-assign', {
      sourceCategoryId,
      amount,
      year,
      month
    });
    return response.data;
  }

  static async pullFromReadyToAssign(destinationCategoryId: string, amount: number, year: number, month: number): Promise<CategoryUpdateWithAffectedCategoriesResponse> {
    const response = await api.post('/categories/pull-from-ready-to-assign', {
      destinationCategoryId,
      amount,
      year,
      month
    });
    return response.data;
  }
}
