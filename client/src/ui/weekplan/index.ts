/**
 * Weekplan Module - Main Entry Point
 *
 * This is a partial refactoring of the weekplan functionality.
 * The module exports utilities and state management that have been
 * successfully extracted from the monolithic weekplan.ts file.
 *
 * Status: Phase 2 Complete (Core Modules)
 * Remaining work: Full integration with entry-input, modals, and complete rendering
 */

// Export types
export * from './types.js';

// Export state management
export { weekplanState } from './weekplan-state.js';

// Export utilities
export {
  getISOWeek,
  getMonday,
  formatShortDate,
  formatISODate,
  getWeekDates,
  isToday
} from './weekplan-utils.js';

// Export navigation
export {
  getCurrentWeekInfo,
  getWeekDisplayString,
  navigateToPreviousWeek,
  navigateToNextWeek,
  navigateToCurrentWeek,
  navigateToWeekOffset
} from './weekplan-navigation.js';

// Export WebSocket integration
export { initializeWeekplanWebSocket } from './weekplan-websocket.js';

// Export print functionality
export { handlePrintWeekplan } from './weekplan-print.js';

// Export rendering (partial)
export { addMealItemToDOM } from './weekplan-rendering.js';

// Export ingredient parser
export {
  parseIngredients,
  adjustQuantityByFactor,
  parseQuantity
} from './ingredient-parser.js';

// Export entry input
export { handleAddMealEntry } from './entry-input.js';

// Export modal shared utilities
export {
  createQuantityAdjustmentSection,
  createAddItemForm,
  createAddedItemsList,
  createScrollableSection,
  createFixedFormSection
} from './modal-shared.js';

// Export template modal
export { showTemplateDetails } from './template-modal.js';

// Export recipe modal
export {
  showRecipeDetails,
  showRecipeDetailsById
} from './recipe-modal.js';

// Re-import for internal use
import { initializeWeekplanWebSocket as initWS } from './weekplan-websocket.js';
import { weekplanState as state } from './weekplan-state.js';

/**
 * Initialize weekplan module
 *
 * Note: Full initialization still handled by main weekplan.ts
 * This will be expanded in future refactoring phases
 */
export function initWeekplanModule(): void {
  // Initialize WebSocket for real-time updates
  initWS();

  // Subscribe to state changes for reactive rendering
  state.subscribe(() => {
    // Trigger re-render when state changes
    // Full implementation in future phase
    console.log('Weekplan state changed');
  });
}
