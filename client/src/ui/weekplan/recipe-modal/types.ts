/**
 * Types for recipe modal.
 */

import type { DeltaItem } from '../types.js';

export interface RecipeModalState {
  removedItems: Set<string>;
  addedItems: Map<string, DeltaItem>;
  adjustedQuantities: Map<string, string>;
  adjustedQuantity: number;
}
