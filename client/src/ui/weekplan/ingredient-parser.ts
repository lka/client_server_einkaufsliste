/**
 * Ingredient parsing utilities for recipes and templates
 */

import { fetchKnownUnits } from '../../data/api.js';
import type { ParsedIngredient } from './types.js';

/**
 * Parse ingredient lines into structured data using known units from server
 */
export async function parseIngredients(ingredientLines: string[]): Promise<ParsedIngredient[]> {
  // Fetch known units from server
  const knownUnits = await fetchKnownUnits();
  const unitsPattern = knownUnits.join('|');

  return ingredientLines.map((line: string) => {
    // Match: number (with optional fraction/decimal) + optional unit + rest
    const match = line.match(new RegExp(`^([\\d\\/\\.,]+(?:\\s*(?:${unitsPattern}))?)\\s+(.+)$`));
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
 * @param originalMenge Original quantity string (e.g., "2 kg", "500g", "3")
 * @param factor Scaling factor (e.g., 2 for doubling, 0.5 for halving)
 * @returns Adjusted quantity string
 */
export function adjustQuantityByFactor(originalMenge: string, factor: number): string {
  if (isNaN(factor) || factor <= 0) return originalMenge;

  // Extract numeric value and unit from menge (e.g., "2 kg" -> 2 and "kg")
  const mengeMatch = originalMenge.match(/^([\d]+(?:[.,\/]\d+)?)\s*(.*)$/);
  if (!mengeMatch) return originalMenge;

  let value = parseFloat(mengeMatch[1].replace(',', '.'));
  const unit = mengeMatch[2].trim();

  // Apply factor
  value = value * factor;

  // Format the result
  const formattedValue = value % 1 === 0 ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '');
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * Parse a numeric quantity from a string
 * Handles fractions, decimals with comma or dot
 */
export function parseQuantity(quantityStr: string): number | null {
  if (!quantityStr) return null;

  // Handle fractions like "1/2"
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
