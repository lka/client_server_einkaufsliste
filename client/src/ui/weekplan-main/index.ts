/**
 * Weekplan UI Module - Public API
 *
 * Main orchestration for the weekly planning view
 */

export { initWeekplan } from './initialization.js';
export { renderWeek } from './week-renderer.js';
export { navigateToPreviousWeekLocal, navigateToNextWeekLocal } from './navigation-handlers.js';
export { handleWeekplanAdded, handleWeekplanDeleted } from './websocket-handlers.js';
export { setupDetailsEventListener } from './event-handlers.js';
