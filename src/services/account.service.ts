import type { AccountResponse, CreateAccountDto, AccountWithReadyToAssignResponse } from "../types/DTO/account.dto"
import api from "./common/api"

export class AccountService {

    private static readonly BASE_PATH = '/accounts'

    static async createAccount(request: CreateAccountDto): Promise<AccountWithReadyToAssignResponse> {
        const response = await api.post(this.BASE_PATH, request)
        return response.data
    }

    static async reconcileAccount(accountId: string, actualBalance: number): Promise<any> {
        const response = await api.post(`${this.BASE_PATH}/${accountId}/reconcile`, {
            actual_balance: actualBalance
        })
        return response.data
    }
}
