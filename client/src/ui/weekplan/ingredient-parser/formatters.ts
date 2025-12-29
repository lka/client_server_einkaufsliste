/**
 * Formatting utilities for quantities
 */

/**
 * Format a numeric value for display
 * Removes trailing zeros and uses comma as decimal separator
 */
export function formatValue(value: number): string {
  return value % 1 === 0
    ? value.toString()
    : value.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

/**
 * Format value with optional unit
 */
export function formatValueWithUnit(value: number, unit: string): string {
  const formattedValue = formatValue(value);
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * Remove "ca. " prefix from string (case-insensitive)
 */
export function removeApproximationPrefix(text: string): string {
  const trimmed = text.trim();
  return trimmed.toLowerCase().startsWith('ca. ')
    ? trimmed.substring(4).trim()
    : trimmed;
}
