import type { CurrencyPlacement } from "../../../models/budget"

export interface CreateBudgetRequest {
  name: string
  currency: string
  currency_placement: CurrencyPlacement
  number_format: string
}

export interface CreateBudgetResponse {
  id: string
  name: string
  currency: string
  currency_placement: CurrencyPlacement
  number_format: string
}