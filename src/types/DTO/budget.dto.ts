import type { CurrencyPlacement, DateFormat, NumberFormat } from "../models/budget"

export interface CreateBudgetRequest {
    name: string
    currency: string
    currency_placement: CurrencyPlacement
    number_format: NumberFormat
    date_format: DateFormat
}  