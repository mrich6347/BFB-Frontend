import api from './common/api'
import type { Budget } from '@/types/models/budget'

export class BudgetService {
  private static readonly BASE_PATH = '/budgets'

  /**
   * Get all budgets for the authenticated user
   */
  static async getAllBudgets(): Promise<Budget[]> {
    const response = await api.get<Budget[]>(this.BASE_PATH)
    return response.data
  }

}

export default BudgetService
