import type { CreateTransactionDto, UpdateTransactionDto, TransactionResponse, TransactionWithAccountsResponse, TransactionDeleteResponse } from '../types/DTO/transaction.dto'
import { getCurrentUserDateContext } from '../utils/dateContext'
import api from './common/api'

export class TransactionService {
  private static readonly BASE_PATH = '/transactions'

  /**
   * Create a new transaction
   */
  static async createTransaction(request: CreateTransactionDto): Promise<TransactionResponse | TransactionWithAccountsResponse> {
    // Add user date context to the request
    const userDateContext = getCurrentUserDateContext()
    const requestWithContext = {
      ...request,
      ...userDateContext
    }

    const response = await api.post<TransactionResponse | TransactionWithAccountsResponse>(this.BASE_PATH, requestWithContext)
    return response.data
  }

  /**
   * Get all transactions for a specific account
   */
  static async getTransactionsByAccount(accountId: string): Promise<TransactionResponse[]> {
    const response = await api.get<TransactionResponse[]>(`${this.BASE_PATH}/account/${accountId}`)
    return response.data
  }

  /**
   * Get a specific transaction by ID
   */
  static async getTransaction(id: string): Promise<TransactionResponse> {
    const response = await api.get<TransactionResponse>(`${this.BASE_PATH}/${id}`)
    return response.data
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(id: string, request: UpdateTransactionDto): Promise<TransactionResponse | TransactionWithAccountsResponse> {
    // Add user date context to the request
    const userDateContext = getCurrentUserDateContext()
    const requestWithContext = {
      ...request,
      ...userDateContext
    }

    const response = await api.patch<TransactionResponse | TransactionWithAccountsResponse>(`${this.BASE_PATH}/${id}`, requestWithContext)
    return response.data
  }

  /**
   * Toggle the cleared status of a transaction
   */
  static async toggleCleared(id: string): Promise<TransactionResponse> {
    const response = await api.patch<TransactionResponse>(`${this.BASE_PATH}/${id}/toggle-cleared`)
    return response.data
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string): Promise<void | TransactionDeleteResponse> {
    const response = await api.delete<void | TransactionDeleteResponse>(`${this.BASE_PATH}/${id}`)
    return response.data
  }
}
