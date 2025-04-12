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

  static async createBudget(budget: Budget): Promise<Budget> {
    const response = await api.post<Budget>(this.BASE_PATH, budget)
    return response.data
  }

}

export default BudgetService
