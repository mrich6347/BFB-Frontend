import api from './common/api'
import type {
  CreateScheduledTransactionDto,
  UpdateScheduledTransactionDto,
  ScheduledTransactionResponse
} from '@/types/DTO/scheduled-transaction.dto'

export const scheduledTransactionService = {
  async create(dto: CreateScheduledTransactionDto): Promise<ScheduledTransactionResponse> {
    const response = await api.post('/scheduled-transactions', dto)
    return response.data
  },

  async findAllByBudget(budgetId: string): Promise<ScheduledTransactionResponse[]> {
    const response = await api.get(`/scheduled-transactions/budget/${budgetId}`)
    return response.data
  },

  async findAllByAccount(accountId: string): Promise<ScheduledTransactionResponse[]> {
    const response = await api.get(`/scheduled-transactions/account/${accountId}`)
    return response.data
  },

  async findOne(id: string): Promise<ScheduledTransactionResponse> {
    const response = await api.get(`/scheduled-transactions/${id}`)
    return response.data
  },

  async update(id: string, dto: UpdateScheduledTransactionDto): Promise<ScheduledTransactionResponse> {
    const response = await api.patch(`/scheduled-transactions/${id}`, dto)
    return response.data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/scheduled-transactions/${id}`)
  }
}

