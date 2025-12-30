/**
 * Initialization logic for weekplan UI
 */

import type { WeekplanEntry } from '../../data/api.js';
import { onWeekplanAdded, onWeekplanDeleted } from '../../data/websocket.js';
import { handleAddMealEntry, handlePrintWeekplan, initializeWeekplanWebSocket } from '../weekplan/index.js';
import { renderWeek } from './week-renderer.js';
import { navigateToPreviousWeekLocal, navigateToNextWeekLocal } from './navigation-handlers.js';
import { handleWeekplanAdded, handleWeekplanDeleted } from './websocket-handlers.js';
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

  // Subscribe to WebSocket events
  onWeekplanAdded((data: WeekplanEntry) => {
    handleWeekplanAdded(data);
  });

  onWeekplanDeleted((data: { id: number }) => {
    handleWeekplanDeleted(data);
  });
}
