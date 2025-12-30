# UI Layer

📚 [Back to Main](../ARCHITECTURE.md) | [← State Layer](03-state-layer.md) | [Next: Pages & Entry Points →](05-pages.md)

## UI Layer (`src/ui/`)

**Purpose**: Feature-specific UI logic, event handlers, and reusable components.

**Modules**:

### Component Library (`src/ui/components/`)

**Purpose**: Reusable UI components for consistent styling and behavior across the application.

**Components**:

#### button.ts

- **Exports**:
  - `createButton(options: ButtonOptions)`: Create styled button with consistent behavior
  - `updateButton(button, updates)`: Update button state dynamically
  - `injectButtonStyles()`: Inject button CSS (call once at app start)
- **Features**:
  - Variants: primary (blue), secondary (gray), danger (red), success (green)
  - Sizes: small, medium, large
  - Loading state with animated spinner
  - Icon support
  - Async onClick with automatic disable/enable
  - XSS protection via HTML escaping
  - Custom className and aria-label support
- **Usage**:
  ```typescript
  import { createButton } from './ui/components/button.js';

  const btn = createButton({
    label: 'Save',
    variant: 'primary',
    onClick: async () => { await saveData(); }
  });
  ```

#### modal.ts

- **Exports**:
  - `Modal` class: Full-featured modal/dialog component
  - `injectModalStyles()`: Inject modal CSS
- **Features**:
  - Backdrop with configurable click-to-close
  - Keyboard support (Escape key)
  - Focus management
  - Body scroll prevention
  - Smooth animations (opacity + scale)
  - Sizes: small (400px), medium (600px), large (900px)
  - Dynamic content and title updates
- **Methods**: `open()`, `close()`, `setContent()`, `setTitle()`, `isModalOpen()`
- **Usage**:
  ```typescript
  import { Modal } from './ui/components/modal.js';

  const modal = new Modal({
    title: 'Confirm Action',
    content: 'Are you sure?',
    size: 'small',
    onClose: () => console.log('closed')
  });
  modal.open();
  ```

#### card.ts

- **Exports**:
  - `createCard(options)`: Create card container
  - `updateCardContent(card, content)`: Update card body
  - `updateCardTitle(card, title)`: Update card header
  - `injectCardStyles()`: Inject card CSS
- **Features**:
  - Optional header with title
  - Body content (string or HTMLElement)
  - Optional footer
  - Variants: default (border), elevated (shadow), outlined (blue border)
- **Usage**:
  ```typescript
  import { createCard } from './ui/components/card.js';

  const card = createCard({
    title: 'Product Details',
    content: 'Description here',
    variant: 'elevated'
  });
  ```

#### input.ts

- **Exports**:
  - `createInput(options)`: Create input with label
  - `setInputError(inputGroup, error)`: Set error state
  - `setInputValue(inputGroup, value)`: Set value
  - `getInputValue(inputGroup)`: Get value
  - `injectInputStyles()`: Inject input CSS
  - `InputGroup` interface: `{ container, input, errorEl? }`
- **Features**:
  - Input types: text, email, password, number, tel, url
  - Label with required indicator (red asterisk)
  - Error state styling and messages
  - Help text
  - onChange and onBlur callbacks
  - Returns InputGroup object for easy manipulation
- **Usage**:
  ```typescript
  import { createInput, setInputError } from './ui/components/input.js';

  const emailInput = createInput({
    label: 'Email',
    type: 'email',
    required: true,
    onChange: (value) => validateEmail(value)
  });

  if (invalid) {
    setInputError(emailInput, 'Invalid email address');
  }
  ```

#### loading.ts

- **Exports**:
  - `createSpinner(options?)`: Create loading spinner
  - `showLoadingOverlay(label?)`: Show full-page overlay (returns cleanup function)
  - `createSkeleton(options?)`: Create skeleton loader
  - `injectLoadingStyles()`: Inject loading CSS
