/**
 * Utility functions for recipe modal.
 */

import type { WeekplanEntry } from '../types.js';
import { weekplanState } from '../weekplan-state.js';

/**
 * Find an entry by ID in the weekplan state.
 */
export function findEntryById(entryId: number): WeekplanEntry | undefined {
  const allEntries = weekplanState.getAllEntries();
  for (const dateMap of allEntries.values()) {
    for (const entries of dateMap.values()) {
      const entry = entries.find(e => e.id === entryId);
      if (entry) return entry;
    }
  }
  return undefined;
}

/**
 * Parse original quantity from recipe data.
 */
export function parseOriginalQuantity(recipeData: any): number {
  if (recipeData.quantity) {
    const parsed = parseInt(String(recipeData.quantity));
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1;
}
