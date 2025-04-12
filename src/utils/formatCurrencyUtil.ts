import { useBudgetStore } from '@/stores/budgetStore'
import type { CurrencyPlacement } from '../types/models/budget'

export const formatCurrency = (amount: number): string => {
   const budget = useBudgetStore().currentBudget
   const currency = budget?.currency || 'USD'
   const currencyPlacement = budget?.currency_placement || 'BEFORE' as CurrencyPlacement

   const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
   })

   const formatted = formatter.format(amount)
   
   if (currencyPlacement === 'AFTER') {
      // Remove the currency symbol from the start and append it to the end
      const numericPart = formatted.replace(/[^\d.,]/g, '').trim()
      const currencySymbol = formatted.replace(/[\d.,\s]/g, '').trim()
      return `${numericPart} ${currencySymbol}`
   }

   return formatted
}   