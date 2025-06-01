/**
 * Utility functions for managing expanded category groups in local storage
 */

const STORAGE_KEY_PREFIX = 'bfb-expanded-groups-';

/**
 * Save the expanded groups for a specific budget to local storage
 *
 * @param budgetId The ID of the budget
 * @param expandedGroupIds Array of expanded group IDs
 */
export const saveExpandedGroups = (budgetId: string, expandedGroupIds: string[]): void => {
  if (!budgetId) return;

  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${budgetId}`;
    localStorage.setItem(storageKey, JSON.stringify(expandedGroupIds));
  } catch (error) {
    console.error('Failed to save expanded groups to local storage:', error);
  }
};

/**
 * Load the expanded groups for a specific budget from local storage
 *
 * @param budgetId The ID of the budget
 * @returns Array of expanded group IDs, or null if no saved state exists
 */
export const loadExpandedGroups = (budgetId: string): string[] | null => {
  if (!budgetId) return null;

  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${budgetId}`;
    const storedValue = localStorage.getItem(storageKey);

    if (storedValue !== null) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error('Failed to load expanded groups from local storage:', error);
  }

  return null;
};

/**
 * Clear the expanded groups for a specific budget from local storage
 *
 * @param budgetId The ID of the budget
 */
export const clearExpandedGroups = (budgetId: string): void => {
  if (!budgetId) return;

  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${budgetId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear expanded groups from local storage:', error);
  }
};