- **Features**:
  - Spinner sizes: small, medium, large
  - Spinner variants: primary, secondary, light
  - Full-page overlay option
  - Skeleton variants: text, circular, rectangular
  - Accessibility (aria-live, sr-only text)
- **Usage**:
  ```typescript
  import { showLoadingOverlay } from './ui/components/loading.js';

  const removeOverlay = showLoadingOverlay('Saving...');
  await saveData();
  removeOverlay();
  ```

#### dropdown.ts ✨ REFACTORED

- **Status**: ✨ **REFACTORED** - Reduced from 490 lines to 61 lines (-88%)
- **Responsibility**: Dropdown component orchestrator
- **Modular Architecture** (`src/ui/components/dropdown/`):
  - **types.ts**: TypeScript interfaces (DropdownOption, DropdownOptions, DropdownInstance, SearchableDropdownState)
  - **native-dropdown.ts**: Native HTML select dropdown implementation
  - **searchable-dropdown.ts**: Searchable dropdown with custom UI
  - **ui-builder.ts**: UI element builders (trigger button, panel)
  - **option-renderer.ts**: Options list rendering logic
  - **styles.ts**: CSS style injection
- **Exports**:
  - `createDropdown(options)`: Create dropdown/select component
  - `injectDropdownStyles()`: Inject dropdown CSS
  - `DropdownInstance` interface: `{ container, select, getValue, setValue, setOptions, setDisabled }`
- **Features**:
  - Native select mode (simple dropdown)
  - Searchable mode (custom dropdown with filter)
  - Fuzzy search functionality
  - Click-outside-to-close
  - Disabled state support
  - Placeholder support
  - onChange callback
- **Usage**:
  ```typescript
  import { createDropdown } from './ui/components/dropdown.js';

  const dropdown = createDropdown({
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' }
    ],
    searchable: true,
    placeholder: 'Select an option',
    onChange: (value) => console.log('Selected:', value)
  });
  ```

#### autocomplete.ts ✨ REFACTORED

- **Status**: ✨ **REFACTORED** - Reduced from McCabe 49 (298 lines) to modular structure (59% reduction)
- **Lines**: 20 | **McCabe**: 0
- **Responsibility**: Barrel file that re-exports autocomplete functionality
- **Backward Compatibility**: Existing imports continue to work without changes
- **Modular Architecture** (`src/ui/components/autocomplete/`):
  - **types.ts**: TypeScript interfaces (AutocompleteSuggestion, AutocompleteConfig) - McCabe 0
  - **styles.ts**: CSS style injection with idempotent check - 64 lines, McCabe 3
  - **rendering.ts**: Pure rendering functions (showLoadingState, renderSuggestions, updateSelection, hideSuggestions) - 74 lines, McCabe 10
  - **autocomplete.ts**: Main Autocomplete class with keyboard navigation and debouncing - 196 lines, McCabe 20
  - **index.ts**: Public API barrel file - 19 lines, McCabe 1
- **Exports**:
  - `Autocomplete` class: Full-featured autocomplete component
  - `injectAutocompleteStyles()`: Inject autocomplete CSS
  - `AutocompleteSuggestion` interface: `{ id, label, data? }`
  - `AutocompleteConfig` interface: Configuration options
- **Features**:
  - Dynamic suggestions based on user input
  - Keyboard navigation (Arrow Up/Down, Enter, Escape)
  - Mouse/Touch selection
  - Debounced search for performance (configurable, default 300ms)
  - Customizable suggestion rendering
  - Configurable minimum characters (default 1)
  - Maximum suggestions limit (default 10)
  - Loading state with spinner
  - No results message
