/**
 * Main ingredient parsing functions
 */

import { fetchKnownUnits } from '../../../data/api.js';
import type { ParsedIngredient } from '../types.js';
import { parseUnicodeFraction, parseTextFraction, parseDecimalNumber } from './parsers.js';
import { formatValueWithUnit, removeApproximationPrefix } from './formatters.js';

/**
 * Parse ingredient lines into structured data using known units from server
 * Supports Unicode fractions (½, ¼, ¾, etc.), mixed numbers (1½, 2¼, etc.),
 * and text-based fractions (1/2, 2 1/2, etc.)
 */
export async function parseIngredients(ingredientLines: string[]): Promise<ParsedIngredient[]> {
  // Fetch known units from server
  const knownUnits = await fetchKnownUnits();
  const unitsPattern = knownUnits.join('|');

  return ingredientLines.map((line: string) => {
    // Match: number OR fraction + optional unit + rest
    // Pattern matches either:
    // - Unicode fractions: \d*[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞] (e.g., "½", "1½", "2¼")
    // - Text-based fractions: \d+\s*\d+/\d+ or \d+/\d+ (e.g., "1/2", "2 1/2", "3/4")
    // - Regular numbers: [\d\.,]+ (e.g., "500", "2.5", "1,5")
    const match = line.match(
      new RegExp(
        `^((?:\\d*[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞]|\\d+\\s*\\d+/\\d+|\\d+/\\d+|[\\d\\.,]+)(?:\\s*(?:${unitsPattern}))?)\\s+(.+)$`
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

  // Remove "ca. " prefix
  const menge = removeApproximationPrefix(originalMenge);

  // Try parsing as Unicode fraction
  const unicodeFraction = parseUnicodeFraction(menge);
  if (unicodeFraction) {
    const adjustedValue = unicodeFraction.value * factor;
    return formatValueWithUnit(adjustedValue, unicodeFraction.unit);
  }

  // Try parsing as text-based fraction
  const textFraction = parseTextFraction(menge);
  if (textFraction) {
    const adjustedValue = textFraction.value * factor;
    return formatValueWithUnit(adjustedValue, textFraction.unit);
  }

  // Fall back to regular decimal number
  const decimal = parseDecimalNumber(menge);
  if (!decimal) return menge;

  const adjustedValue = decimal.value * factor;
  return formatValueWithUnit(adjustedValue, decimal.unit);
}
