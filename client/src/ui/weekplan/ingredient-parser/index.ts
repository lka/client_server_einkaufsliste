/**
 * Ingredient parsing utilities - Public API
 *
 * This module provides utilities for parsing ingredient lines with quantities,
 * adjusting quantities by a scaling factor, and parsing numeric quantities.
 */

export { parseIngredients, adjustQuantityByFactor } from './ingredient-parser.js';
export { parseQuantity } from './quantity-parser.js';
