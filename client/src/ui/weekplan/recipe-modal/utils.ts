/**
 * Utility functions for recipe modal.
 */

import type { WeekplanEntry } from '../types.js';
import { weekplanState } from '../../../state/weekplan-state.js';

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
 * Checks multiple common field names used by different recipe apps.
 */
export function parseOriginalQuantity(recipeData: any): number {
  const raw = recipeData.quantity ?? recipeData.recipeYield ?? recipeData.servings ?? recipeData.recipeServings;
  if (raw) {
    const parsed = parseInt(String(raw));
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1;
}
