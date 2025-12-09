import {
    parseDate,
    formatDate } from "./date-utils.js";

import { CalendarState } from "./datepicker-types.js";
import { createCalendar } from "./create-calendar.js";

export interface DatePickerOptions {
  value?: Date | string;
  placeholder?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  disabled?: boolean;
  format?: 'dd.MM.yyyy' | 'yyyy-MM-dd' | 'MM/dd/yyyy';
  onChange?: (date: Date | null) => void;
  className?: string;
  label?: string;
  required?: boolean;
  highlightDates?: Date[]; // Shopping dates from items to highlight
}
export interface DatePickerInstance {
  container: HTMLDivElement;
  input: HTMLInputElement;
  getValue: () => Date | null;
  setValue: (date: Date | string | null) => void;
  setDisabled: (disabled: boolean) => void;
  setHighlightDates: (dates: Date[]) => void;
  destroy: () => void;
}

/**
 * Create a DatePicker component
 */
export function createDatePicker(options: DatePickerOptions = {}): DatePickerInstance {
  const {
    value,
    placeholder = 'DD.MM.YYYY',
    minDate,
    maxDate,
    disabled = false,
    format = 'dd.MM.yyyy',
    onChange,
    className = '',
    label,
    required = false
  } = options;

  // Container
  const container = document.createElement('div');
  container.className = `datepicker-container ${className}`.trim();

  // Label
  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'datepicker-label';
    labelEl.textContent = label;
    if (required) {
      const requiredSpan = document.createElement('span');
      requiredSpan.className = 'datepicker-required';
      requiredSpan.textContent = ' *';
      requiredSpan.setAttribute('aria-label', 'erforderlich');
      labelEl.appendChild(requiredSpan);
    }
    container.appendChild(labelEl);
  }

  // Input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'datepicker-input-wrapper';

  // Input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'datepicker-input';
  input.placeholder = placeholder;
  input.readOnly = true;
  input.disabled = disabled;
  if (required) {
    input.setAttribute('required', '');
  }

  // Calendar icon
  const icon = document.createElement('span');
  icon.className = 'datepicker-icon';
  icon.innerHTML = '📅';
  icon.setAttribute('aria-hidden', 'true');

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(icon);
  container.appendChild(inputWrapper);

  // State
  const state: CalendarState = {
    currentMonth: new Date(),
    selectedDate: parseDate(value),
    minDate: parseDate(minDate),
    maxDate: parseDate(maxDate),
    highlightDates: options.highlightDates || []
  };

  // Update input value
  if (state.selectedDate) {
    input.value = formatDate(state.selectedDate, format);
  }

  let calendar: HTMLDivElement | null = null;
  let isOpen = false;

  // Open calendar
  const openCalendar = () => {
    if (disabled || isOpen) return;

    // Set current month to selected date or today
    state.currentMonth = state.selectedDate ? new Date(state.selectedDate) : new Date();
    state.currentMonth.setDate(1);

    calendar = createCalendar(state, (date: Date | null) => {
      state.selectedDate = date;
      input.value = formatDate(date, format);

      if (onChange) {
        onChange(date);
      }

      closeCalendar();
    });

    container.appendChild(calendar);
    isOpen = true;

    // Position calendar
    const rect = inputWrapper.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 350 && spaceAbove > spaceBelow) {
      calendar.style.bottom = '100%';
      calendar.style.marginBottom = '4px';
    }
  };

  // Close calendar
  const closeCalendar = () => {
    if (calendar) {
      calendar.remove();
      calendar = null;
      isOpen = false;
    }
  };

  // Event listeners
  input.addEventListener('click', openCalendar);
  icon.addEventListener('click', openCalendar);

  // Close on click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (isOpen && calendar && !container.contains(e.target as Node)) {
      closeCalendar();
    }
  };
  document.addEventListener('click', handleClickOutside);

  // Close on Escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      closeCalendar();
      input.focus();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // API
  return {
    container,
    input,
    getValue: () => state.selectedDate,
    setValue: (date: Date | string | null) => {
      state.selectedDate = parseDate(date);
      input.value = formatDate(state.selectedDate, format);
    },
    setDisabled: (isDisabled: boolean) => {
      input.disabled = isDisabled;
      if (isDisabled) {
        closeCalendar();
      }
    },
    setHighlightDates: (dates: Date[]) => {
      state.highlightDates = dates;
      // If calendar is currently open, refresh it to show new highlights
      if (isOpen && calendar) {
        closeCalendar();
        openCalendar();
      }
    },
    destroy: () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      closeCalendar();
    }
  };
}