- **Usage**:
  ```typescript
  import { Autocomplete } from './ui/components/autocomplete.js';

  const autocomplete = new Autocomplete({
    input: document.querySelector('#search-input'),
    onSearch: async (query) => {
      const results = await fetchSuggestions(query);
      return results.map(r => ({ id: r.id, label: r.name, data: r }));
    },
    onSelect: (suggestion) => {
      console.log('Selected:', suggestion);
    },
    debounceMs: 300,
    minChars: 2,
    maxSuggestions: 10,
    placeholder: 'Search...'
  });

  // Clear autocomplete
  autocomplete.clear();

  // Clean up when done
  autocomplete.destroy();
  ```

**Migration Guide**:

```typescript
// Old (still works - backward compatible)
import { Autocomplete, injectAutocompleteStyles } from './ui/components/autocomplete.js';
import type { AutocompleteSuggestion, AutocompleteConfig } from './ui/components/autocomplete.js';

// New (preferred - using barrel file)
import { Autocomplete, injectAutocompleteStyles } from './ui/components/autocomplete/index.js';
import type { AutocompleteSuggestion, AutocompleteConfig } from './ui/components/autocomplete/index.js';

// New (specific module imports)
import { Autocomplete } from './ui/components/autocomplete/autocomplete.js';
import { injectAutocompleteStyles } from './ui/components/autocomplete/styles.js';
import type { AutocompleteSuggestion, AutocompleteConfig } from './ui/components/autocomplete/types.js';
```

**Benefits**:
- **Clear Separation**: Styles, types, rendering, and main class in separate files
- **Reduced Complexity**: From McCabe 49 to 20 max per module (59% reduction)
- **Better Maintainability**: Each file < 200 lines, single responsibility
- **Easier Testing**: Pure rendering functions can be tested independently
- **No Breaking Changes**: Full backward compatibility via re-exports

#### tabs.ts

- **Exports**:
  - `Tabs` class: Tab navigation component
  - `injectTabsStyles()`: Inject tabs CSS
- **Features**:
  - Tab switching with keyboard support
  - Fade-in animations on tab change
  - Disabled tab support
  - ARIA attributes for accessibility
  - Dynamic content updates
  - onChange callback
- **Methods**: `getElement()`, `getActiveTab()`, `setActiveTab()`, `setTabs()`, `updateTabContent()`, `setTabDisabled()`
- **Usage**:
  ```typescript
  import { Tabs } from './ui/components/tabs.js';

  const tabs = new Tabs({
    tabs: [
      { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
      { id: 'tab2', label: 'Tab 2', content: 'Content 2' }
    ],
    activeTab: 'tab1',
    onChange: (tabId) => console.log('Tab changed:', tabId)
  });
  document.body.appendChild(tabs.getElement());
  ```

#### toast.ts

- **Exports**:
  - `showSuccess(message, duration?)`: Show success toast
  - `showError(message, duration?)`: Show error toast
  - `showWarning(message, duration?)`: Show warning toast
  - `showInfo(message, duration?)`: Show info toast
  - `showToast(options)`: Show custom toast
  - `dismissToast(id)`: Dismiss specific toast
  - `dismissAllToasts()`: Dismiss all toasts
  - `injectToastStyles()`: Inject toast CSS
- **Features**:
  - 4 toast types: success, error, warning, info
  - 6 position options (top/bottom × left/center/right)
  - Auto-dismiss with configurable duration
  - Manual dismiss with X button
  - Toast stacking (multiple toasts)
  - Icons for each type (✓, ✕, ⚠, ℹ)
  - ARIA live regions for accessibility
  - Responsive mobile design
  - **Replaces all alert() calls** throughout the application
- **Usage**:
  ```typescript
  import { showSuccess, showError } from './ui/components/toast.js';

  // Simple usage
  showSuccess('Product saved successfully!');
  showError('Failed to delete item', 5000); // 5 second duration

  // Advanced usage
  import { showToast } from './ui/components/toast.js';

  const toastId = showToast({
    message: 'Custom notification',
    type: 'warning',
    duration: 4000,
    position: 'bottom-right',
    dismissible: true,
    onClose: () => console.log('Toast closed')
  });
  ```

#### datepicker.ts

