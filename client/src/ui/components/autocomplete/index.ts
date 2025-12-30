/**
 * Autocomplete Component - Public API.
 *
 * This module provides autocomplete functionality with:
 * - Dynamic suggestions based on user input
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Mouse/Touch selection
 * - Debounced search for performance
 * - Customizable suggestion rendering
 *
 * Modules:
 * - styles.ts: CSS styling and injection
 * - types.ts: TypeScript interfaces
 * - rendering.ts: DOM rendering functions
 * - autocomplete.ts: Main Autocomplete class
 */

// Export types
export type { AutocompleteSuggestion, AutocompleteConfig } from './types.js';

// Export main class
export { Autocomplete } from './autocomplete.js';

// Export styles function
export { injectAutocompleteStyles } from './styles.js';
