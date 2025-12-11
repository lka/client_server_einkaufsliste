/**
 * Dropdown types.
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

export interface SearchableDropdownState {
  currentValue: string;
  currentOptions: DropdownOption[];
  isOpen: boolean;
}
