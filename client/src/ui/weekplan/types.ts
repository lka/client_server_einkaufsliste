/**
 * Shared types for weekplan module
 */

import type { WeekplanEntry, WeekplanDeltas, DeltaItem } from '../../data/api.js';

// Re-export API types for convenience
export type { WeekplanEntry, WeekplanDeltas, DeltaItem };

/**
 * Parsed ingredient with quantity and name
 */
export interface ParsedIngredient {
  quantity: string | null;
  name: string;
  originalLine: string;
}

/**
 * Weekplan state structure
 */
export interface WeekplanState {
  entriesStore: Map<string, Map<string, WeekplanEntry[]>>;
  weekOffset: number;
}

/**
 * Day names in order
 */
export const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

/**
 * Meal types
 */
export const MEAL_TYPES = ['morning', 'lunch', 'dinner'] as const;

export type DayName = typeof DAY_NAMES[number];
export type MealType = typeof MEAL_TYPES[number];

/**
 * Week information
 */
export interface WeekInfo {
  weekNumber: number;
  year: number;
  monday: Date;
  dates: Date[];
}
