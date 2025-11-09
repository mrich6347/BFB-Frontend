import { NumberFormat } from '@/types/DTO/budget.dto'
import { useBudgetStore } from '@/stores/budget.store'

/**
 * Safe wrapper for toFixed that handles null, undefined, NaN, and Infinity
 */
export const safeToFixed = (value: any, decimals: number = 2): string => {
  // Handle null, undefined, or non-numeric values
  if (value === null || value === undefined || typeof value !== 'number') {
    return (0).toFixed(decimals)
  }

  // Handle NaN and Infinity
  if (isNaN(value) || !isFinite(value)) {
    return (0).toFixed(decimals)
  }

  return value.toFixed(decimals)
}

export const formatNumberByFormat = (amount: number, format: string): string => {
  // Use safeToFixed to handle edge cases
  const fixedAmount = safeToFixed(amount, 2)
  const [integerPart, decimalPart] = fixedAmount.split('.');
  const absIntegerPart = Math.abs(parseInt(integerPart)).toString();
  const isNegative = amount < 0;

  let formattedNumber = '';
  switch (format) {
    case NumberFormat.DOT_COMMA:
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimalPart}`;
      break;
    case NumberFormat.COMMA_COMMA:
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimalPart}`;
      break;
    case NumberFormat.DOT_COMMA_THREE:
      const fixedAmount3 = safeToFixed(amount, 3)
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fixedAmount3.split('.')[1]}`;
      break;
    case NumberFormat.SPACE_DOT:
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${decimalPart}`;
      break;
    case NumberFormat.APOSTROPHE_DOT:
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}.${decimalPart}`;
      break;
    case NumberFormat.DOT_NO_DECIMAL:
      formattedNumber = absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      break;
    case NumberFormat.COMMA_NO_DECIMAL:
      formattedNumber = absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      break;
    case NumberFormat.SPACE_HYPHEN:
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}-${decimalPart}`;
      break;
    case NumberFormat.SPACE_COMMA:
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${decimalPart}`;
      break;
    case NumberFormat.COMMA_SLASH:
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/${decimalPart}`;
      break;
    case NumberFormat.SPACE_NO_DECIMAL:
      formattedNumber = absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      break;
    case NumberFormat.COMMA_DOT_LEADING:
      // Indian numbering system: 12,34,567.89
      if (absIntegerPart.length <= 3) {
        formattedNumber = `${absIntegerPart}.${decimalPart}`;
      } else {
        const lastThree = absIntegerPart.substring(absIntegerPart.length - 3);
        const otherDigits = absIntegerPart.substring(0, absIntegerPart.length - 3);
        const formattedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
        formattedNumber = `${formattedOther},${lastThree}.${decimalPart}`;
      }
      break;
    default:
      formattedNumber = `${absIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimalPart}`;
  }

  return isNegative ? `-${formattedNumber}` : formattedNumber;
};

/**
 * Parses a formatted number string back to a number based on the format
 */
const parseFormattedNumber = (formattedNumber: string, format: string): number => {
  // Remove all group separators based on the format
  let cleanNumber = formattedNumber;
  
  switch (format) {
    case NumberFormat.COMMA_COMMA:
      cleanNumber = formattedNumber.replace(/\./g, '').replace(',', '.');
      break;
    case NumberFormat.SPACE_DOT:
      cleanNumber = formattedNumber.replace(/ /g, '');
      break;
    case NumberFormat.APOSTROPHE_DOT:
      cleanNumber = formattedNumber.replace(/'/g, '');
      break;
    case NumberFormat.DOT_NO_DECIMAL:
      cleanNumber = formattedNumber.replace(/\./g, '');
      break;
    case NumberFormat.SPACE_HYPHEN:
      // Handle negative sign separately
      const isNegative = formattedNumber.startsWith('-');
      let numStr = isNegative ? formattedNumber.substring(1) : formattedNumber;
      // Remove group separators (spaces) and replace decimal separator (hyphen)
      numStr = numStr.replace(/ /g, '').replace('-', '.');
      cleanNumber = isNegative ? `-${numStr}` : numStr;
      break;
    case NumberFormat.SPACE_COMMA:
      cleanNumber = formattedNumber.replace(/ /g, '').replace(',', '.');
      break;
    case NumberFormat.COMMA_SLASH:
      cleanNumber = formattedNumber.replace(/,/g, '').replace('/', '.');
      break;
    case NumberFormat.COMMA_DOT_LEADING:
      cleanNumber = formattedNumber.replace(/,/g, '');
      break;
    case NumberFormat.SPACE_NO_DECIMAL:
      cleanNumber = formattedNumber.replace(/ /g, '');
      break;
    default:
      cleanNumber = formattedNumber.replace(/,/g, '');
  }
  
  return parseFloat(cleanNumber);
};
/**
 * Parses a formatted number string in the current budget's format into a standard decimal format
 * @param formattedAmount The formatted number string in the current budget's format
 * @returns A string representing the number in standard decimal format (e.g., "1234.56")
 */
export const parseFormattedNumberToDecimal = (formattedAmount: string): string => {
  // If formattedAmount is not provided or empty, return "0.00"
  if (!formattedAmount) {
    return "0.00";
  }

  try {
    const budgetStore = useBudgetStore();
    // Default to DOT_COMMA if store or budget or format is missing
    const currentFormat = budgetStore?.currentBudget?.number_format || NumberFormat.DOT_COMMA;

    // Parse the formatted string back to a number
    const number = parseFormattedNumber(formattedAmount, currentFormat);

    // Format to standard decimal format with 2 decimal places using safeToFixed
    return safeToFixed(number, 2);
  } catch (error) {
    // Log the error for debugging purposes
    console.error(`Error parsing formatted number "${formattedAmount}":`, error);

    // Fallback: Attempt parsing assuming a simple format (like DOT_COMMA or plain float)
    // Remove potential commas as group separators before trying parseFloat
    const cleanedAmount = formattedAmount.replace(/,/g, '');
    const number = parseFloat(cleanedAmount);

    // Return formatted number or "0.00" if fallback also fails using safeToFixed
    return safeToFixed(number, 2);
  }
};
