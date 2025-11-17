/**
 * DatePicker Component
 *
 * A customizable date picker component with calendar view and keyboard support.
 */

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

interface CalendarState {
  currentMonth: Date;
  selectedDate: Date | null;
  minDate: Date | null;
  maxDate: Date | null;
  highlightDates: Date[];
}

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const WEEKDAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/**
 * Parse a date string or Date object to Date
 */
function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date according to the specified format
 */
function formatDate(date: Date | null, format: string): string {
  if (!date) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'dd.MM.yyyy':
      return `${day}.${month}.${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    default:
      return `${day}.${month}.${year}`;
  }
}

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false;
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

/**
 * Check if a date is within min/max bounds
 */
function isDateInRange(date: Date, minDate: Date | null, maxDate: Date | null): boolean {
  if (minDate && date < minDate) return false;
  if (maxDate && date > maxDate) return false;
  return true;
}

/**
 * Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
 */
function getFirstDayOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  // Convert Sunday (0) to 7 for Monday-based week
  return firstDay === 0 ? 6 : firstDay - 1;
}

/**
 * Get the number of days in a month
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Create calendar grid for the current month
 */
function createCalendarGrid(state: CalendarState): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'datepicker-grid';

  // Weekday headers
  WEEKDAYS_DE.forEach(day => {
    const header = document.createElement('div');
    header.className = 'datepicker-weekday';
    header.textContent = day;
    grid.appendChild(header);
  });

  const firstDay = getFirstDayOfMonth(state.currentMonth);
  const daysInMonth = getDaysInMonth(state.currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Prepare shopping dates - sort future dates ascending, past dates descending
  const futureDates: Date[] = [];
  const pastDates: Date[] = [];

  state.highlightDates.forEach(d => {
    const highlightDate = new Date(d);
    highlightDate.setHours(0, 0, 0, 0);

    if (highlightDate >= today) {
      futureDates.push(highlightDate);
    } else {
      pastDates.push(highlightDate);
    }
  });

  futureDates.sort((a, b) => a.getTime() - b.getTime());
  pastDates.sort((a, b) => b.getTime() - a.getTime()); // Descending for past

  // Additional colors for future shopping dates beyond the second
  const additionalColors = [
    '#a78bfa', // purple
    '#fb923c', // orange
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f59e0b', // amber
    '#8b5cf6', // violet
  ];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'datepicker-day datepicker-day-empty';
    grid.appendChild(emptyCell);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), day);
    const dayCell = document.createElement('button');
    dayCell.type = 'button';
    dayCell.className = 'datepicker-day';
    dayCell.textContent = String(day);
    dayCell.dataset.date = date.toISOString();

    // Check if this date is a shopping date
    const futureIndex = futureDates.findIndex(d => isSameDay(d, date));
    const pastIndex = pastDates.findIndex(d => isSameDay(d, date));

    if (futureIndex !== -1) {
      // Future shopping date
      if (futureIndex === 0) {
        // Next shopping day - yellow
        dayCell.classList.add('datepicker-day-shopping-next');
      } else if (futureIndex === 1) {
        // Second next shopping day - green
        dayCell.classList.add('datepicker-day-shopping-second');
      } else {
        // Additional future shopping days - various colors
        const colorIndex = (futureIndex - 2) % additionalColors.length;
        dayCell.classList.add('datepicker-day-shopping-future');
        dayCell.style.backgroundColor = additionalColors[colorIndex];
        dayCell.style.color = '#ffffff';
        dayCell.style.fontWeight = '600';
      }
    } else if (pastIndex !== -1) {
      // Past shopping date - grayscale
      dayCell.classList.add('datepicker-day-shopping-past');
    }

    // Add modifiers
    if (isSameDay(date, today)) {
      dayCell.classList.add('datepicker-day-today');
    }

    if (isSameDay(date, state.selectedDate)) {
      dayCell.classList.add('datepicker-day-selected');
      dayCell.setAttribute('aria-selected', 'true');
    }

    if (!isDateInRange(date, state.minDate, state.maxDate)) {
      dayCell.classList.add('datepicker-day-disabled');
      dayCell.disabled = true;
    }

    grid.appendChild(dayCell);
  }

  return grid;
}

/**
 * Create the calendar dropdown
 */
function createCalendar(state: CalendarState, onSelect: (date: Date) => void): HTMLDivElement {
  const calendar = document.createElement('div');
  calendar.className = 'datepicker-calendar';
  calendar.setAttribute('role', 'dialog');
  calendar.setAttribute('aria-label', 'Datumsauswahl');

  // Header with month/year navigation
  const header = document.createElement('div');
  header.className = 'datepicker-header';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'datepicker-nav-btn';
  prevBtn.innerHTML = '‹';
  prevBtn.setAttribute('aria-label', 'Vorheriger Monat');
  prevBtn.onclick = () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    updateCalendar();
  };

  const monthYear = document.createElement('div');
  monthYear.className = 'datepicker-month-year';
  monthYear.textContent = `${MONTHS_DE[state.currentMonth.getMonth()]} ${state.currentMonth.getFullYear()}`;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'datepicker-nav-btn';
  nextBtn.innerHTML = '›';
  nextBtn.setAttribute('aria-label', 'Nächster Monat');
  nextBtn.onclick = () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    updateCalendar();
  };

  header.appendChild(prevBtn);
  header.appendChild(monthYear);
  header.appendChild(nextBtn);
  calendar.appendChild(header);

  // Grid container
  const gridContainer = document.createElement('div');
  gridContainer.className = 'datepicker-grid-container';
  calendar.appendChild(gridContainer);

  // Today button
  const footer = document.createElement('div');
  footer.className = 'datepicker-footer';

  const todayBtn = document.createElement('button');
  todayBtn.type = 'button';
  todayBtn.className = 'datepicker-today-btn';
  todayBtn.textContent = 'Heute';
  todayBtn.onclick = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isDateInRange(today, state.minDate, state.maxDate)) {
      onSelect(today);
    }
  };

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'datepicker-clear-btn';
  clearBtn.textContent = 'Löschen';
  clearBtn.onclick = () => {
    onSelect(null as any);
  };

  footer.appendChild(todayBtn);
  footer.appendChild(clearBtn);
  calendar.appendChild(footer);

  // Update function
  const updateCalendar = () => {
    monthYear.textContent = `${MONTHS_DE[state.currentMonth.getMonth()]} ${state.currentMonth.getFullYear()}`;
    const newGrid = createCalendarGrid(state);

    // Add click handlers to day cells
    newGrid.querySelectorAll('.datepicker-day:not(.datepicker-day-empty):not(.datepicker-day-disabled)').forEach(dayCell => {
      (dayCell as HTMLButtonElement).onclick = () => {
        const dateStr = (dayCell as HTMLElement).dataset.date;
        if (dateStr) {
          onSelect(new Date(dateStr));
        }
      };
    });

    gridContainer.innerHTML = '';
    gridContainer.appendChild(newGrid);
  };

  updateCalendar();

  return calendar;
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

/**
 * Inject DatePicker styles into the document
 */
export function injectDatePickerStyles(): void {
  // Check if styles already exist
  if (document.getElementById('datepicker-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'datepicker-styles';
  style.textContent = `
    /* DatePicker Container */
    .datepicker-container {
      position: relative;
      display: inline-block;
      width: 100%;
    }

    .datepicker-label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .datepicker-required {
      color: #dc2626;
    }

    /* Input Wrapper */
    .datepicker-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .datepicker-input {
      width: 100%;
      padding: 0.5rem 2.5rem 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 1rem;
      line-height: 1.5;
      color: #1f2937;
      background-color: #ffffff;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .datepicker-input:hover:not(:disabled) {
      border-color: #9ca3af;
    }

    .datepicker-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .datepicker-input:disabled {
      background-color: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }

    .datepicker-icon {
      position: absolute;
      right: 0.75rem;
      font-size: 1.25rem;
      pointer-events: none;
      color: #6b7280;
    }

    .datepicker-input:disabled + .datepicker-icon {
      color: #d1d5db;
    }

    /* Calendar Dropdown */
    .datepicker-calendar {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      z-index: 1000;
      padding: 1rem;
      min-width: 280px;
    }

    /* Header */
    .datepicker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .datepicker-nav-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      transition: background-color 0.15s, color 0.15s;
    }

    .datepicker-nav-btn:hover {
      background-color: #f3f4f6;
      color: #1f2937;
    }

    .datepicker-month-year {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.875rem;
    }

    /* Grid */
    .datepicker-grid-container {
      margin-bottom: 0.75rem;
    }

    .datepicker-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .datepicker-weekday {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      padding: 0.5rem 0;
    }

    .datepicker-day {
      aspect-ratio: 1;
      border: none;
      background: none;
      font-size: 0.875rem;
      color: #1f2937;
      cursor: pointer;
      border-radius: 0.25rem;
      transition: background-color 0.15s, color 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .datepicker-day:hover:not(.datepicker-day-disabled):not(.datepicker-day-empty) {
      background-color: #f3f4f6;
    }

    .datepicker-day-today {
      font-weight: 700 !important;
      color: #ffffff !important;
      background-color: #ef4444 !important;
      border: 2px solid #dc2626 !important;
      border-radius: 0.375rem !important;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3) !important;
    }

    .datepicker-day-today:hover:not(.datepicker-day-disabled) {
      background-color: #dc2626 !important;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4) !important;
    }

    .datepicker-day-selected {
      background-color: #3b82f6 !important;
      color: #ffffff !important;
      font-weight: 600;
      border: 2px solid #2563eb !important;
    }

    /* Wenn der heutige Tag ausgewählt ist, zeige beides */
    .datepicker-day-today.datepicker-day-selected {
      background: linear-gradient(135deg, #ef4444 0%, #3b82f6 100%) !important;
      border: 2px solid #dc2626 !important;
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4) !important;
    }

    .datepicker-day-disabled {
      color: #d1d5db;
      cursor: not-allowed;
    }

    .datepicker-day-empty {
      cursor: default;
    }

    /* Shopping Date Highlights */
    .datepicker-day-shopping-next {
      background-color: #fef08a !important; /* Yellow for next shopping day */
      color: #854d0e !important;
      font-weight: 600 !important;
      border: 2px solid #facc15 !important;
    }

    .datepicker-day-shopping-next:hover:not(.datepicker-day-disabled) {
      background-color: #fde047 !important;
    }

    .datepicker-day-shopping-second {
      background-color: #86efac !important; /* Green for second next shopping day */
      color: #14532d !important;
      font-weight: 600 !important;
      border: 2px solid #22c55e !important;
    }

    .datepicker-day-shopping-second:hover:not(.datepicker-day-disabled) {
      background-color: #4ade80 !important;
    }

    .datepicker-day-shopping-future {
      /* Additional future shopping days - inline styles with various colors */
      font-weight: 600 !important;
    }

    .datepicker-day-shopping-past {
      background-color: #e5e7eb !important; /* Grayscale for past shopping dates */
      color: #6b7280 !important;
      font-weight: 500 !important;
    }

    .datepicker-day-shopping-past:hover:not(.datepicker-day-disabled) {
      background-color: #d1d5db !important;
    }

    /* Footer */
    .datepicker-footer {
      display: flex;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
    }

    .datepicker-today-btn,
    .datepicker-clear-btn {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.15s, border-color 0.15s;
      background-color: #ffffff;
      color: #374151;
    }

    .datepicker-today-btn:hover {
      background-color: #f3f4f6;
      border-color: #9ca3af;
    }

    .datepicker-clear-btn {
      color: #dc2626;
      border-color: #fecaca;
    }

    .datepicker-clear-btn:hover {
      background-color: #fef2f2;
      border-color: #fca5a5;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .datepicker-calendar {
        left: 50%;
        transform: translateX(-50%);
      }
    }
  `;

  document.head.appendChild(style);
}
