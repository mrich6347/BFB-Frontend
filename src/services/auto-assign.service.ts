import api from './common/api';
import { getCurrentUserDateContext } from '../utils/dateContext';

export interface AutoAssignConfigurationItem {
  category_id: string;
  amount: number;
}

export interface CreateAutoAssignConfigurationDto {
  name: string;
  budget_id: string;
  items: AutoAssignConfigurationItem[];
}

export interface UpdateAutoAssignConfigurationDto {
  name?: string;
  items?: AutoAssignConfigurationItem[];
}

export interface AutoAssignConfigurationItemResponse {
  id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface AutoAssignConfigurationResponse {
  name: string;
  budget_id: string;
  user_id: string;
  items: AutoAssignConfigurationItemResponse[];
  created_at: string;
  updated_at: string;
}

export interface AutoAssignConfigurationSummary {
  name: string;
  budget_id: string;
  user_id: string;
  item_count: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface ApplyAutoAssignConfigurationDto {
  name: string;
  budget_id: string;
}

export interface ApplyAutoAssignResponse {
  success: boolean;
  appliedCount: number;
  readyToAssign: number;
  appliedCategories: { category_id: string; amount: number }[];
}

export default class AutoAssignService {
  static async createConfiguration(request: CreateAutoAssignConfigurationDto): Promise<AutoAssignConfigurationResponse> {
    const response = await api.post('/auto-assign', request);
    return response.data;
  }

  static async getConfigurationsByBudget(budgetId: string): Promise<AutoAssignConfigurationSummary[]> {
    const response = await api.get(`/auto-assign/budget/${budgetId}`);
    return response.data;
  }

  static async getConfigurationByName(budgetId: string, name: string): Promise<AutoAssignConfigurationResponse | null> {
    const response = await api.get(`/auto-assign/budget/${budgetId}/config/${encodeURIComponent(name)}`);
    return response.data;
  }

  static async updateConfiguration(budgetId: string, name: string, request: UpdateAutoAssignConfigurationDto): Promise<AutoAssignConfigurationResponse> {
    const response = await api.patch(`/auto-assign/budget/${budgetId}/config/${encodeURIComponent(name)}`, request);
    return response.data;
  }

  static async deleteConfiguration(budgetId: string, name: string): Promise<void> {
    await api.delete(`/auto-assign/budget/${budgetId}/config/${encodeURIComponent(name)}`);
  }

  static async applyConfiguration(request: ApplyAutoAssignConfigurationDto): Promise<ApplyAutoAssignResponse> {
    // Add user date context to the request
    const userDateContext = getCurrentUserDateContext()
    const requestWithContext = {
      ...request,
      ...userDateContext
    }

    const response = await api.post('/auto-assign/apply', requestWithContext);
    return response.data;
  }
}
