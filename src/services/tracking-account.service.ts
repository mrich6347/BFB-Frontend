import api from './common/api'

export interface UpdateBalanceDto {
  new_balance: number
  memo?: string
}

export interface UpdateBalanceResponse {
  account: any // AccountResponse
  adjustmentTransaction?: any // TransactionResponse
  readyToAssign: number
}

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
