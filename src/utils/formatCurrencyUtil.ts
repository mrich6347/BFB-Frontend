import { useBudgetStore } from '@/stores/budgetStore'


export const formatCurrency = (amount: number): string => {
   const budget = useBudgetStore().currentBudget
   const currency = budget?.currency || 'USD'
   return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
   }).format(amount)
}   