- **Exports**:
  - `createDatePicker(options)`: Create date picker component
  - `injectDatePickerStyles()`: Inject date picker CSS
  - `DatePickerInstance` interface: `{ container, input, getValue, setValue, setDisabled, destroy }`
- **Features**:
  - Full calendar interface with month/year navigation
  - German localization (months and weekdays)
  - Date formats: dd.MM.yyyy, yyyy-MM-dd, MM/dd/yyyy
  - Min/max date restrictions
  - Today button for quick selection
  - Clear button to reset selection
  - Click-outside-to-close behavior
  - Escape key support
  - Highlighted current day (red background with shadow)
  - ARIA attributes for accessibility
  - Responsive design
- **Usage**:
  ```typescript
  import { createDatePicker } from './ui/components/datepicker.js';

  const datePicker = createDatePicker({
    placeholder: 'Select date',
    format: 'dd.MM.yyyy',
    value: new Date(), // Optional pre-selected date
    minDate: new Date(), // Optional minimum date
    maxDate: new Date(Date.now() + 30*24*60*60*1000), // Optional max date
    onChange: (date) => console.log('Selected:', date)
  });

  // Get selected date
  const selectedDate = datePicker.getValue();

  // Set date programmatically
  datePicker.setValue(new Date());

  // Clear selection
  datePicker.setValue(null);
  ```

#### index.ts

- **Purpose**: Central export point for all components
- **Exports**: All components and their types (9 components total)
- **Functions**:
  - `initializeComponents()`: Inject all component styles at once (idempotent)
- **Usage**:
  ```typescript
  import { initializeComponents } from './ui/components/index.js';

  // Call once at app start
  initializeComponents();
  ```

**Component Design Principles**:

- ✅ Factory functions for simple components (Button, Card, Input, Spinner)
- ✅ Class-based for complex components (Modal) with lifecycle management
- ✅ Style injection pattern - each component manages its own CSS
- ✅ TypeScript interfaces for type-safe options
- ✅ Accessibility first - ARIA attributes, keyboard support, screen reader text
- ✅ XSS protection - escape user-provided HTML content
- ✅ Flexible content - accept both strings and HTMLElements
- ✅ No state management or API calls - pure UI components
- ✅ Works with event delegation patterns

**Testing**:

- `button.test.ts`: 17 tests covering all button functionality (100% coverage)
- **Total**: 17 tests for component library

---

### Feature UI Modules

#### shopping-list-ui.ts ✨ REFACTORED

- **Status**: ✨ **REFACTORED** - Reduced from McCabe 49 (247 lines) to modular structure (55% reduction)
- **Lines**: 50 | **McCabe**: 3
- **Responsibility**: Barrel file that re-exports shopping list UI functionality
- **Backward Compatibility**: Existing imports continue to work without changes

**Modular Structure** (`src/ui/shopping-list-ui/`):

##### shopping-list-ui/initialization.ts
- **Lines**: 82 | **McCabe**: 14
- **Responsibility**: Main UI setup and orchestration
- **Functions**:
  - `initShoppingListUI()`: Initialize event handlers and state subscriptions
  - `getSelectedStoreId()`: Get currently selected store ID

##### shopping-list-ui/date-picker-manager.ts
- **Lines**: 93 | **McCabe**: 14
- **Responsibility**: DatePicker initialization and management
- **Functions**:
  - `initializeShoppingDatePicker(container, onDateChange)`: Initialize date picker
  - `getShoppingDatePicker()`: Get DatePicker instance
  - `getSelectedShoppingDate()`: Get selected date (ISO format)
  - `setSelectedShoppingDate(date)`: Set selected date
  - `updateDatePickerHighlights()`: Update highlighted dates

##### shopping-list-ui/event-handlers.ts
- **Lines**: 98 | **McCabe**: 22
- **Responsibility**: Event handling for add, delete, and edit operations
- **Functions**:
  - `setupAddItemHandlers(input, mengeInput, addBtn, storeManager)`: Setup add button handlers
  - `setupItemListHandlers(itemsList, storeManager)`: Setup delete/edit event delegation

