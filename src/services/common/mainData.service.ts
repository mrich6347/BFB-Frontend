import type { MainDataResponse } from "../../types/DTO/mainData.dto"
import type { UserDateContext } from "../../utils/dateContext"
import { getCurrentUserDateContext } from "../../utils/dateContext"
import api from "./api"

export class MainDataService {
    static async getMainData(budgetId: string, userDateContext?: UserDateContext): Promise<MainDataResponse> {
        // Use provided context or generate current context
        const context = userDateContext || getCurrentUserDateContext()

        const response = await api.get(`/main-data/${budgetId}`, {
            params: {
                userDate: context.userDate,
                userYear: context.userYear,
                userMonth: context.userMonth
            }
        })
        return response.data
    }

    static async getLastUpdateTimestamp(budgetId: string): Promise<{ lastUpdate: string }> {
        const response = await api.get(`/main-data/${budgetId}/last-update`)
        return response.data
    }
}
