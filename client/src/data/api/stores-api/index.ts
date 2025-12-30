/**
 * Stores and Departments API - Public API.
 *
 * This module provides the complete API for store and department operations.
 * Operations are split into separate modules for better maintainability:
 * - stores.ts: Store CRUD operations
 * - departments.ts: Department CRUD operations
 */

// Store operations
export {
  fetchStores,
  createStore,
  updateStore,
  deleteStore,
} from './stores.js';

// Department operations
export {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './departments.js';
