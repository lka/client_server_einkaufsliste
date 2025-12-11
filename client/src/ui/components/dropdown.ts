/**
 * Dropdown Component
 * Customizable dropdown/select component with search functionality
 */

export type { DropdownOption, DropdownOptions, DropdownInstance } from './dropdown/types.js';
export { injectDropdownStyles } from './dropdown/styles.js';

import type { DropdownOptions, DropdownInstance } from './dropdown/types.js';
import { createNativeDropdown } from './dropdown/native-dropdown.js';
import { createSearchableDropdown } from './dropdown/searchable-dropdown.js';

/**
 * Create a dropdown component
 */
export function createDropdown(options: DropdownOptions): DropdownInstance {
  const {
    options: dropdownOptions,
    placeholder = 'Select an option',
    searchable = false,
    disabled = false,
    value = '',
    onChange,
    className = '',
    'aria-label': ariaLabel,
  } = options;

  const container = document.createElement('div');
  container.className = `dropdown-container ${className}`;

  if (searchable) {
    const customDropdown = createSearchableDropdown(
      dropdownOptions,
      placeholder,
      value,
      onChange,
      disabled,
      ariaLabel
    );
    container.appendChild(customDropdown.element);

    return {
      container,
      select: customDropdown.hiddenSelect,
      getValue: customDropdown.getValue,
      setValue: customDropdown.setValue,
      setOptions: customDropdown.setOptions,
      setDisabled: customDropdown.setDisabled,
    };
  } else {
    return createNativeDropdown(
      dropdownOptions,
      placeholder,
      value,
      onChange,
      disabled,
      ariaLabel,
      container
    );
  }
}
