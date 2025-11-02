import { DateFormat } from '@/types/DTO/budget.dto';

/**
 * Formats a UTC date according to the specified format in the user's local timezone
 * @param utcDate - UTC Date to format (can be Date object, ISO string, or timestamp)
 * @param format - DateFormat enum value specifying the desired format (defaults to US_SLASH)
 * @returns Formatted date string in local timezone
 */
export function formatDate(utcDate: Date | string | number, format: DateFormat | undefined = DateFormat.US_SLASH): string {
  // Convert input to Date object if it's not already
  const utcDateObj = utcDate instanceof Date ? utcDate : new Date(utcDate);
  
  // Use default format if format is undefined or invalid
  const dateFormat = format || DateFormat.US_SLASH;
  
  // Get local date components using the user's timezone
  const year = utcDateObj.getFullYear();
  const month = String(utcDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(utcDateObj.getDate()).padStart(2, '0');

  switch (dateFormat) {
    case DateFormat.ISO:
      return `${year}/${month}/${day}`;
    case DateFormat.HYPHEN:
      return `${year}-${month}-${day}`;
    case DateFormat.EUROPEAN:
      return `${day}-${month}-${year}`;
    case DateFormat.UK_SLASH:
      return `${day}/${month}/${year}`;
    case DateFormat.PERIOD:
      return `${day}.${month}.${year}`;
    case DateFormat.US_SLASH:
      return `${month}/${day}/${year}`;
    case DateFormat.DOT_NOTATION:
      return `${year}.${month}.${day}`;
    default:
      throw new Error(`Unsupported date format: ${dateFormat}`);
  }
}

/**
 * Gets the current timezone offset string (e.g., "UTC+01:00")
 * @returns Current timezone offset as a string
 */
export function getCurrentTimezoneOffset(): string {
  const date = new Date();
  const tzOffset = -date.getTimezoneOffset();
  const tzHours = Math.floor(Math.abs(tzOffset) / 60);
  const tzMinutes = Math.abs(tzOffset) % 60;
  return `UTC${tzOffset >= 0 ? '+' : '-'}${String(tzHours).padStart(2, '0')}:${String(tzMinutes).padStart(2, '0')}`;
}
