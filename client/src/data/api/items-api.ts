/**
 * Shopping list items API operations.
 *
 * @deprecated This file has been refactored into a modular structure.
 * Please use './items-api/index.js' instead, or import specific modules:
 * - './items-api/fetch-operations.js' for fetching items
 * - './items-api/create-delete-operations.js' for add/delete operations
 * - './items-api/convert-operations.js' for converting items to products
 *
 * This file is kept for backward compatibility and re-exports all functionality.
 */

export {
  fetchItems,
  fetchItemsByDate,
  addItem,
  deleteItem,
  deleteItemsBeforeDate,
  convertItemToProduct
} from './items-api/index.js';
