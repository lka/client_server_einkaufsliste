/**
 * Unicode fraction conversion utilities
 */

import { FRACTIONS_MAP } from './constants.js';

/**
 * Convert Unicode fraction string to decimal
 * Handles simple fractions (½), mixed numbers (1½), and negative values (-1½)
 */
export function convertFractionToDecimal(fractionStr: string): number | null {
  if (!fractionStr) return null;

  // Try to match pattern like "1½" (number + fraction)
  const mixedMatch = fractionStr.match(/^(-?\d+)([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞])$/);
  if (mixedMatch) {
    const wholePart = parseInt(mixedMatch[1], 10);
    const fractionChar = mixedMatch[2];
    if (fractionChar in FRACTIONS_MAP) {
      const fractionValue = FRACTIONS_MAP[fractionChar];
      return wholePart >= 0
        ? Math.abs(wholePart) + fractionValue
        : -(Math.abs(wholePart) + fractionValue);
    }
    return null;
  }

  // Try to match just fraction (no whole number)
  if (fractionStr in FRACTIONS_MAP) {
    return FRACTIONS_MAP[fractionStr];
  }

  return null;
}

/**
 * Apply sign to value based on minus sign string
 */
export function applySign(value: number, minusSign: string): number {
  return minusSign === '-' ? -value : value;
}
