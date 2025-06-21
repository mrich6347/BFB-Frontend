import api from './common/api'
import type { CloseAccountResponse } from '@/types/DTO/account.dto'

export interface UpdateBalanceDto {
  new_balance: number
  memo?: string
}

// Use the same response type as reconcile account since they have the same structure
export type UpdateBalanceResponse = CloseAccountResponse

export interface BalanceHistoryPoint {
  date: string
  balance: number
  memo?: string
  transaction_id?: string
}

export class TrackingAccountService {
  private static readonly BASE_PATH = '/accounts'

  /**
   * Update tracking account balance
   */
  static async updateBalance(accountId: string, request: UpdateBalanceDto): Promise<UpdateBalanceResponse> {
    const response = await api.post<UpdateBalanceResponse>(`${this.BASE_PATH}/${accountId}/update-balance`, request)
    return response.data
  }

  /**
   * Get balance history for tracking account
   */
  static async getBalanceHistory(accountId: string): Promise<BalanceHistoryPoint[]> {
    const response = await api.get<BalanceHistoryPoint[]>(`${this.BASE_PATH}/${accountId}/balance-history`)
    return response.data
  }
}
