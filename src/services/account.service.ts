import type { AccountResponse, CreateAccountDto, AccountWithReadyToAssignResponse, UpdateAccountDto, CloseAccountResponse, ReorderAccountsDto } from "../types/DTO/account.dto"
import api from "./common/api"

export class AccountService {

    private static readonly BASE_PATH = '/accounts'

    static async createAccount(request: CreateAccountDto): Promise<AccountWithReadyToAssignResponse> {
        const response = await api.post(this.BASE_PATH, request)
        return response.data
    }

    static async updateAccount(accountId: string, request: UpdateAccountDto): Promise<AccountWithReadyToAssignResponse> {
        const response = await api.patch(`${this.BASE_PATH}/${accountId}`, request)
        return response.data
    }

    static async closeAccount(accountId: string): Promise<CloseAccountResponse> {
        const response = await api.delete(`${this.BASE_PATH}/${accountId}`)
        return response.data
    }

    static async reopenAccount(accountId: string): Promise<AccountWithReadyToAssignResponse> {
        const response = await api.post(`${this.BASE_PATH}/${accountId}/reopen`)
        return response.data
    }

    static async reconcileAccount(accountId: string, actualBalance: number): Promise<any> {
        const response = await api.post(`${this.BASE_PATH}/${accountId}/reconcile`, {
            actual_balance: actualBalance
        })
        return response.data
    }

    static async reorderAccounts(request: ReorderAccountsDto): Promise<void> {
        await api.post(`${this.BASE_PATH}/reorder`, request)
    }
}
