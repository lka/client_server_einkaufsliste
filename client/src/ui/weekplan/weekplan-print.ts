/**
 * Print functionality for weekplan
 */

import { printWeekplan } from '../print-utils.js';
import { weekplanState } from './weekplan-state.js';
import { getCurrentWeekInfo } from './weekplan-navigation.js';
import { formatISODate } from './weekplan-utils.js';
import { MEAL_TYPES } from './types.js';

/**
 * Handle printing the current week's plan
 */
export function handlePrintWeekplan(): void {
  const { weekNumber, year, dates } = getCurrentWeekInfo();

  // Build entries map for printing - always include all 7 days
  const printEntries = new Map<string, Map<string, Array<{ id: number; text: string }>>>();

  for (let i = 0; i < 7; i++) {
    const dateISO = formatISODate(dates[i]);
    const dateEntries = weekplanState.getDateEntries(dateISO);
    const dayPrintEntries = new Map<string, Array<{ id: number; text: string }>>();

    MEAL_TYPES.forEach(meal => {
      const mealEntries = dateEntries.get(meal);
      if (mealEntries && mealEntries.length > 0) {
        dayPrintEntries.set(meal, mealEntries.map(e => ({ id: e.id!, text: e.text })));
      }
    });

    // Always add the date to the map, even if there are no entries
    printEntries.set(dateISO, dayPrintEntries);
  }

  // Call print function
  printWeekplan(weekNumber, year, printEntries);
}
