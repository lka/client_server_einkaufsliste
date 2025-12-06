/**
 * Weekplan navigation functionality
 */

import { weekplanState } from './weekplan-state.js';
import { getMonday, getISOWeek, formatShortDate, getWeekDates } from './weekplan-utils.js';
import type { WeekInfo } from './types.js';

/**
 * Get current week information based on the offset
 */
export function getCurrentWeekInfo(): WeekInfo {
  const today = new Date();
  const offset = weekplanState.getWeekOffset();

  // Calculate target date based on offset
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (offset * 7));

  const monday = getMonday(targetDate);
  const weekNumber = getISOWeek(monday);
  const year = monday.getFullYear();
  const dates = getWeekDates(monday);

  return {
    weekNumber,
    year,
    monday,
    dates
  };
}

/**
 * Get formatted date range string for current week
 * @returns String like "KW 47 · 18.11. - 24.11.2024"
 */
export function getWeekDisplayString(): string {
  const { weekNumber, year, dates } = getCurrentWeekInfo();

  const startDateStr = formatShortDate(dates[0]);
  const endDateStr = formatShortDate(dates[6]);

  return `KW ${weekNumber} · ${startDateStr} - ${endDateStr}${year}`;
}

/**
 * Navigate to previous week
 */
export function navigateToPreviousWeek(): void {
  weekplanState.decrementWeekOffset();
}

/**
 * Navigate to next week
 */
export function navigateToNextWeek(): void {
  weekplanState.incrementWeekOffset();
}

/**
 * Navigate to current week (reset offset to 0)
 */
export function navigateToCurrentWeek(): void {
  weekplanState.setWeekOffset(0);
}

/**
 * Navigate to a specific week offset
 * @param offset Number of weeks from current (0 = current, -1 = previous, +1 = next)
 */
export function navigateToWeekOffset(offset: number): void {
  weekplanState.setWeekOffset(offset);
}
