/**
 * Dropdown Component
 * Customizable dropdown/select component with search functionality
 */

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownOptions {
  options: DropdownOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  'aria-label'?: string;
}

export interface DropdownInstance {
  container: HTMLDivElement;
  select: HTMLSelectElement;
  getValue: () => string;
  setValue: (value: string) => void;
  setOptions: (options: DropdownOption[]) => void;
  setDisabled: (disabled: boolean) => void;
}

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

  // Create container
  const container = document.createElement('div');
  container.className = `dropdown-container ${className}`;

  if (searchable) {
    // Create custom searchable dropdown
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
    // Create native select dropdown
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
    dropdownOptions.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.disabled) {
        option.disabled = true;
      }
      if (opt.value === value) {
        option.selected = true;
      }
      select.appendChild(option);
    });

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
        newOptions.forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          if (opt.disabled) {
            option.disabled = true;
          }
          select.appendChild(option);
        });
      },
      setDisabled: (isDisabled: boolean) => {
        select.disabled = isDisabled;
      },
    };
  }
}

/**
 * Create a searchable dropdown with custom UI
 */
function createSearchableDropdown(
  options: DropdownOption[],
  placeholder: string,
  initialValue: string,
  onChange?: (value: string) => void,
  disabled?: boolean,
  ariaLabel?: string
) {
  let currentValue = initialValue;
  let currentOptions = [...options];
  let isOpen = false;

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

  // Create trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dropdown-trigger';
  trigger.disabled = !!disabled;
  if (ariaLabel) {
    trigger.setAttribute('aria-label', ariaLabel);
  }

  const selectedLabel = document.createElement('span');
  selectedLabel.className = 'dropdown-selected-label';
  selectedLabel.textContent = getSelectedLabel() || placeholder;
  trigger.appendChild(selectedLabel);

  const arrow = document.createElement('span');
  arrow.className = 'dropdown-arrow';
  arrow.innerHTML = '▼';
  trigger.appendChild(arrow);

  // Create dropdown panel
  const panel = document.createElement('div');
  panel.className = 'dropdown-panel';
  panel.style.display = 'none';

  // Create search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'dropdown-search';
  searchInput.placeholder = 'Search...';
  panel.appendChild(searchInput);

  // Create options list
  const optionsList = document.createElement('div');
  optionsList.className = 'dropdown-options';
  panel.appendChild(optionsList);

  // Render options
  renderOptions();

  // Toggle dropdown
  trigger.addEventListener('click', () => {
    if (disabled) return;
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'block' : 'none';
    wrapper.classList.toggle('dropdown-open', isOpen);
    if (isOpen) {
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
    if (!wrapper.contains(e.target as Node) && isOpen) {
      isOpen = false;
      panel.style.display = 'none';
      wrapper.classList.remove('dropdown-open');
    }
  });

  wrapper.appendChild(hiddenSelect);
  wrapper.appendChild(trigger);
  wrapper.appendChild(panel);

  function getSelectedLabel(): string {
    const selected = options.find((opt) => opt.value === currentValue);
    return selected?.label || '';
  }

  function renderOptions(optionsToRender = currentOptions) {
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

      optionEl.addEventListener('click', () => {
        if (opt.disabled) return;
        currentValue = opt.value;
        hiddenSelect.value = opt.value;
        selectedLabel.textContent = opt.label;
        isOpen = false;
        panel.style.display = 'none';
        wrapper.classList.remove('dropdown-open');

        if (onChange) {
          onChange(opt.value);
        }
      });

      optionsList.appendChild(optionEl);
    });
  }

  return {
    element: wrapper,
    hiddenSelect,
    getValue: () => currentValue,
    setValue: (value: string) => {
      currentValue = value;
      hiddenSelect.value = value;
      selectedLabel.textContent = getSelectedLabel() || placeholder;
    },
    setOptions: (newOptions: DropdownOption[]) => {
      currentOptions = [...newOptions];
      renderOptions();
    },
    setDisabled: (isDisabled: boolean) => {
      trigger.disabled = isDisabled;
      if (isDisabled) {
        wrapper.classList.add('dropdown-disabled');
        if (isOpen) {
          isOpen = false;
          panel.style.display = 'none';
          wrapper.classList.remove('dropdown-open');
        }
      } else {
        wrapper.classList.remove('dropdown-disabled');
      }
    },
  };
}

/**
 * Inject dropdown styles into the document
 */
export function injectDropdownStyles(): void {
  if (document.getElementById('dropdown-styles')) return;

  const style = document.createElement('style');
  style.id = 'dropdown-styles';
  style.textContent = `
    /* Dropdown Container */
    .dropdown-container {
      position: relative;
      width: 100%;
    }

    /* Native Select */
    .dropdown-select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 1rem;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .dropdown-select:hover {
      border-color: #999;
    }

    .dropdown-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .dropdown-select:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Searchable Dropdown */
    .dropdown-searchable {
      position: relative;
      width: 100%;
    }

    .dropdown-trigger {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      text-align: left;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: border-color 0.2s;
    }

    .dropdown-trigger:hover {
      border-color: #999;
    }

    .dropdown-trigger:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .dropdown-trigger:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .dropdown-selected-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-arrow {
      margin-left: 0.5rem;
      font-size: 0.75rem;
      transition: transform 0.2s;
    }

    .dropdown-open .dropdown-arrow {
      transform: rotate(180deg);
    }

    .dropdown-panel {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 300px;
      overflow: hidden;
    }

    .dropdown-search {
      width: 100%;
      padding: 0.5rem;
      border: none;
      border-bottom: 1px solid #ddd;
      font-size: 0.875rem;
    }

    .dropdown-search:focus {
      outline: none;
      border-bottom-color: #007bff;
    }

    .dropdown-options {
      max-height: 250px;
      overflow-y: auto;
    }

    .dropdown-option {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: none;
      background: white;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
      display: block;
    }

    .dropdown-option:hover {
      background: #f5f5f5;
    }

    .dropdown-option-selected {
      background: #e7f3ff;
      font-weight: 500;
    }

    .dropdown-option:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .dropdown-no-results {
      padding: 1rem;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
    }

    .dropdown-disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  `;

  document.head.appendChild(style);
}
