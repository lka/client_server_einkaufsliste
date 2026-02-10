/**
 * Autocomplete rendering functions.
 */

import type { AutocompleteSuggestion } from './types.js';

/**
 * Show loading state in suggestions container.
 */
export function showLoadingState(container: HTMLDivElement): void {
  container.innerHTML = `
    <div class="autocomplete-loading">
      <span class="spinner-small"></span>
      Suche...
    </div>
  `;
  container.style.display = 'block';
}

/**
 * Render suggestions in container.
 */
export function renderSuggestions(
  container: HTMLDivElement,
  suggestions: AutocompleteSuggestion[],
  onItemMousedown: (index: number, event: MouseEvent) => void,
  onItemMouseenter: (index: number) => void
): void {
  if (suggestions.length === 0) {
    container.innerHTML = `
      <div class="autocomplete-no-results">
        Keine Vorschläge gefunden
      </div>
    `;
    container.style.display = 'block';
    return;
  }

  container.innerHTML = '';
  suggestions.forEach((suggestion, index) => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.textContent = suggestion.label;
    item.dataset.index = index.toString();

    // Use mousedown instead of click to trigger before blur
    item.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent input blur
      e.stopPropagation(); // Stop event from bubbling
      onItemMousedown(index, e);
    });

    // Touch support for tablets/mobile: distinguish tap from scroll
    let touchStartY = 0;
    item.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    item.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const moved = Math.abs(touchEndY - touchStartY);
      if (moved > 10) return; // Was a scroll, not a tap

      e.preventDefault();
      e.stopPropagation();
      onItemMousedown(index, e as unknown as MouseEvent);
    });

    item.addEventListener('mouseenter', () => {
      onItemMouseenter(index);
    });

    container.appendChild(item);
  });

  container.style.display = 'block';
}

/**
 * Update visual selection in suggestions.
 */
export function updateSelection(
  container: HTMLDivElement,
  selectedIndex: number
): void {
  const items = container.querySelectorAll('.autocomplete-item');
  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

/**
 * Hide suggestions container.
 */
export function hideSuggestions(container: HTMLDivElement): void {
  container.style.display = 'none';
}
