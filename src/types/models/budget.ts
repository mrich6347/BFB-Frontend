export enum CurrencyPlacement {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  NONE = 'NONE',
}

export interface Budget {
  id: string
  user_id: string
  name: string
  currency_placement: CurrencyPlacement
  currency: string
  number_format: string
  created_at: Date
  updated_at: Date
}
