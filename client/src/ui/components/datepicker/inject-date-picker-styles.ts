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
