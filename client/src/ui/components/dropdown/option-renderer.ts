/**
 * Option rendering for searchable dropdown.
 */

import type { DropdownOption } from './types.js';

/**
 * Render options in the dropdown list.
 */
export function renderSearchableOptions(
  optionsList: HTMLDivElement,
  optionsToRender: DropdownOption[],
  currentValue: string,
  onSelect: (option: DropdownOption) => void
): void {
  optionsList.innerHTML = '';

  if (optionsToRender.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'dropdown-no-results';
    noResults.textContent = 'No results found';
    optionsList.appendChild(noResults);
    return;
  }

  optionsToRender.forEach((opt) => {
    const optionEl = document.createElement('button');
    optionEl.type = 'button';
    optionEl.className = 'dropdown-option';
    optionEl.textContent = opt.label;
    optionEl.disabled = !!opt.disabled;

    if (opt.value === currentValue) {
      optionEl.classList.add('dropdown-option-selected');
    }

    optionEl.addEventListener('click', () => onSelect(opt));

    optionsList.appendChild(optionEl);
  });
}
