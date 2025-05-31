import { useBudgetStore } from '@/stores/budget.store'
import { CurrencyPlacement, NumberFormat } from '@/types/DTO/budget.dto'
import { formatNumberByFormat } from '@/utils/numberFormatUtil'

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const commonCurrencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' }
];

// Helper function to get currency by code
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return commonCurrencies.find(currency => currency.code === code.toUpperCase());
};

// Helper function to get currency symbol by code
export const getCurrencySymbol = (code: string): string => {
  return getCurrencyByCode(code)?.symbol || code;
};

// Helper function to format amount with currency symbol
export const formatCurrency = (amount: number | undefined | null): string => {
  // Handle null, undefined, or NaN values
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  try {
    const budgetStore = useBudgetStore();
    const budget = budgetStore?.currentBudget;
    const currencyCode = budget?.currency || 'USD';
    const currencyPlacement = budget?.currency_placement || CurrencyPlacement.BEFORE;
    const numberFormat = budget?.number_format || NumberFormat.DOT_COMMA;
    const currency = getCurrencyByCode(currencyCode);

    const formattedAmount = formatNumberByFormat(amount, numberFormat);

    if (!currency) {
      return currencyPlacement === CurrencyPlacement.BEFORE
        ? `${currencyCode} ${formattedAmount}`
        : `${formattedAmount} ${currencyCode}`;
    }

    return currencyPlacement === CurrencyPlacement.BEFORE
      ? `${currency.symbol}${formattedAmount}`
      : `${formattedAmount}${currency.symbol}`;
  } catch (error) {
    // Fallback to basic formatting if store is not available
    // Ensure amount is a valid number for the fallback
    const safeAmount = (amount === null || amount === undefined || isNaN(amount)) ? 0 : amount;
    return `$${safeAmount.toFixed(2)}`;
  }
};
