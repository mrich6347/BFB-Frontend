import type { BudgetResponse, CreateBudgetDto } from '../types/DTO/budget.dto'
import api from './common/api'

export class BudgetService {
  private static readonly BASE_PATH = '/budgets'

  /**
   * Get all budgets for the authenticated user
   */
  static async getAllBudgets(): Promise<BudgetResponse[]> {
    const response = await api.get<BudgetResponse[]>(this.BASE_PATH)
    return response.data
  }

  static async createBudget(request: CreateBudgetDto): Promise<BudgetResponse> {
    const response = await api.post<BudgetResponse>(this.BASE_PATH, request)
    return response.data
  }

  static async getBudget(id: string): Promise<BudgetResponse> {
    const response = await api.get<BudgetResponse>(`${this.BASE_PATH}/${id}`)
    return response.data
  }
}

export default BudgetService
