/**
 * Autocomplete component for text input with suggestions.
 *
 * @deprecated This file has been refactored into a modular structure.
 * Please use './autocomplete/index.js' instead, or import specific modules:
 * - './autocomplete/autocomplete.js' for the main Autocomplete class
 * - './autocomplete/types.js' for TypeScript types
 * - './autocomplete/styles.js' for style injection
 *
 * This file is kept for backward compatibility and re-exports all functionality.
 *
 * Features:
 * - Dynamic suggestions based on user input
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Mouse/Touch selection
 * - Debounced search for performance
 * - Customizable suggestion rendering
 */

// Re-export all public API from the modular structure
export { Autocomplete, injectAutocompleteStyles } from './autocomplete/index.js';
export type { AutocompleteSuggestion, AutocompleteConfig } from './autocomplete/index.js';
