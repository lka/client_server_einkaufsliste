/**
 * Weekplan entry input module - Public API
 *
 * Handles creating and managing entry input fields with autocomplete
 */

export { handleAddMealEntry } from './entry-handler.js';
export { createEntryInput } from './input-creation.js';
export { saveEntry } from './entry-save.js';
export { calculateDateForDay } from './date-utils.js';
export { searchSuggestions, parseSuggestionId } from './autocomplete-helpers.js';
