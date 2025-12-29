/**
 * Quantity parsing utilities (numeric values only)
 */

import { parseUnicodeFractionValue, parseTextFractionValue } from './parsers.js';

/**
 * Parse a numeric quantity from a string
 * Handles Unicode fractions (½, ¼, ¾, 1½), slash fractions (1/2, 2 1/2),
 * and decimals with comma or dot
 */
export function parseQuantity(quantityStr: string): number | null {
  if (!quantityStr) return null;

  const trimmed = quantityStr.trim();

  // Try Unicode fractions (e.g., "½", "1½", "2¼")
  const unicodeValue = parseUnicodeFractionValue(trimmed);
  if (unicodeValue !== null) return unicodeValue;

  // Try text-based fractions (e.g., "2 1/2", "1/2")
  const textValue = parseTextFractionValue(trimmed);
  if (textValue !== null) return textValue;

  // Handle decimals with comma or dot
  const normalized = trimmed.replace(',', '.');
  const value = parseFloat(normalized);
  return isNaN(value) ? null : value;
}
