/**
 * WebDAV API - Public API.
 *
 * This module provides the complete API for WebDAV settings and recipe import operations.
 * Operations are split into separate modules for better maintainability:
 * - crud.ts: WebDAV settings CRUD operations
 * - import.ts: Recipe import with Server-Sent Events support
 */

// CRUD operations
export {
  fetchWebDAVSettings,
  createWebDAVSettings,
  updateWebDAVSettings,
  deleteWebDAVSettings,
} from './crud.js';

// Import operations
export {
  importRecipesFromWebDAV,
  type ImportProgressCallback,
  type ImportResult,
} from './import.js';
