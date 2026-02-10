/**
 * Autocomplete component main class.
 *
 * Features:
 * - Dynamic suggestions based on user input
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Mouse/Touch selection
 * - Debounced search for performance
 * - Customizable suggestion rendering
 */

import type { AutocompleteConfig, AutocompleteSuggestion } from './types.js';
import {
  showLoadingState,
  renderSuggestions,
  updateSelection,
  hideSuggestions,
} from './rendering.js';

export class Autocomplete {
  private input: HTMLInputElement;
  private onSearch: (query: string) => Promise<AutocompleteSuggestion[]>;
  private onSelect: (suggestion: AutocompleteSuggestion) => void;
  private debounceMs: number;
  private minChars: number;
  private maxSuggestions: number;

  private suggestionsContainer: HTMLDivElement | null = null;
  private suggestions: AutocompleteSuggestion[] = [];
  private selectedIndex: number = -1;
  private debounceTimer: number | null = null;

  // Store bound handlers for proper cleanup
  private boundHandleInput: () => void;
  private boundHandleKeyDown: (event: KeyboardEvent) => void;
  private boundHandleBlur: () => void;
  private boundHandleFocus: () => void;
  private boundHandleDocumentClick: (event: MouseEvent) => void;

  constructor(config: AutocompleteConfig) {
    this.input = config.input;
    this.onSearch = config.onSearch;
    this.onSelect = config.onSelect;
    this.debounceMs = config.debounceMs ?? 300;
    this.minChars = config.minChars ?? 1;
    this.maxSuggestions = config.maxSuggestions ?? 10;

    if (config.placeholder) {
      this.input.placeholder = config.placeholder;
    }

    // Bind event handlers once
    this.boundHandleInput = this.handleInput.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleBlur = this.handleBlur.bind(this);
    this.boundHandleFocus = this.handleFocus.bind(this);
    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);

    this.init();
  }

  private init(): void {
    // Create suggestions container
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'autocomplete-suggestions';
    this.suggestionsContainer.style.display = 'none';

    // Insert after input
    this.input.parentElement?.appendChild(this.suggestionsContainer);

    // Attach event listeners using bound handlers
    this.input.addEventListener('input', this.boundHandleInput);
    this.input.addEventListener('keydown', this.boundHandleKeyDown);
    this.input.addEventListener('blur', this.boundHandleBlur);
    this.input.addEventListener('focus', this.boundHandleFocus);

    // Click outside to close
    document.addEventListener('click', this.boundHandleDocumentClick);
  }

  private handleInput(): void {
    const query = this.input.value.trim();

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Hide suggestions if query is too short
    if (query.length < this.minChars) {
      this.hideContainerSuggestions();
      return;
    }

    // Debounce search
    this.debounceTimer = window.setTimeout(async () => {
      await this.search(query);
    }, this.debounceMs);
  }

  private async search(query: string): Promise<void> {
    if (!this.suggestionsContainer) return;

    showLoadingState(this.suggestionsContainer);

    try {
      const results = await this.onSearch(query);
      this.suggestions = results.slice(0, this.maxSuggestions);
      this.selectedIndex = -1;
      this.renderCurrentSuggestions();
    } catch (error) {
      console.error('Autocomplete search error:', error);
      this.hideContainerSuggestions();
    }
  }

  private renderCurrentSuggestions(): void {
    if (!this.suggestionsContainer) return;

    renderSuggestions(
      this.suggestionsContainer,
      this.suggestions,
      (index) => this.selectSuggestion(index),
      (index) => {
        this.selectedIndex = index;
        this.updateCurrentSelection();
      }
    );

    this.adjustDropdownPosition();
  }

  private adjustDropdownPosition(): void {
    if (!this.suggestionsContainer) return;

    // Reset previous adjustments
    this.suggestionsContainer.style.left = '';
    this.suggestionsContainer.style.right = '';

    const rect = this.suggestionsContainer.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;

    if (rect.right > viewportWidth) {
      // Dropdown overflows right edge - align to right side of parent
      this.suggestionsContainer.style.left = 'auto';
      this.suggestionsContainer.style.right = '0';
    }
  }

  private updateCurrentSelection(): void {
    if (!this.suggestionsContainer) return;
    updateSelection(this.suggestionsContainer, this.selectedIndex);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.suggestionsContainer || this.suggestions.length === 0) {
      return;
    }

    const isVisible = this.suggestionsContainer.style.display === 'block';
    if (!isVisible) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.suggestions.length - 1
        );
        this.updateCurrentSelection();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateCurrentSelection();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSuggestion(this.selectedIndex);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.hideContainerSuggestions();
        break;
    }
  }

  private selectSuggestion(index: number): void {
    if (index < 0 || index >= this.suggestions.length) return;

    const suggestion = this.suggestions[index];
    this.input.value = suggestion.label;
    this.hideContainerSuggestions();
    this.onSelect(suggestion);
  }

  private handleBlur(): void {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      this.hideContainerSuggestions();
    }, 200);
  }

  private handleFocus(): void {
    // Show suggestions if we have a query
    const query = this.input.value.trim();
    if (query.length >= this.minChars && this.suggestions.length > 0) {
      if (this.suggestionsContainer) {
        this.suggestionsContainer.style.display = 'block';
      }
    }
  }

  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !this.input.contains(target) &&
      !this.suggestionsContainer?.contains(target)
    ) {
      this.hideContainerSuggestions();
    }
  }

  private hideContainerSuggestions(): void {
    if (this.suggestionsContainer) {
      hideSuggestions(this.suggestionsContainer);
    }
    this.selectedIndex = -1;
  }

  /**
   * Clear input and hide suggestions.
   */
  public clear(): void {
    this.input.value = '';
    this.hideContainerSuggestions();
    this.suggestions = [];
  }

  /**
   * Destroy the autocomplete instance and clean up.
   */
  public destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (this.suggestionsContainer) {
      this.suggestionsContainer.remove();
      this.suggestionsContainer = null;
    }

    // Remove event listeners using the same bound handlers
    this.input.removeEventListener('input', this.boundHandleInput);
    this.input.removeEventListener('keydown', this.boundHandleKeyDown);
    this.input.removeEventListener('blur', this.boundHandleBlur);
    this.input.removeEventListener('focus', this.boundHandleFocus);
    document.removeEventListener('click', this.boundHandleDocumentClick);
  }
}
