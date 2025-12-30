/**
 * Shopping List UI - Public API.
 *
 * This module provides the complete API for shopping list UI operations.
 * Operations are split into separate modules for better maintainability:
 * - initialization.ts: Main UI setup and orchestration
 * - date-picker-manager.ts: DatePicker initialization and management
 * - event-handlers.ts: Event handling for add, delete, and edit operations
 */

// Main initialization
export { initShoppingListUI, getSelectedStoreId } from './initialization.js';

// DatePicker management
export {
  initializeShoppingDatePicker,
  getShoppingDatePicker,
  getSelectedShoppingDate,
  setSelectedShoppingDate,
  updateDatePickerHighlights,
} from './date-picker-manager.js';

// Event handlers
export { setupAddItemHandlers, setupItemListHandlers } from './event-handlers.js';
