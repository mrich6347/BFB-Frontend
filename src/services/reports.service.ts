import api from './common/api';
import type {
  CategorySpendingResponse,
  CategoryGroupSpendingResponse,
  SpendingOverTimeResponse,
  TopPayeesResponse,
  CategoryBreakdownResponse,
  ReportsQueryParams
} from '@/types/DTO/reports.dto';

export class ReportsService {
  private static readonly BASE_PATH = '/reports';

  static async getTopSpendingCategories(params: ReportsQueryParams): Promise<CategorySpendingResponse> {
    const response = await api.get<CategorySpendingResponse>(
      `${this.BASE_PATH}/top-spending-categories`,
      { params }
    );
    return response.data;
  }

  static async getSpendingOverTime(params: ReportsQueryParams): Promise<SpendingOverTimeResponse> {
    const response = await api.get<SpendingOverTimeResponse>(
      `${this.BASE_PATH}/spending-over-time`,
      { params }
    );
    return response.data;
  }

  static async getTopPayees(params: ReportsQueryParams): Promise<TopPayeesResponse> {
    const response = await api.get<TopPayeesResponse>(
      `${this.BASE_PATH}/top-payees`,
      { params }
    );
    return response.data;
  }

  static async getCategoryBreakdown(params: ReportsQueryParams): Promise<CategoryBreakdownResponse> {
    const response = await api.get<CategoryBreakdownResponse>(
      `${this.BASE_PATH}/category-breakdown`,
      { params }
    );
    return response.data;
  }

  static async getTopSpendingCategoryGroups(params: ReportsQueryParams): Promise<CategoryGroupSpendingResponse> {
    const response = await api.get<CategoryGroupSpendingResponse>(
      `${this.BASE_PATH}/top-spending-category-groups`,
      { params }
    );
    return response.data;
  }

  static async getCategoryGroupBreakdown(params: ReportsQueryParams): Promise<any> {
    const response = await api.get<any>(
      `${this.BASE_PATH}/category-group-breakdown`,
      { params }
    );
    return response.data;
  }
}

