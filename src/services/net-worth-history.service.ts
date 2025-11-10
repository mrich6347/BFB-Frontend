import type { 
    NetWorthChartResponse, 
    CreateNetWorthSnapshotDto, 
    UploadYNABNetWorthDto,
    NetWorthHistoryResponse
} from "../types/DTO/net-worth-history.dto"
import api from "./common/api"

export class NetWorthHistoryService {
    private static readonly BASE_PATH = '/net-worth-history'

    static async getHistory(budgetId: string): Promise<NetWorthChartResponse> {
        const response = await api.get(`${this.BASE_PATH}/budget/${budgetId}`)
        return response.data
    }

    static async createSnapshot(request: CreateNetWorthSnapshotDto): Promise<NetWorthHistoryResponse> {
        const response = await api.post(`${this.BASE_PATH}/snapshot`, request)
        return response.data
    }

    static async uploadYNABCSV(request: UploadYNABNetWorthDto): Promise<{ imported_count: number }> {
        const response = await api.post(`${this.BASE_PATH}/upload-ynab`, request)
        return response.data
    }

    static async deleteHistory(budgetId: string): Promise<{ message: string }> {
        const response = await api.delete(`${this.BASE_PATH}/budget/${budgetId}`)
        return response.data
    }
}

