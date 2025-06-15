import type { AccountResponse } from '../types/DTO/account.dto'
import api from './common/api'

export class TransferService {
  private static readonly BASE_PATH = '/accounts'

  /**
   * Get available transfer options for a given account
   */
  static async getTransferOptions(accountId: string): Promise<AccountResponse[]> {
    const response = await api.get<AccountResponse[]>(`${this.BASE_PATH}/${accountId}/transfer-options`)
    return response.data
  }

  /**
   * Format account name as transfer payee
   */
  static formatTransferPayee(accountName: string): string {
    return `Transfer : ${accountName}`
  }

  /**
   * Check if a payee string is a transfer payee
   */
  static isTransferPayee(payee: string): boolean {
    return payee?.startsWith('Transfer : ') || false
  }

  /**
   * Extract account name from transfer payee
   */
  static parseTransferAccountName(payee: string): string {
    if (!this.isTransferPayee(payee)) {
      throw new Error('Invalid transfer payee format')
    }
    return payee.substring('Transfer : '.length)
  }
}
