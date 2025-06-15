/**
 * Utility functions for managing the last visited budget ID in local storage
 */

const STORAGE_KEY = 'bfb-last-visited-budget';

/**
 * Save the last visited budget ID to local storage
 *
 * @param budgetId The ID of the budget that was visited
 */
export const saveLastVisitedBudget = (budgetId: string): void => {
  if (!budgetId) return;

  try {
    localStorage.setItem(STORAGE_KEY, budgetId);
  } catch (error) {
    console.error('Failed to save last visited budget to local storage:', error);
  }
};

/**
 * Get the last visited budget ID from local storage
 *
 * @returns The budget ID if it exists, null otherwise
 */
export const getLastVisitedBudget = (): string | null => {
  try {
    const budgetId = localStorage.getItem(STORAGE_KEY);
    return budgetId;
  } catch (error) {
    console.error('Failed to load last visited budget from local storage:', error);
    return null;
  }
};

/**
 * Clear the last visited budget ID from local storage
 */
export const clearLastVisitedBudget = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear last visited budget from local storage:', error);
  }
};
