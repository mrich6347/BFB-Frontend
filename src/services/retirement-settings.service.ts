import api from './common/api';
import type { RetirementSettingsResponse, UpsertRetirementSettingsDto } from '@/types/DTO/retirement-settings.dto';

export class RetirementSettingsService {
  async getRetirementSettings(budgetId: string): Promise<RetirementSettingsResponse | null> {
    const response = await api.get<RetirementSettingsResponse | null>(`/budgets/${budgetId}/retirement-settings`);
    return response.data;
  }

  async upsertRetirementSettings(budgetId: string, dto: UpsertRetirementSettingsDto): Promise<RetirementSettingsResponse> {
    const response = await api.post<RetirementSettingsResponse>(`/budgets/${budgetId}/retirement-settings`, dto);
    return response.data;
  }
}

export const retirementSettingsService = new RetirementSettingsService();

