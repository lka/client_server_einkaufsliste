/**
 * Products API operations.
 *
 * @deprecated This file has been refactored into a modular structure.
 * Please use './products-api/index.js' instead, or import specific modules:
 * - './products-api/search-operations.js' for product suggestions
 * - './products-api/fetch-operations.js' for fetching products
 * - './products-api/crud-operations.js' for create/update/delete
 *
 * This file is kept for backward compatibility and re-exports all functionality.
 */

export { getProductSuggestions } from './products-api/search-operations.js';
export { fetchStoreProducts, fetchDepartmentProducts } from './products-api/fetch-operations.js';
export { createProduct, updateProduct, deleteProduct } from './products-api/crud-operations.js';
