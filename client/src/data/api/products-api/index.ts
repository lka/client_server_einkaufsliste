/**
 * Products API Module - Public API
 */

export { getProductSuggestions } from './search-operations.js';
export { fetchStoreProducts, fetchDepartmentProducts } from './fetch-operations.js';
export { createProduct, updateProduct, deleteProduct } from './crud-operations.js';
