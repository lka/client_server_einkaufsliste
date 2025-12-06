/**
 * WebSocket integration for weekplan real-time updates
 */

import { onWeekplanAdded, onWeekplanDeleted } from '../../data/websocket.js';
import { weekplanState } from './weekplan-state.js';
import type { WeekplanEntry, DAY_NAMES } from './types.js';

/**
 * Handle incoming WebSocket event for weekplan entry added
 */
function handleWeekplanAdded(data: WeekplanEntry): void {
  // Add to state
  weekplanState.addEntry(data);

  // Find the correct meal section and add to DOM
  const dayNames: typeof DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Calculate which day of the week this date is
  const entryDate = new Date(data.date);
  const dayOfWeek = entryDate.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6
  const dayName = dayNames[dayIndex];

  const dayColumn = document.querySelector(`.day-column[data-day="${dayName}"]`);
  if (dayColumn) {
    const mealSection = dayColumn.querySelector(`.meal-section[data-meal="${data.meal}"]`);
    if (mealSection) {
      const mealContent = mealSection.querySelector('.meal-content');
      if (mealContent && data.id) {
        // Import dynamically to avoid circular dependency
        import('./weekplan-rendering.js').then(({ addMealItemToDOM }) => {
          addMealItemToDOM(mealContent, data.text, data.id!, data.recipe_id);
        });
      }
    }
  }
}

/**
 * Handle incoming WebSocket event for weekplan entry deleted
 */
function handleWeekplanDeleted(data: { id: number }): void {
  // Remove from state
  weekplanState.removeEntry(data.id);

  // Remove from DOM
  const item = document.querySelector(`.meal-item[data-entry-id="${data.id}"]`);
  if (item) {
    item.remove();
  }
}

/**
 * Initialize WebSocket listeners for weekplan
 * Should be called once during weekplan initialization
 */
export function initializeWeekplanWebSocket(): void {
  // Subscribe to WebSocket events
  onWeekplanAdded(handleWeekplanAdded);
  onWeekplanDeleted(handleWeekplanDeleted);
}
