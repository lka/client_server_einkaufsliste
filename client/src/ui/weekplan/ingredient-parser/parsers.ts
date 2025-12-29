/**
 * Parsing functions for quantities (without units)
 */

import { convertFractionToDecimal, applySign } from './fraction-converter.js';

/**
 * Parse Unicode fraction from string without unit (e.g., "½", "1½", "2¼")
 * Used by parseQuantity for numeric-only parsing
 */
export function parseUnicodeFractionValue(text: string): number | null {
  const match = text.match(/^(-?)(\d*)([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞])$/);
  if (!match) return null;

  const minusSign = match[1];
  const wholePart = match[2];
  const fractionChar = match[3];

  const fractionStr = (wholePart || '') + fractionChar;
  const value = convertFractionToDecimal(fractionStr);

  return value !== null ? applySign(value, minusSign) : null;
}

/**
 * Parse text-based fraction from string without unit (e.g., "1/2", "2 1/2")
 * Used by parseQuantity for numeric-only parsing
 */
export function parseTextFractionValue(text: string): number | null {
  const match = text.match(/^(-?)(\d+)?\s*(\d+)\/(\d+)$/);
  if (!match) return null;

  const minusSign = match[1];
  const wholePartStr = match[2];
  const numeratorStr = match[3];
  const denominatorStr = match[4];

  const numerator = parseInt(numeratorStr, 10);
  const denominator = parseInt(denominatorStr, 10);

  if (denominator === 0) return null;

  const fractionValue = numerator / denominator;
  const wholePart = wholePartStr ? parseInt(wholePartStr, 10) : 0;
  const value = wholePart + fractionValue;

  return applySign(value, minusSign);
}

/**
 * Parse Unicode fraction from string with unit (e.g., "½ TL", "1½ kg", "2¼")
 * Returns the numeric value and remaining text (unit)
 */
export function parseUnicodeFraction(text: string): { value: number; unit: string } | null {
  const match = text.match(/^(-?)(\d*)([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞])\s*(.*)$/);
  if (!match) return null;

  const minusSign = match[1];
  const wholePart = match[2];
  const fractionChar = match[3];
  const unit = match[4].trim();

  const fractionStr = (wholePart || '') + fractionChar;
  const value = convertFractionToDecimal(fractionStr);

  return value !== null ? { value: applySign(value, minusSign), unit } : null;
}

/**
 * Parse text-based fraction from string with unit (e.g., "1/2 TL", "2 1/2 kg")
 * Returns the numeric value and remaining text (unit)
 */
export function parseTextFraction(text: string): { value: number; unit: string } | null {
  const match = text.match(/^(-?)(\d+)?\s*(\d+)\/(\d+)\s*(.*)$/);
  if (!match) return null;

  const minusSign = match[1];
  const wholePartStr = match[2];
  const numeratorStr = match[3];
  const denominatorStr = match[4];
  const unit = match[5].trim();

  const numerator = parseInt(numeratorStr, 10);
  const denominator = parseInt(denominatorStr, 10);

  if (denominator === 0) return null;

  const fractionValue = numerator / denominator;
  const wholePart = wholePartStr ? parseInt(wholePartStr, 10) : 0;
  const value = wholePart + fractionValue;

  return { value: applySign(value, minusSign), unit };
}

/**
 * Parse regular decimal number from string (e.g., "500", "2.5", "1,5")
 * Returns the numeric value and remaining text (unit)
 */
export function parseDecimalNumber(text: string): { value: number; unit: string } | null {
  const match = text.match(/^([\d]+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return null;

  const value = parseFloat(match[1].replace(',', '.'));
  const unit = match[2].trim();

  return { value, unit };
}
