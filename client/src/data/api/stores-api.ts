/**
 * Stores and departments API operations.
 *
 * @deprecated This file has been refactored into a modular structure.
 * Please use './stores-api/index.js' instead, or import specific modules:
 * - './stores-api/stores.js' for store operations
 * - './stores-api/departments.js' for department operations
 *
 * This file is kept for backward compatibility and re-exports all functions.
 */

export {
  fetchStores,
  createStore,
  updateStore,
  deleteStore,
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './stores-api/index.js';
