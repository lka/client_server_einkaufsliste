/**
 * API client for shopping list operations.
 *
 * This file now re-exports from the modular api/ directory.
 * All API functionality has been split into focused modules for better maintainability.
 *
 * For new code, consider importing directly from specific modules:
 * - import { fetchItems } from './api/items-api.js';
 * - import { fetchStores } from './api/stores-api.js';
 * - import type { Item, Store } from './api/types.js';
 *
 * This maintains backward compatibility for existing imports.
 */

export * from './api/index.js';
