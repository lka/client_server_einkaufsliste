/**
 * Autocomplete component for text input with suggestions.
 *
 * Features:
 * - Dynamic suggestions based on user input
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Mouse/Touch selection
 * - Debounced search for performance
 * - Customizable suggestion rendering
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

    this.init();
  }

  private init(): void {
    // Create suggestions container
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'autocomplete-suggestions';
    this.suggestionsContainer.style.display = 'none';

    // Insert after input
    this.input.parentElement?.appendChild(this.suggestionsContainer);

    // Attach event listeners
    this.input.addEventListener('input', this.handleInput.bind(this));
    this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.input.addEventListener('blur', this.handleBlur.bind(this));
    this.input.addEventListener('focus', this.handleFocus.bind(this));

    // Click outside to close
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  private handleInput(): void {
    const query = this.input.value.trim();

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Hide suggestions if query is too short
    if (query.length < this.minChars) {
      this.hideSuggestions();
      return;
    }

    // Debounce search
    this.debounceTimer = window.setTimeout(async () => {
      await this.search(query);
    }, this.debounceMs);
  }

  private async search(query: string): Promise<void> {
    this.showLoadingState();

    try {
      const results = await this.onSearch(query);
      this.suggestions = results.slice(0, this.maxSuggestions);
      this.selectedIndex = -1;
      this.renderSuggestions();
    } catch (error) {
      console.error('Autocomplete search error:', error);
      this.hideSuggestions();
    }
  }

  private showLoadingState(): void {
    if (!this.suggestionsContainer) return;

    this.suggestionsContainer.innerHTML = `
      <div class="autocomplete-loading">
        <span class="spinner-small"></span>
        Suche...
      </div>
    `;
    this.suggestionsContainer.style.display = 'block';
  }

  private renderSuggestions(): void {
    if (!this.suggestionsContainer) return;

    if (this.suggestions.length === 0) {
      this.suggestionsContainer.innerHTML = `
        <div class="autocomplete-no-results">
          Keine Vorschläge gefunden
        </div>
      `;
      this.suggestionsContainer.style.display = 'block';
      return;
    }

    this.suggestionsContainer.innerHTML = '';
    this.suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = suggestion.label;
      item.dataset.index = index.toString();

      // Mouse events
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent input blur
        this.selectSuggestion(index);
      });

      item.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      this.suggestionsContainer!.appendChild(item);
    });

    this.suggestionsContainer.style.display = 'block';
  }

  private updateSelection(): void {
    if (!this.suggestionsContainer) return;

    const items = this.suggestionsContainer.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
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
        this.updateSelection();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSuggestion(this.selectedIndex);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.hideSuggestions();
        break;
    }
  }

  private selectSuggestion(index: number): void {
    if (index < 0 || index >= this.suggestions.length) return;

    const suggestion = this.suggestions[index];
    this.input.value = suggestion.label;
    this.hideSuggestions();
    this.onSelect(suggestion);
  }

  private handleBlur(): void {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      this.hideSuggestions();
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
      this.hideSuggestions();
    }
  }

  private hideSuggestions(): void {
    if (this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'none';
    }
    this.selectedIndex = -1;
  }

  /**
   * Clear input and hide suggestions.
   */
  public clear(): void {
    this.input.value = '';
    this.hideSuggestions();
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

    // Remove event listeners
    this.input.removeEventListener('input', this.handleInput.bind(this));
    this.input.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.input.removeEventListener('blur', this.handleBlur.bind(this));
    this.input.removeEventListener('focus', this.handleFocus.bind(this));
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }
}