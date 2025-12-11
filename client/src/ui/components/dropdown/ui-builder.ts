/**
 * UI element builders for searchable dropdown.
 */

/**
 * Create trigger button for searchable dropdown.
 */
export function createTriggerButton(
  labelText: string,
  disabled?: boolean,
  ariaLabel?: string
): { trigger: HTMLButtonElement; selectedLabel: HTMLSpanElement } {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dropdown-trigger';
  trigger.disabled = !!disabled;
  if (ariaLabel) {
    trigger.setAttribute('aria-label', ariaLabel);
  }

  const selectedLabel = document.createElement('span');
  selectedLabel.className = 'dropdown-selected-label';
  selectedLabel.textContent = labelText;
  trigger.appendChild(selectedLabel);

  const arrow = document.createElement('span');
  arrow.className = 'dropdown-arrow';
  arrow.innerHTML = '▼';
  trigger.appendChild(arrow);

  return { trigger, selectedLabel };
}

/**
 * Create dropdown panel with search input and options list.
 */
export function createDropdownPanel(): {
  panel: HTMLDivElement;
  searchInput: HTMLInputElement;
  optionsList: HTMLDivElement;
} {
  const panel = document.createElement('div');
  panel.className = 'dropdown-panel';
  panel.style.display = 'none';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'dropdown-search';
  searchInput.placeholder = 'Search...';
  panel.appendChild(searchInput);

  const optionsList = document.createElement('div');
  optionsList.className = 'dropdown-options';
  panel.appendChild(optionsList);

  return { panel, searchInput, optionsList };
}
