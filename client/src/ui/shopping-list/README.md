# Shopping List UI Module

This directory contains the refactored shopping list UI code, organized into smaller, more maintainable modules.

## Module Overview

### [index.ts](index.ts)
Central export point for all shopping list modules. Import shopping list functionality from here.

### [print-preview.ts](print-preview.ts)
**Responsibility:** Print preview dialog and rendering logic
- Generates A4 landscape print preview with A5 folding layout
- Handles both single-store and multi-store print views
- Supports date filtering and department grouping
- Manages print preview dialog UI

**Key Functions:**
- `showPrintPreview()` - Main entry point for print preview dialog

### [dialogs.ts](dialogs.ts)
**Responsibility:** Modal dialogs for user interactions
- Department selection dialog
- Delete items by date dialog
- Item editing functionality

**Key Functions:**
- `showDepartmentSelectionDialog()` - Shows department picker for product assignment
- `showDeleteByDateDialog()` - Shows date picker for bulk deletion
- `handleEditItem()` - Handles the edit item workflow

### [filters.ts](filters.ts)
**Responsibility:** Item filtering and date utilities
- Filter items by store and shopping date
- Extract and manage shopping dates
- Date calculations and conversions

**Key Functions:**
- `filterItems()` - Filters items based on store and date criteria
- `extractShoppingDates()` - Extracts unique shopping dates from items
- `dateToISOString()` - Converts Date objects to ISO format
- `calculateNextShoppingDay()` - Calculates next shopping day based on configuration

### [store-manager.ts](store-manager.ts)
**Responsibility:** Store selection and autocomplete management
- Manages selected store state
- Loads and populates store filter dropdown
- Handles product autocomplete initialization
- Manages store change events

**Key Classes:**
- `StoreManager` - Main class for store-related operations

### [item-operations.ts](item-operations.ts)
**Responsibility:** Item CRUD operations
- Adding items to the shopping list
- Template expansion (adds all items from a template)
- Item deletion

**Key Functions:**
- `addItemOrTemplate()` - Adds item or expands template
- `deleteItem()` - Deletes an item from the list

## Architecture

The refactoring follows these principles:

1. **Single Responsibility:** Each module has a clear, focused purpose
2. **Separation of Concerns:** UI logic separated from business logic
3. **Reusability:** Modules can be imported and used independently
4. **Testability:** Smaller modules are easier to test
5. **Maintainability:** Reduced complexity makes code easier to understand and modify

## Complexity Reduction

**Before Refactoring:**
- File: `shopping-list-ui.ts`
- Lines: 1395
- Functions: 65
- Complexity: 138
- McCabe Complexity: 199 (Very High Risk)

**After Refactoring:**
- Main file: `shopping-list-ui.ts` - ~320 lines
- Supporting modules: ~1200 lines total (across 5 files)
- Each module has focused responsibility
- Improved readability and maintainability

## Usage Example

```typescript
import {
  showPrintPreview,
  showDeleteByDateDialog,
  handleEditItem,
  filterItems,
  StoreManager,
  addItemOrTemplate
} from './shopping-list/index.js';

// Initialize store manager
const storeManager = new StoreManager();
await storeManager.loadStoreFilter(storeFilterElement, onFilterChange);

// Filter items
const filtered = filterItems(allItems, {
  storeId: storeManager.getSelectedStoreId(),
  shoppingDate: '2025-12-25'
});

// Show print preview
await showPrintPreview({
  items: allItems,
  selectedStoreId: storeManager.getSelectedStoreId(),
  shoppingDatePicker: datePickerInstance
});
```

## Migration Notes

The main [shopping-list-ui.ts](../shopping-list-ui.ts) file now acts as a coordinator that:
1. Imports functionality from the modular components
2. Initializes and wires up the UI components
3. Manages the overall shopping list UI lifecycle

All existing exports and public API remain unchanged, ensuring backward compatibility.
