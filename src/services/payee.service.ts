import type { PayeeResponse, UpsertPayeeDto } from '@/types/DTO/payee.dto'
import api from './common/api'

export class PayeeService {
  private static readonly BASE_PATH = '/payees'

  static async getPayeesByBudget(budgetId: string): Promise<PayeeResponse[]> {
    const response = await api.get<PayeeResponse[]>(`${this.BASE_PATH}/budget/${budgetId}`)
    return response.data
  }

  static async upsertPayee(request: UpsertPayeeDto): Promise<PayeeResponse> {
    const response = await api.post<PayeeResponse>(this.BASE_PATH, request)
    return response.data
  }
}

