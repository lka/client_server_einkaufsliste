/**
 * Initialization logic for weekplan UI
 */

import { handleAddMealEntry, handlePrintWeekplan, initializeWeekplanWebSocket } from '../weekplan/index.js';
import { renderWeek } from './week-renderer.js';
import { navigateToPreviousWeekLocal, navigateToNextWeekLocal } from './navigation-handlers.js';
import { setupDetailsEventListener } from './event-handlers.js';

/**
 * Initialize weekplan UI
 */
export function initWeekplan(): void {
  // Initialize WebSocket integration
  initializeWeekplanWebSocket();

  // Render current week
  renderWeek();

  // Attach event listeners for navigation
  const prevWeekBtn = document.getElementById('prevWeekBtn');
  const nextWeekBtn = document.getElementById('nextWeekBtn');
  const printWeekBtn = document.getElementById('printWeekBtn');

  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', navigateToPreviousWeekLocal);
  }

  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', navigateToNextWeekLocal);
  }

  if (printWeekBtn) {
    printWeekBtn.addEventListener('click', handlePrintWeekplan);
  }

  // Attach event listeners for add meal buttons
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('add-meal-btn')) {
      handleAddMealEntry(event);
    }
  });

  // Setup details event listener
  setupDetailsEventListener();
}
