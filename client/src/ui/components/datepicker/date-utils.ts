export const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export const WEEKDAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/**
 * Parse a date string or Date object to Date
 */
export function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date according to the specified format
 */
export function formatDate(date: Date | null, format: string): string {
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
export function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false;
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

/**
 * Check if a date is within min/max bounds
 */
export function isDateInRange(date: Date, minDate: Date | null, maxDate: Date | null): boolean {
  if (minDate && date < minDate) return false;
  if (maxDate && date > maxDate) return false;
  return true;
}

/**
 * Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
 */
export function getFirstDayOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  // Convert Sunday (0) to 7 for Monday-based week
  return firstDay === 0 ? 6 : firstDay - 1;
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

