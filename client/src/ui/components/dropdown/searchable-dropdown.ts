/**
 * Searchable dropdown with custom UI.
 */

import type { DropdownOption, SearchableDropdownState } from './types.js';
import { renderSearchableOptions } from './option-renderer.js';
import { createDropdownPanel, createTriggerButton } from './ui-builder.js';

/**
 * Create a searchable dropdown with custom UI.
 */
export function createSearchableDropdown(
  options: DropdownOption[],
  placeholder: string,
  initialValue: string,
  onChange?: (value: string) => void,
  disabled?: boolean,
  ariaLabel?: string
) {
  const state: SearchableDropdownState = {
    currentValue: initialValue,
    currentOptions: [...options],
    isOpen: false,
  };

  // Create hidden native select for form submission
  const hiddenSelect = document.createElement('select');
  hiddenSelect.style.display = 'none';
  hiddenSelect.value = initialValue;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'dropdown-searchable';
  if (disabled) {
    wrapper.classList.add('dropdown-disabled');
  }

  // Helper to get selected label
  const getSelectedLabel = (): string => {
    const selected = options.find((opt) => opt.value === state.currentValue);
    return selected?.label || '';
  };

  // Create trigger button
  const { trigger, selectedLabel } = createTriggerButton(
    getSelectedLabel() || placeholder,
    disabled,
    ariaLabel
  );

  // Create dropdown panel
  const { panel, searchInput, optionsList } = createDropdownPanel();

  // Render options function
  const renderOptions = (optionsToRender = state.currentOptions) => {
    renderSearchableOptions(
      optionsList,
      optionsToRender,
      state.currentValue,
      (opt) => handleOptionSelect(opt)
    );
  };

  // Handle option selection
  const handleOptionSelect = (opt: DropdownOption) => {
    if (opt.disabled) return;
    state.currentValue = opt.value;
    hiddenSelect.value = opt.value;
    selectedLabel.textContent = opt.label;
    closeDropdown();

    if (onChange) {
      onChange(opt.value);
    }
  };

  // Close dropdown
  const closeDropdown = () => {
    state.isOpen = false;
    panel.style.display = 'none';
    wrapper.classList.remove('dropdown-open');
  };

  // Toggle dropdown
  trigger.addEventListener('click', () => {
    if (disabled) return;
    state.isOpen = !state.isOpen;
    panel.style.display = state.isOpen ? 'block' : 'none';
    wrapper.classList.toggle('dropdown-open', state.isOpen);
    if (state.isOpen) {
      searchInput.focus();
      searchInput.value = '';
      renderOptions();
    }
  });

  // Search functionality
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm)
    );
    renderOptions(filtered);
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target as Node) && state.isOpen) {
      closeDropdown();
    }
  });

  // Initial render
  renderOptions();

  wrapper.appendChild(hiddenSelect);
  wrapper.appendChild(trigger);
  wrapper.appendChild(panel);

  return {
    element: wrapper,
    hiddenSelect,
    getValue: () => state.currentValue,
    setValue: (value: string) => {
      state.currentValue = value;
      hiddenSelect.value = value;
      selectedLabel.textContent = getSelectedLabel() || placeholder;
    },
    setOptions: (newOptions: DropdownOption[]) => {
      state.currentOptions = [...newOptions];
      renderOptions();
    },
    setDisabled: (isDisabled: boolean) => {
      trigger.disabled = isDisabled;
      if (isDisabled) {
        wrapper.classList.add('dropdown-disabled');
        if (state.isOpen) {
          closeDropdown();
        }
      } else {
        wrapper.classList.remove('dropdown-disabled');
      }
    },
  };
}
