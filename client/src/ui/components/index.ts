/**
 * Component Library - Central export point.
 *
 * This module exports all reusable UI components and provides
 * a single initialization function to inject all component styles.
 */

// Import inject functions for initializeComponents
import { injectButtonStyles } from './button.js';
import { injectModalStyles } from './modal.js';
import { injectCardStyles } from './card.js';
import { injectInputStyles } from './input.js';
import { injectLoadingStyles } from './loading.js';
import { injectDropdownStyles } from './dropdown.js';
import { injectTabsStyles } from './tabs.js';
import { injectToastStyles } from './toast.js';
import { injectDatePickerStyles } from './datepicker.js';
import { injectConnectionStatusStyles } from './connection-status.js';
import { injectAutocompleteStyles } from './autocomplete.js';

// Button
export {
  createButton,
  updateButton,
  type ButtonOptions,
  type ButtonVariant,
  type ButtonSize,
} from './button.js';
export { injectButtonStyles } from './button.js';

// Modal
export {
  Modal,
  type ModalOptions,
} from './modal.js';
export { injectModalStyles } from './modal.js';

// Card
export {
  createCard,
  updateCardContent,
  updateCardTitle,
  type CardOptions,
} from './card.js';
export { injectCardStyles } from './card.js';

// Input
export {
  createInput,
  setInputError,
  setInputValue,
  getInputValue,
  type InputOptions,
  type InputType,
  type InputGroup,
} from './input.js';
export { injectInputStyles } from './input.js';

// Loading
export {
  createSpinner,
  showLoadingOverlay,
  createSkeleton,
  type SpinnerOptions,
  type SpinnerSize,
  type SpinnerVariant,
} from './loading.js';
export { injectLoadingStyles } from './loading.js';

// Dropdown
export {
  createDropdown,
  type DropdownOptions,
  type DropdownOption,
  type DropdownInstance,
} from './dropdown.js';
export { injectDropdownStyles } from './dropdown.js';

// Tabs
export {
  Tabs,
  type TabsOptions,
  type TabItem,
} from './tabs.js';
export { injectTabsStyles } from './tabs.js';

// Toast
export {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  dismissToast,
  dismissAllToasts,
  type ToastOptions,
  type ToastType,
  type ToastPosition,
} from './toast.js';
export { injectToastStyles } from './toast.js';

// DatePicker
export {
  createDatePicker,
  type DatePickerOptions,
  type DatePickerInstance,
} from './datepicker.js';
export { injectDatePickerStyles } from './datepicker.js';

// ConnectionStatus
export {
  ConnectionStatus,
  type ConnectionStatusOptions,
} from './connection-status.js';
export { injectConnectionStatusStyles } from './connection-status.js';

// Autocomplete
export {
  Autocomplete,
  type AutocompleteSuggestion,
  type AutocompleteConfig,
} from './autocomplete.js';
export { injectAutocompleteStyles } from './autocomplete.js';

/**
 * Initialize all component styles.
 *
 * Call this once when the application starts to inject
 * all component CSS into the document head.
 *
 * This is idempotent - calling multiple times is safe.
 */
export function initializeComponents(): void {
  injectButtonStyles();
  injectModalStyles();
  injectCardStyles();
  injectInputStyles();
  injectLoadingStyles();
  injectDropdownStyles();
  injectTabsStyles();
  injectToastStyles();
  injectDatePickerStyles();
  injectConnectionStatusStyles();
  injectAutocompleteStyles();
}
