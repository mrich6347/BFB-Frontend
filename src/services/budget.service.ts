import type { BudgetResponse, CreateBudgetDto } from '../types/DTO/budget.dto'
import api from './common/api'

export interface YnabImportRequest {
  budgetName: string
  currency?: string
  currencyPlacement?: string
  numberFormat?: string
  dateFormat?: string
}

export interface YnabImportResult {
  success: boolean
  budget?: BudgetResponse
  categoryGroupsCount?: number
  categoriesCount?: number
  error?: string
  details?: string
}

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

  static async updateBudget(id: string, request: CreateBudgetDto): Promise<BudgetResponse> {
    const response = await api.patch<BudgetResponse>(`${this.BASE_PATH}/${id}`, request)
    return response.data
  }

  static async deleteBudget(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`${this.BASE_PATH}/${id}`)
    return response.data
  }

  /**
   * Import budget from YNAB zip file
   */
  static async importFromYnab(file: File, importRequest: YnabImportRequest): Promise<YnabImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('budgetName', importRequest.budgetName)

    if (importRequest.currency) formData.append('currency', importRequest.currency)
    if (importRequest.currencyPlacement) formData.append('currencyPlacement', importRequest.currencyPlacement)
    if (importRequest.numberFormat) formData.append('numberFormat', importRequest.numberFormat)
    if (importRequest.dateFormat) formData.append('dateFormat', importRequest.dateFormat)

    const response = await api.post<YnabImportResult>(`${this.BASE_PATH}/import-ynab`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

export default BudgetService
