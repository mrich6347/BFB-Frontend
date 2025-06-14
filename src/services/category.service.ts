import api from './common/api';
import type {
  CategoryResponse,
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
  CategoryWithReadyToAssignResponse,
  CategoryUpdateWithAffectedCategoriesResponse
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

  static async updateCategory(id: string, request: UpdateCategoryDto): Promise<CategoryWithReadyToAssignResponse> {
    const response = await api.patch(`/categories/${id}`, request);
    return response.data;
  }

  static async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }

  static async reorderCategories(request: ReorderCategoriesDto): Promise<void> {
    await api.post('/categories/reorder', request);
  }

  static async updateCategoryBalance(categoryId: string, balanceData: { assigned?: number; activity?: number; available?: number }, year: number, month: number): Promise<CategoryUpdateWithAffectedCategoriesResponse> {
    const url = `/categories/${categoryId}?year=${year}&month=${month}`;
    const response = await api.patch(url, balanceData);
    return response.data;
  }

  static async moveMoney(sourceCategoryId: string, destinationCategoryId: string, amount: number, year: number, month: number): Promise<void> {
    await api.post('/categories/move-money', {
      sourceCategoryId,
      destinationCategoryId,
      amount,
      year,
      month
    });
  }

  static async moveMoneyToReadyToAssign(sourceCategoryId: string, amount: number, year: number, month: number): Promise<void> {
    await api.post('/categories/move-money-to-ready-to-assign', {
      sourceCategoryId,
      amount,
      year,
      month
    });
  }

  static async pullFromReadyToAssign(destinationCategoryId: string, amount: number, year: number, month: number): Promise<void> {
    await api.post('/categories/pull-from-ready-to-assign', {
      destinationCategoryId,
      amount,
      year,
      month
    });
  }
}