##### shopping-list-ui/index.ts
- **Lines**: 18 | **McCabe**: 0
- **Responsibility**: Public API that re-exports all shopping list UI operations
- **Purpose**: Single entry point for shopping list UI functionality

**Migration Guide**:

```typescript
// Old (still works - backward compatible)
import { initShoppingListUI, getSelectedStoreId } from './ui/shopping-list-ui.js';

// New (preferred - using barrel file)
import { initShoppingListUI, getSelectedStoreId } from './ui/shopping-list-ui/index.js';

// New (specific module imports)
import { initShoppingListUI } from './ui/shopping-list-ui/initialization.js';
import { setupAddItemHandlers } from './ui/shopping-list-ui/event-handlers.js';
import { initializeShoppingDatePicker } from './ui/shopping-list-ui/date-picker-manager.js';
```

**Benefits**:
- **Clear Separation**: Initialization, DatePicker management, and event handling in separate files
- **Reduced Complexity**: From McCabe 49 to 22 max per module (55% reduction)
- **Better Maintainability**: Each file < 100 lines, single responsibility
- **No Breaking Changes**: Full backward compatibility via re-exports

**Functions** (via `shopping-list/` modules):
  - `loadItems()`: Trigger state to load items
  - `handleEditItem(itemId)`: Handle edit button click for "Sonstiges" items
  - `showDepartmentSelectionDialog(departments)`: Show modal dialog for department selection
  - `showDeleteByDateDialog()`: Show modal dialog for deleting items before a selected date
  - `showPrintPreview()`: Show print preview with date-based filtering
  - `printPreviewContent(frontContent, backContent, storeName, hideDepartments, selectedDate?)`: Generate and print final content with date replacement

- **State Integration**:
  - Subscribes to `shoppingListState` for automatic UI updates
  - UI re-renders automatically when state changes
  - No manual refresh calls needed
- **DatePicker Integration**:
  - Creates DatePicker component for shopping date selection
  - Default value: Next Wednesday (automatically calculated)
  - Format: German date format (dd.MM.yyyy)
  - Date is sent in ISO format (YYYY-MM-DD) to the server using local time (not UTC)
  - DatePicker persists after adding item (no clearing) for batch entry convenience
  - Also used in delete-by-date modal for date selection
  - Timezone handling: Manual ISO formatting to avoid UTC conversion issues
- **Event Handlers**:
  - Add button click → `shoppingListState.addItem(name, menge, storeId, shoppingDate)`
  - Enter key for adding items
  - Delete button click (event delegation) → `shoppingListState.deleteItem()`
  - Edit button click (event delegation) → `handleEditItem()` → Department selection dialog
  - Delete by date button → `showDeleteByDateDialog()` → DatePicker modal → `deleteItemsBeforeDate()`
  - Print button → `showPrintPreview()` → Date-filtered print preview modal
- **Print Preview Features**:
  - Date dropdown in preview: Shows all available shopping dates from items
  - Default selection: Smallest (earliest) date
  - Dynamic re-rendering: Preview updates when date selection changes
  - Filter by date: Only items matching selected shopping_date are shown
  - "Alle Daten" option: Shows all items when no specific date selected
  - Static date in print: Dropdown is replaced with formatted date text (DD.MM.YYYY) in final print output
  - HTML processing: Uses regex to replace `<select>` with `<span>` before printing
- **Event Delegation Pattern**:
  - Single click listener attached to `<ul id="items">` parent
  - Checks `target.classList.contains('removeBtn')` to identify delete buttons
  - Checks `target.classList.contains('editBtn')` to identify edit buttons
  - Extracts `data-item-id` from clicked button
  - Disables button during operations to prevent double-clicks
  - Re-enables button only if operation fails
