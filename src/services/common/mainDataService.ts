import type { MainDataResponse } from "../../types/DTO/mainDataDTO"
import api from "./api"

export class MainDataService {
    static async getMainData(budgetId: string): Promise<MainDataResponse> {
        const response = await api.get(`/main-data/${budgetId}`)
        return response.data
    }
}
