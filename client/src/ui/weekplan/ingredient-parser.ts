/**
 * Ingredient parsing utilities for recipes and templates
 */

import { fetchKnownUnits } from '../../data/api.js';
import type { ParsedIngredient } from './types.js';

/**
 * Map of Unicode fraction characters to decimal values
 */
const FRACTIONS_MAP: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 0.333,
  '⅔': 0.667,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 0.167,
  '⅚': 0.833,
  '⅐': 0.143,
  '⅑': 0.111,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

/**
 * Convert Unicode fraction string to decimal
 * Handles simple fractions (½), mixed numbers (1½), and negative values (-1½)
 */
function convertFractionToDecimal(fractionStr: string): number | null {
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
 * Parse ingredient lines into structured data using known units from server
 * Supports Unicode fractions (½, ¼, ¾, etc.) and mixed numbers (1½, 2¼, etc.)
 */
export async function parseIngredients(ingredientLines: string[]): Promise<ParsedIngredient[]> {
  // Fetch known units from server
  const knownUnits = await fetchKnownUnits();
  const unitsPattern = knownUnits.join('|');

  return ingredientLines.map((line: string) => {
    // Match: number OR fraction + optional unit + rest
    // Pattern matches either:
    // - optional digit(s) + fraction character (e.g., "½", "1½", "2¼")
    // - regular number with optional decimal/comma (e.g., "500", "2.5", "1,5")
    const match = line.match(
      new RegExp(
        `^((?:\\d*[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞]|[\\d\\/\\.,]+)(?:\\s*(?:${unitsPattern}))?)\\s+(.+)$`
      )
    );
    if (match) {
      return {
        quantity: match[1].trim(),
        name: match[2].trim(),
        originalLine: line
      };
    } else {
      return {
        quantity: null,
        name: line.trim(),
        originalLine: line
      };
    }
  });
}

/**
 * Adjust a quantity string by a scaling factor
 * Supports Unicode fractions (½, ¼, ¾, etc.) and mixed numbers (1½, 2¼, etc.)
 * Also removes "ca. " prefix before processing
 * @param originalMenge Original quantity string (e.g., "2 kg", "½ TL", "1½ kg", "ca. 150 g")
 * @param factor Scaling factor (e.g., 2 for doubling, 0.5 for halving)
 * @returns Adjusted quantity string
 */
export function adjustQuantityByFactor(originalMenge: string, factor: number): string {
  if (isNaN(factor) || factor <= 0) return originalMenge;

  // Remove "ca. " prefix (case-insensitive)
  let menge = originalMenge.trim();
  if (menge.toLowerCase().startsWith('ca. ')) {
    menge = menge.substring(4).trim();
  }

  // Extract numeric value and unit from menge
  // First try to match fractions (e.g., "½ TL", "1½ kg")
  const fractionMatch = menge.match(
    /^(-?)(\d*)([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞])\s*(.*)$/
  );
  if (fractionMatch) {
    const minusSign = fractionMatch[1];
    const wholePart = fractionMatch[2];
    const fractionChar = fractionMatch[3];
    const unit = fractionMatch[4].trim();

    const fractionStr = (wholePart || '') + fractionChar;
    let value = convertFractionToDecimal(fractionStr);
    if (value === null) return menge;

    if (minusSign === '-') {
      value = -value;
    }

    // Apply factor
    value = value * factor;

    // Format the result
    const formattedValue =
      value % 1 === 0
        ? value.toString()
        : value.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }

  // Fall back to regular number parsing
  const mengeMatch = menge.match(/^([\d]+(?:[.,\/]\d+)?)\s*(.*)$/);
  if (!mengeMatch) return menge;

  let value = parseFloat(mengeMatch[1].replace(',', '.'));
  const unit = mengeMatch[2].trim();

  // Apply factor
  value = value * factor;

  // Format the result
  const formattedValue =
    value % 1 === 0
      ? value.toString()
      : value.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * Parse a numeric quantity from a string
 * Handles Unicode fractions (½, ¼, ¾, 1½), slash fractions (1/2),
 * and decimals with comma or dot
 */
export function parseQuantity(quantityStr: string): number | null {
  if (!quantityStr) return null;

  // First try Unicode fractions (e.g., "½", "1½", "2¼")
  const fractionMatch = quantityStr.match(
    /^(-?)(\d*)([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞])$/
  );
  if (fractionMatch) {
    const minusSign = fractionMatch[1];
    const wholePart = fractionMatch[2];
    const fractionChar = fractionMatch[3];
    const fractionStr = (wholePart || '') + fractionChar;
    let value = convertFractionToDecimal(fractionStr);
    if (value !== null && minusSign === '-') {
      value = -value;
    }
    return value;
  }

  // Handle slash fractions like "1/2"
  if (quantityStr.includes('/')) {
    const parts = quantityStr.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
  }

  // Handle decimals with comma or dot
  const normalized = quantityStr.replace(',', '.');
  const value = parseFloat(normalized);
  return isNaN(value) ? null : value;
}
