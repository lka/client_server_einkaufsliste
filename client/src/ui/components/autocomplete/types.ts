/**
 * Autocomplete component types and interfaces.
 */

export interface AutocompleteSuggestion {
  id: string | number;
  label: string;
  data?: any;
}

export interface AutocompleteConfig {
  input: HTMLInputElement;
  onSearch: (query: string) => Promise<AutocompleteSuggestion[]>;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  debounceMs?: number;
  minChars?: number;
  maxSuggestions?: number;
  placeholder?: string;
}
