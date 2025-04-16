import type { AccountResponse, CreateAccountRequest } from "../types/DTO/account.dto"
import api from "./common/api"

export class AccountService {

    private static readonly BASE_PATH = '/accounts'

    static async createAccount(request: CreateAccountRequest): Promise<AccountResponse> {
        const response = await api.post(this.BASE_PATH, request)
        return response.data
    }
}
