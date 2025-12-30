/**
 * WebDAV settings API operations.
 *
 * @deprecated This file has been refactored into a modular structure.
 * Please use './webdav-api/index.js' instead, or import specific modules:
 * - './webdav-api/crud.js' for CRUD operations
 * - './webdav-api/import.js' for recipe import operations
 *
 * This file is kept for backward compatibility and re-exports all functions.
 */

// Re-export all public API from the modular structure
export {
  fetchWebDAVSettings,
  createWebDAVSettings,
  updateWebDAVSettings,
  deleteWebDAVSettings,
  importRecipesFromWebDAV,
  type ImportProgressCallback,
  type ImportResult,
} from './webdav-api/index.js';
