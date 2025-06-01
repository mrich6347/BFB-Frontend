/**
 * Utility functions for managing expanded account sections in local storage
 */

const STORAGE_KEY_PREFIX = 'bfb-expanded-accounts-';

/**
 * Save the expanded account sections for a specific budget to local storage
 *
 * @param budgetId The ID of the budget
 * @param expandedSections Object with section names as keys and boolean values
 */
export const saveExpandedAccounts = (budgetId: string, expandedSections: Record<string, boolean>): void => {
  if (!budgetId) return;

  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${budgetId}`;
    localStorage.setItem(storageKey, JSON.stringify(expandedSections));
  } catch (error) {
    console.error('Failed to save expanded account sections to local storage:', error);
  }
};

/**
 * Load the expanded account sections for a specific budget from local storage
 *
 * @param budgetId The ID of the budget
 * @returns Object with section names as keys and boolean values, or null if no saved state exists
 */
export const loadExpandedAccounts = (budgetId: string): Record<string, boolean> | null => {
  if (!budgetId) return null;

  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${budgetId}`;
    const storedValue = localStorage.getItem(storageKey);

    if (storedValue !== null) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error('Failed to load expanded account sections from local storage:', error);
  }

  return null;
};
