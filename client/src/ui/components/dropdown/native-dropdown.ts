/**
 * Native HTML select dropdown.
 */

import type { DropdownOption, DropdownInstance } from './types.js';

/**
 * Create native select dropdown.
 */
export function createNativeDropdown(
  dropdownOptions: DropdownOption[],
  placeholder: string | undefined,
  value: string,
  onChange: ((value: string) => void) | undefined,
  disabled: boolean,
  ariaLabel: string | undefined,
  container: HTMLDivElement
): DropdownInstance {
  const select = document.createElement('select');
  select.className = 'dropdown-select';
  if (ariaLabel) {
    select.setAttribute('aria-label', ariaLabel);
  }
  if (disabled) {
    select.disabled = true;
  }

  // Add placeholder option
  if (placeholder) {
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = !value;
    select.appendChild(placeholderOption);
  }

  // Add options
  renderNativeOptions(select, dropdownOptions, value);

  // Add change listener
  if (onChange) {
    select.addEventListener('change', () => onChange(select.value));
  }

  container.appendChild(select);

  return {
    container,
    select,
    getValue: () => select.value,
    setValue: (newValue: string) => {
      select.value = newValue;
    },
    setOptions: (newOptions: DropdownOption[]) => {
      select.innerHTML = '';
      if (placeholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        placeholderOption.disabled = true;
        select.appendChild(placeholderOption);
      }
      renderNativeOptions(select, newOptions, '');
    },
    setDisabled: (isDisabled: boolean) => {
      select.disabled = isDisabled;
    },
  };
}

/**
 * Render options for native select.
 */
function renderNativeOptions(
  select: HTMLSelectElement,
  options: DropdownOption[],
  selectedValue: string
): void {
  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.disabled) {
      option.disabled = true;
    }
    if (opt.value === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}
