/**
 * WebSocket event handlers for weekplan
 */

import type { WeekplanEntry } from '../../data/api.js';
import { weekplanState, addMealItemToDOM, DAY_NAMES } from '../weekplan/index.js';

/**
 * Handle incoming WebSocket event for weekplan entry added
 */
export function handleWeekplanAdded(data: WeekplanEntry): void {
  // Add to state
  weekplanState.addEntry(data);

  // Find the correct meal section and add to DOM
  // Calculate which day of the week this date is
  const entryDate = new Date(data.date);
  const dayOfWeek = entryDate.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6
  const dayName = DAY_NAMES[dayIndex];

  const dayColumn = document.querySelector(`.day-column[data-day="${dayName}"]`);
  if (dayColumn) {
    const mealSection = dayColumn.querySelector(`.meal-section[data-meal="${data.meal}"]`);
    if (mealSection) {
      const mealContent = mealSection.querySelector('.meal-content');
      if (mealContent && data.id) {
        addMealItemToDOM(mealContent, data.text, data.id, data.recipe_id, data.template_id, data.entry_type);
      }
    }
  }
}

/**
 * Handle incoming WebSocket event for weekplan entry deleted
 */
export function handleWeekplanDeleted(data: { id: number }): void {
  // Remove from state
  weekplanState.removeEntry(data.id);

  // Remove from DOM
  const item = document.querySelector(`.meal-item[data-entry-id="${data.id}"]`);
  if (item) {
    item.remove();
  }
}
