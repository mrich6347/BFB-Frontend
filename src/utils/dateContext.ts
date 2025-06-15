/**
 * Utility functions for generating user date context to send to the backend
 * This ensures that timezone-sensitive operations use the user's local time
 * instead of the server's timezone
 */

export interface UserDateContext {
  userDate: string;    // "2024-12-15" (user's current date)
  userYear: number;    // 2024
  userMonth: number;   // 12
}

/**
 * Generate user date context for the current moment
 */
export function getCurrentUserDateContext(): UserDateContext {
  const now = new Date();
  
  return {
    userDate: now.toISOString().split('T')[0], // "YYYY-MM-DD"
    userYear: now.getFullYear(),
    userMonth: now.getMonth() + 1 // JavaScript months are 0-based, but we want 1-based
  };
}

/**
 * Generate user date context for a specific date
 */
export function getUserDateContextForDate(date: Date): UserDateContext {
  return {
    userDate: date.toISOString().split('T')[0], // "YYYY-MM-DD"
    userYear: date.getFullYear(),
    userMonth: date.getMonth() + 1 // JavaScript months are 0-based, but we want 1-based
  };
}

/**
 * Check if a date is in the future relative to user's current date
 */
export function isDateInFuture(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  return date > today;
}

/**
 * Get the current month/year for display purposes
 */
export function getCurrentMonthYear(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
}

/**
 * Format a date for display (user's locale)
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
