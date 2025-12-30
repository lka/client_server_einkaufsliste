/**
 * Date utilities for entry input
 */

import { weekplanState } from '../weekplan-state.js';
import { getMonday, formatISODate } from '../weekplan-utils.js';
import { DAY_NAMES } from '../types.js';

/**
 * Calculate the ISO date string for a given day name
 */
export function calculateDateForDay(dayName: string): string {
  const today = new Date();
  const offset = weekplanState.getWeekOffset();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (offset * 7));
  const monday = getMonday(targetDate);

  const dayIndex = DAY_NAMES.indexOf(dayName as any);
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayIndex);

  return formatISODate(date);
}
