/**
 * Delta management (removed and added items).
 */

import type { WeekplanDeltas, DeltaItem } from '../types.js';
import type { RecipeModalState } from './types.js';

/**
 * Initialize state from current deltas.
 */
export function initializeStateFromDeltas(
  currentDeltas: WeekplanDeltas,
  originalQuantity: number
): RecipeModalState {
  return {
    removedItems: new Set<string>(currentDeltas.removed_items),
    addedItems: new Map<string, DeltaItem>(
      currentDeltas.added_items.map(item => [item.name, item])
    ),
    adjustedQuantities: new Map<string, string>(),
    adjustedQuantity: (currentDeltas.person_count !== undefined && currentDeltas.person_count > 0)
      ? currentDeltas.person_count
      : originalQuantity
  };
}

/**
 * Create deltas object for saving.
 */
export function createDeltasForSave(
  state: RecipeModalState,
  originalQuantity: number
): WeekplanDeltas {
  return {
    removed_items: Array.from(state.removedItems),
    added_items: Array.from(state.addedItems.values()),
    person_count: state.adjustedQuantity !== originalQuantity ? state.adjustedQuantity : undefined
  };
}