- **Modal Dialogs**:
  - **Uses Modal Component**: Department selection dialog with Modal component
  - **Uses Button Component**: Department buttons with consistent styling
  - **Uses Toast Component**: Replaces all alert() calls with toast notifications
  - Keyboard support (Escape key), backdrop click to close
  - Auto-close on selection
- **Component Integration**:
  - `Modal` from component library for department selection
  - `createButton` for department option buttons
  - `createDatePicker` for shopping date selection
  - `showError` and `showSuccess` for notifications
  - Consistent styling and behavior across dialogs
- **Template Recognition**:
  - Checks if input matches a template name (case-insensitive)
  - If template found: Inserts all template items with quantities
  - Requires store and date selection before template expansion
  - Shows success toast with count of added items
- **Dependencies**:
  - `../state/shopping-list-state.js`: State management
  - `../data/dom.js`: renderItems (called by subscription)
  - `../data/api.js`: fetchDepartments, convertItemToProduct, fetchTemplates
  - `./components/modal.js`, `./components/button.js`, `./components/toast.js`, `./components/datepicker.js`: UI components

[→ See detailed module documentation](06-modules.md#shopping-list-ui)

#### template-admin.ts

- **Responsibility**: Template administration UI for managing shopping templates
- **State Management**: Uses `template-admin-state.ts` singleton for centralized state
  - **WebSocket Integration**: Real-time template updates via state subscriptions
  - Automatic UI re-rendering on state changes (Observer pattern)
  - State holds templates and filter query
  - Local state in `render-templates.ts` for editing mode and current items
- **Modular Architecture** (`src/ui/template-admin/`):
  - **index.ts**: Re-exports all template admin functions
  - **render-templates.ts**: Template list rendering and form management (integrates with state)
  - **create-form-buttons.ts**: Button creation and state management
  - **event-listeners.ts**: Event handler attachment
- **Component Integration**:
  - **Button Component**: Uses `createButton()` for Save and Cancel buttons
  - **Toast Component**: Success/error notifications for all operations
  - Dynamic button creation with variant styling (success, secondary)
- **Features**:
  - Create templates with name, description, and items
  - Edit existing templates (pre-fill form, show cancel button)
  - Delete templates with browser confirmation
  - Add/remove items to/from templates with quantities
  - Real-time button state management (disable save when no items)
  - Template list with inline item display: "Article (Quantity)"
  - Form validation (unique template names, minimum one item)
  - **Intelligent Template Filtering**: Real-time search for templates (state-managed)
    - **Filter Input Field**: Located next to "Vorhandene Vorlagen" heading for easy access
    - **Multi-Source Search**: Searches template names, descriptions, AND contained items
    - **Live Filtering**: Updates instantly while typing (case-insensitive)
    - **Clear Button**: ✕ button appears when filter has content, one-click to reset
    - **Keyboard Optimized**: Enter key refocuses input after clearing
    - **State Management**: Uses `templateAdminState.setFilterQuery()` for filtering

[→ See detailed module documentation](06-modules.md#template-admin)

#### user-menu.ts ✨ REFACTORED

- **Status**: ✨ **REFACTORED** - Reduced from 387 lines to 60 lines (-84%)
- **Responsibility**: User menu feature UI orchestrator
- **Modular Architecture** (`src/ui/user-menu/`):
  - **navigation-handlers.ts**: Navigation and page routing
  - **websocket-handlers.ts**: WebSocket status display
  - **menu-toggle-handlers.ts**: Menu open/close handlers
  - **auth-handlers.ts**: Logout functionality
  - **utils.ts**: Shared utility functions
- **Functions**:
  - `initUserMenu()`: Initialize menu event handlers
  - `updateUserDisplay()`: Show username in header
- **State Integration**:
  - Uses `userState` for user management
  - Uses `shoppingListState.clear()` on logout/deletion
- **Event Handlers**:
  - Menu toggle (open/close)
  - Click outside to close
  - Logout button → `userState.clearUser()` + `shoppingListState.clear()`
  - Delete account button (with confirmation) → `userState.deleteCurrentUser()`
- **Dependencies**:
  - `../state/user-state.js`: User state management
  - `../state/shopping-list-state.js`: Clear items on logout
  - `../data/auth.js`: logout (token management)
  - `./user-menu/*.js`: Modular handlers

#### product-admin.ts

- **Responsibility**: Product administration UI for creating, editing, and deleting products
- **State Management**: Uses `product-admin-state.ts` singleton for centralized state
  - **WebSocket Integration**: Real-time product updates via state subscriptions
  - Automatic UI re-rendering on state changes (Observer pattern)
  - State holds stores, departments, products, filter query, and editing state
- **Modular Architecture** (`src/ui/product-admin/`):
  - **init.ts**: Entry point, state subscription setup
  - **rendering.ts**: UI rendering functions (reads from state)
  - **event-handlers.ts**: User interaction handlers (writes to state)
- **Component Integration**:
  - **Modal Component**: Delete confirmations with styled danger/cancel buttons
  - **Button Component**: Consistent button styling for all actions
  - **Toast Component**: Replaces all alert() calls with toast notifications
  - Modal-based confirmations replace browser `confirm()` dialogs
- **Features**:
  - Store selection dropdown
  - Product creation form with department assignment and optional manufacturer designation
  - Product editing with pre-filled form (includes manufacturer field)
  - Product deletion with confirmation modal
  - Products grouped by department
  - Fresh product indicator
  - **Manufacturer Field**: Optional product-specific designation (e.g., "Harry's Dinkelkrüstchen" for generic "Brötchen")
    - Automatically propagated to shopping list items
    - Preferred over item name in print view
    - Auto-updates all linked items when changed via WebSocket
  - **Intelligent Filter**: Live search with 50ms debouncing (state-managed)
    - Multi-field search: Product names, department names, "frisch" keyword
    - Counter display: "X von Y" products found
    - Clear button (✕) for quick filter reset
    - Optimized rendering: Only updates changed DOM elements
  - **Alphabetical Sorting**: Products sorted by name within each department
    - German locale support (`localeCompare('de')`)
    - Case-insensitive sorting
  - Success/error toast notifications for all operations
- **Performance Optimizations**:
  - **Efficient Rendering**: `updateProductListDisplay()` only updates changed elements
    - Counter updated via `textContent` (not innerHTML)
    - Clear button visibility toggled via `style.display`
    - Products container updated separately from filter UI
  - **Debouncing**: 50ms timeout prevents excessive re-rendering during fast typing
  - **Preserved Input State**: Filter input is not destroyed/recreated during updates

[→ See detailed module documentation](06-modules.md#product-admin)

#### store-admin.ts ✨ REFACTORED

- **Status**: ✨ **REFACTORED** - Reduced from 465 lines to 114 lines (-75%)
- **Responsibility**: Store and department administration UI orchestrator
- **State Management**: Uses `store-admin-state.ts` singleton for centralized state
  - **WebSocket Integration**: Real-time store and department updates via state subscriptions
  - Automatic UI re-rendering on state changes (Observer pattern)
  - State holds stores with embedded departments array
  - Uses `StoreWithDepartments` interface extending `Store` with optional `departments?: Department[]`
- **Modular Architecture** (`src/ui/store-admin/`):
  - **modals.ts**: Delete confirmation modals
  - **renderer.ts**: UI rendering logic (reads from state)
  - **store-handlers.ts**: Store CRUD event handlers (writes to state)
  - **department-handlers.ts**: Department CRUD and reorder handlers (writes to state)
  - **utils.ts**: Shared utility functions
- **Component Integration**:
  - **Modal Component**: Delete confirmations for stores and departments
  - **Button Component**: Danger/cancel buttons with consistent styling
  - **Toast Component**: Replaces all alert() calls with toast notifications
  - All confirmations use Modal component instead of browser dialogs
- **Features**:
  - Store creation and deletion
  - Department creation and deletion
  - Department reordering (up/down arrows)
  - Inline edit for store and department names
  - Success/error toast notifications for all operations

[→ See detailed module documentation](06-modules.md#store-admin)

#### weekplan.ts ✨ REFACTORED

- **Status**: ✨ **REFACTORED** - Reduced from ~850 lines to 228 lines by extracting modular components
- **Responsibility**: Main weekplan UI orchestration and rendering
- **Complexity Reduction**:
  - **Before**: ~850 lines, very high complexity
  - **After**: 228 lines, McCabe 35, Cyclomatic 22 (moved to "high complexity" range)
  - **Reduction**: ~73% smaller
- **Modular Architecture** (`src/ui/weekplan/`):
  - **Extracted Modules**: 13 focused modules handling specific responsibilities
  - **Re-exports**: Uses barrel file (`weekplan/index.ts`) for clean imports
  - **Maintained Functionality**: All features preserved through modular composition

[→ See complete weekplan documentation](06-modules.md#weekplan-modules)

#### print-utils.ts

- **Responsibility**: Platform-specific print functionality with optimized layout
- **Platform Detection**:
  - `isAndroid()`: Multi-method Android detection (userAgent, userAgentData, platform, touch+mobile heuristic)
  - Works reliably even when "Desktopwebsite" mode is enabled in Chrome
  - `isIOS()`: Detects iPad/iPhone including desktop mode (MacIntel + maxTouchPoints)
- **Print Strategies**:
  - **Desktop/iOS**: Opens popup window with print content (`printPreviewContentPopup()`)
  - **Android**: Inline print by replacing page content (`printPreviewContentInline()`)
    - Prevents Android print dialog from hanging
    - Provides "← Zurück zur Liste" button to restore content
    - Optional debug console for troubleshooting (loaded only when `DEBUG = true`)
- **Layout Features**:
  - **Grid Layout**: Items left, Notes right on one page (for iPad and Android)
  - CSS Grid: `display: grid; grid-template-columns: 1fr 1fr`
  - **Two-Column Sections**: Each section (Items/Notes) uses 2-column layout
  - `convertColumnsToSideBySide()`: Converts CSS columns to actual DOM divs for compatibility
  - Dashed border between sections
  - Print media queries prevent page breaks
- **DEBUG Mode** (default: `false`):
  - Set `const DEBUG = true` to enable debug features
  - Dynamically loads `print-debug.ts` module only when enabled
  - Production builds don't include debug overhead

#### print-debug.ts

- **Responsibility**: Debug utilities for print functionality (optional module)
- **Functions**:
  - `addDebugConsole()`: Creates on-screen debug console with version info and logs
  - `setupDebugHandlers()`: Sets up event handlers for back button and debug toggle
- **Features**:
  - Fixed-position debug console with scrollable log
  - "← Zurück zur Liste" button to restore original content
  - "Debug Ein/Aus" toggle button
  - Timestamped log messages with color coding (log/warn/error)
  - Auto-scroll to latest log entry
- **Loading**: Only loaded via dynamic `import()` when `DEBUG = true` in print-utils.ts
- **Benefits**:
  - Smaller production bundle size
  - Debug features available when needed
  - No performance impact in production

## Testing

- `shopping-list-ui.test.ts`: 14 tests covering all UI interactions (100% coverage)
- `user-menu.test.ts`: 16 tests covering menu functionality (100% coverage)
- `button.test.ts`: 17 tests covering button component (100% coverage)
- **Total**: 47 tests, 100% coverage

## Principles

- ✅ One module per feature
- ✅ Uses Data Layer via clean interfaces
- ✅ All UI logic contained in UI layer
- ✅ No direct API calls (goes through Data Layer)
- ✅ Platform-specific optimizations for best user experience

---

📚 [Back to Main](../ARCHITECTURE.md) | [← State Layer](03-state-layer.md) | [Next: Pages & Entry Points →](05-pages.md)
