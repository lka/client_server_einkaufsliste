/**
 * Shopping templates API operations.
 *
 * @deprecated This file has been refactored into a modular structure.
 * Please use './templates-api/index.js' instead, or import specific modules:
 * - './templates-api/fetch-operations.js' for fetching templates
 * - './templates-api/crud-operations.js' for create/update/delete
 *
 * This file is kept for backward compatibility and re-exports all functionality.
 */

export { fetchTemplates, fetchTemplate } from './templates-api/fetch-operations.js';
export { createTemplate, updateTemplate, deleteTemplate } from './templates-api/crud-operations.js';
