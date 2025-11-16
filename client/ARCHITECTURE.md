# Client Architecture Documentation

## Overview

The shopping list client is a TypeScript application built with a **four-layer architecture** that emphasizes separation of concerns, maintainability, and scalability. The architecture uses **physical folder separation** to make layer boundaries explicit and easy to navigate.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Entry Points                            │
│                 (script.ts, index-login.ts)                  │
│         - Minimal orchestration                              │
│         - Initialize layers                                  │
│         - Route to pages                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Pages/UI Layer                             │
│   ┌─────────────────┬────────────────┬──────────────────┐   │
│   │   Pages         │   UI Modules   │                  │   │
│   │  login.ts       │  shopping-     │  user-menu.ts    │   │
│   │  login.html     │  list-ui.ts    │                  │   │
│   │  app.html       │                │                  │   │
│   └─────────────────┴────────────────┴──────────────────┘   │
│         - Page controllers                                   │
│         - Feature-specific UI logic                          │
│         - Event handlers                                     │
│         - Subscribe to state changes                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE LAYER (NEW)                       │
│   ┌──────────────┬──────────────┬──────────────────┐        │
│   │  shopping-   │  user-state  │  store-state     │        │
│   │  list-state  │              │                  │        │
│   │  - items[]   │  - current   │  - stores[]      │        │
│   │  - listeners │    User      │  - departments[] │        │
│   │  - loading   │  - listeners │  - products[]    │        │
│   │              │  - loading   │  - selected*     │        │
│   │              │              │  - listeners     │        │
│   │              │              │  - loading       │        │
│   └──────────────┴──────────────┴──────────────────┘        │
│         - Centralized state management                       │
│         - Observer pattern for reactive updates              │
│         - Single source of truth with CRUD operations        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│   ┌──────────────┬──────────────┬────────────────────┐      │
│   │   api.ts     │   auth.ts    │    dom.ts          │      │
│   │              │              │                    │      │
│   │  API calls   │  JWT auth    │  DOM utilities     │      │
│   │  Token       │  localStorage│  Template loading  │      │
│   │  refresh     │  management  │  Rendering         │      │
│   └──────────────┴──────────────┴────────────────────┘      │
│         - Pure data operations                               │
│         - No UI knowledge                                    │
│         - Reusable utilities                                 │
└─────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. Data Layer (`src/data/`)

**Purpose**: Core data operations and utilities with no UI knowledge.

**Modules**:

#### api.ts
- **Responsibility**: Shopping list API operations
- **Functions**:
  - `fetchItems()`: Get all shopping list items
  - `addItem(name, menge?, storeId?, shoppingDate?)`: Add a new item with optional shopping date
  - `deleteItem(id)`: Remove an item
  - `deleteItemsBeforeDate(beforeDate, storeId?)`: Delete items before a specific date, optionally filtered by store
  - `convertItemToProduct(itemId, departmentId)`: Convert item to product with department assignment
  - `fetchStores()`: Get all stores
  - `fetchDepartments(storeId)`: Get departments for a store
  - `fetchTemplates()`: Get all shopping templates
  - `fetchTemplate(id)`: Get a specific template with items
  - `createTemplate(name, description?, items)`: Create a new template
  - `updateTemplate(id, name?, description?, items?)`: Update a template (partial update)
  - `deleteTemplate(id)`: Delete a template
  - `ensureFreshToken()`: Refresh JWT before API calls
- **Dependencies**: auth.ts (for token management)
- **Interfaces**: `Item` (with shopping_date?: string), `Store`, `Department`, `Product`, `Template`, `TemplateItem`

#### auth.ts
- **Responsibility**: Authentication and user management
- **Functions**:
  - `login(credentials)`: Authenticate user
  - `register(data)`: Create new account
  - `logout()`: Clear authentication
  - `refreshToken()`: Renew JWT token (optimized with singleton pattern)
  - `getCurrentUser()`: Get user info
  - `deleteUser()`: Delete account
  - `getToken()`, `setToken()`, `clearToken()`: Token storage
  - `isAuthenticated()`: Check auth status
  - `resetRefreshState()`: Internal function for testing
- **Storage**: localStorage for JWT tokens
- **Interfaces**: `User`, `LoginCredentials`, `RegisterData`
- **Token Refresh Optimization**:
  - Uses singleton pattern to ensure only one refresh happens at a time
  - Implements 5-second cooldown to prevent excessive refresh requests
  - Caches refresh promise so concurrent calls wait for the same refresh
  - Automatically clears promise after completion

#### dom.ts
- **Responsibility**: DOM manipulation and template loading
- **Functions**:
  - `renderItems(items)`: Render shopping list to DOM with batched updates
  - `createItemElement(item, isInSonstiges)`: Create DOM element for item (no individual event handlers)
    - Shows edit button (✏️) for items in "Sonstiges" section
    - Shows delete button (🗑️) for all items
    - Displays shopping date in German format [DD.MM.YYYY] if available
  - `loadTemplate(path)`: Load HTML template with caching
  - `loadAppTemplate()`: Load main app template
  - `clearTemplateCache()`: Internal function for testing
- **Dependencies**: api.ts (for Item interface)
- **Event Delegation Support**:
  - `createItemElement()` creates buttons with `data-item-id` attributes
  - No `onDelete` callback parameter - enforces event delegation pattern
  - Buttons include `removeBtn` and `editBtn` classes for delegation selectors
  - Parent container is responsible for event handling
- **Template Caching**:
  - Templates are fetched once and cached in memory (Map)
  - Subsequent calls to same template skip fetch and use cache
  - `isTemplateLoaded` flag prevents redundant DOM updates
  - Caching reduces network requests and improves load times
- **Reflow Optimization**:
  - Uses `DocumentFragment` to batch DOM operations
  - Reduces reflows from O(n) to O(1) for n items
  - All items built in memory before single DOM insertion
  - Significant performance gain for large lists (100+ items)

**Testing**:
- `api.test.ts`: 18 tests covering all API operations, 401 handling, and edge cases (100% coverage)
- `auth.test.ts`: 36 tests covering authentication, token management, and refresh optimization (100% coverage)
- `dom.test.ts`: 14 tests for DOM manipulation, rendering, template caching, and batching (98% coverage)
- **Total**: 68 tests, 99.5%+ coverage

**Principles**:
- ✅ No direct DOM manipulation for UI features
- ✅ Pure functions where possible
- ✅ Clear, single-purpose modules
- ✅ Comprehensive error handling

---

### 2. State Layer (`src/state/`)

**Purpose**: Centralized state management with reactive updates.

**Modules**:

#### shopping-list-state.ts
- **Responsibility**: Manage shopping list items state
- **Functions**:
  - `getItems()`: Get current items (read-only copy)
  - `isLoading()`: Check if operation in progress
  - `subscribe(listener)`: Subscribe to state changes (returns unsubscribe function)
  - `loadItems()`: Load items from API and update state
  - `addItem(name, menge?, storeId?, shoppingDate?)`: Add item with optional shopping date via API and update state
  - `deleteItem(id)`: Delete item via API and update state
  - `clear()`: Clear local state
- **Pattern**: Observer pattern for reactive UI updates
- **State**: Single source of truth for items
- **Benefits**:
  - Automatic UI updates via subscriptions
  - No manual refresh calls needed
  - Loading state tracking
  - Immutable state (returns copies)

#### user-state.ts
- **Responsibility**: Manage current user state
- **Functions**:
  - `getCurrentUser()`: Get current user (read-only copy)
  - `isLoading()`: Check if operation in progress
  - `subscribe(listener)`: Subscribe to user changes (returns unsubscribe function)
  - `loadCurrentUser()`: Load user from API and update state
  - `deleteCurrentUser()`: Delete user via API and clear state
  - `clearUser()`: Clear user state (e.g., on logout)
  - `setUser(user)`: Set user directly (e.g., after login)
- **Pattern**: Observer pattern for reactive UI updates
- **State**: Single source of truth for current user
- **Benefits**:
  - Automatic UI updates on user changes
  - Centralized user management
  - Loading state tracking

#### store-state.ts
- **Responsibility**: Manage stores, departments, and products state with full CRUD operations
- **State Properties**:
  - `stores: Store[]`: All available stores
  - `selectedStore: Store | null`: Currently selected store
  - `departments: Department[]`: Departments for selected store
  - `selectedDepartment: Department | null`: Currently selected department
  - `products: Product[]`: Products (filtered by selection)
  - `isLoading: boolean`: Loading state indicator
  - `error: string | null`: Error message if any
- **Read Operations**:
  - `getStores()`: Get all stores (immutable copy)
  - `getSelectedStore()`: Get selected store (immutable copy)
  - `getDepartments()`: Get departments (immutable copy)
  - `getSelectedDepartment()`: Get selected department (immutable copy)
  - `getProducts()`: Get products (immutable copy)
  - `isLoading()`: Check if operation in progress
  - `getError()`: Get error message
  - `getState()`: Get complete state (immutable copy)
  - `subscribe(listener)`: Subscribe to state changes (returns unsubscribe function)
- **Load/Selection Operations**:
  - `loadStores()`: Load all stores from API
  - `selectStore(storeId)`: Select store and load its departments/products
  - `selectDepartment(departmentId)`: Select department and filter products
  - `clearSelection()`: Clear store/department selection
  - `reset()`: Reset all state (for logout)
- **Store CRUD Operations**:
  - `addStore(name, location)`: Create new store and add to state
  - `modifyStore(storeId, name?, location?, sortOrder?)`: Update store (partial updates supported)
  - `removeStore(storeId)`: Delete store and cascade clear related data if selected
- **Department CRUD Operations**:
  - `addDepartment(storeId, name, sortOrder)`: Create new department
  - `modifyDepartment(departmentId, name?, sortOrder?)`: Update department (partial updates)
  - `removeDepartment(departmentId)`: Delete department and reload products if needed
- **Product CRUD Operations**:
  - `addProduct(name, departmentId)`: Create new product (requires selected store)
  - `modifyProduct(productId, updates)`: Update product (handles department changes)
  - `removeProduct(productId)`: Delete product from state
- **Pattern**: Observer pattern for reactive UI updates
- **State Management Features**:
  - **Automatic UI Updates**: All CRUD operations notify subscribers
  - **Smart Selection Handling**: Operations intelligently update related selections
  - **Cascading Updates**: Deleting store clears departments/products
  - **View Filtering**: Products added/removed based on current view
  - **Error Handling**: Consistent error states and messages
  - **Immutability**: All getters return copies, not references
- **Benefits**:
  - Consistent state management pattern across stores/departments/products
  - Eliminates need for direct API calls from UI components
  - Automatic UI synchronization via subscriptions
  - Centralized business logic for data operations
  - Type-safe CRUD operations

**Testing**:
- `shopping-list-state.test.ts`: 35 tests covering state management, subscriptions, and API integration
- `user-state.test.ts`: 24 tests covering user state, subscriptions, and error handling
- `store-state.test.ts`: 34 tests covering stores, departments, products, selections, and immutability
- **Total**: 93 tests for state layer

**Principles**:
- ✅ Single source of truth for application state
- ✅ Observer pattern for reactive updates
- ✅ Immutable state (returns copies, not references)
- ✅ Loading state tracking for UX
- ✅ No direct UI manipulation

**See also**: [STATE_LAYER.md](STATE_LAYER.md) for detailed state layer documentation.

---

### 3. UI Layer (`src/ui/`)

**Purpose**: Feature-specific UI logic, event handlers, and reusable components.

**Modules**:

#### Component Library (`src/ui/components/`)

**Purpose**: Reusable UI components for consistent styling and behavior across the application.

**Components**:

##### button.ts
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

##### modal.ts
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

##### card.ts
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

##### input.ts
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

##### loading.ts
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

##### dropdown.ts
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

##### tabs.ts
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

##### toast.ts
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

##### datepicker.ts
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

##### index.ts
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

#### Feature UI Modules

#### shopping-list-ui.ts
- **Responsibility**: Shopping list feature UI
- **Functions**:
  - `initShoppingListUI()`: Initialize event handlers and state subscriptions
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

#### template-admin.ts
- **Responsibility**: Template administration UI for managing shopping templates
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
- **State Management**:
  - Local state for editing mode (`editingTemplateId`)
  - Local state for current items (`currentItems`)
  - Button references (`saveBtn`, `cancelBtn`)
- **Event Handlers**:
  - Add item button → `handleAddItem()` → adds to currentItems array
  - Remove item button (event delegation) → `handleRemoveItem()` → removes from currentItems
  - Save button → `handleSaveTemplate()` → create or update template
  - Cancel button → `handleCancelEdit()` → reset form
  - Edit template button (event delegation) → `handleEditTemplate()` → load template into form
  - Delete template button (event delegation) → `handleDeleteTemplate()` → delete with confirmation
  - Enter key support for item name and quantity inputs
- **Button State Management**:
  - `updateSaveButtonState()`: Disables save button when no items present
  - Called after every add/remove operation
  - Called on initial load and form reset
- **Dependencies**:
  - `../data/api.js`: fetchTemplates, createTemplate, updateTemplate, deleteTemplate
  - `./components/button.js`: createButton
  - `./components/toast.js`: showError, showSuccess

#### user-menu.ts
- **Responsibility**: User menu feature UI
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

#### product-admin.ts
- **Responsibility**: Product administration UI for creating, editing, and deleting products
- **Component Integration**:
  - **Modal Component**: Delete confirmations with styled danger/cancel buttons
  - **Button Component**: Consistent button styling for all actions
  - **Toast Component**: Replaces all alert() calls with toast notifications
  - Modal-based confirmations replace browser `confirm()` dialogs
- **Features**:
  - Store selection dropdown
  - Product creation form with department assignment
  - Product editing with pre-filled form
  - Product deletion with confirmation modal
  - Products grouped by department
  - Fresh product indicator
  - Success/error toast notifications for all operations
- **Dependencies**:
  - `../data/api.js`: Product CRUD operations
  - `./components/modal.js`, `./components/button.js`, `./components/toast.js`: UI components

#### store-admin.ts
- **Responsibility**: Store and department administration UI
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
- **Dependencies**:
  - `../data/api.js`: Store and department CRUD operations
  - `./components/modal.js`, `./components/button.js`, `./components/toast.js`: UI components

#### user-admin.ts
- **Responsibility**: User administration UI for managing user accounts
- **Features**:
  - List all users with roles
  - Edit user roles
  - Reset user passwords
- **Dependencies**:
  - `../data/api.js`: User management operations

**Testing**:
- `shopping-list-ui.test.ts`: 14 tests covering all UI interactions (100% coverage)
- `user-menu.test.ts`: 16 tests covering menu functionality (100% coverage)
- `button.test.ts`: 17 tests covering button component (100% coverage)
- **Total**: 47 tests, 100% coverage

**Principles**:
- ✅ One module per feature
- ✅ Uses Data Layer via clean interfaces
- ✅ All UI logic contained in UI layer
- ✅ No direct API calls (goes through Data Layer)

---

### 3. Pages Layer (`src/pages/`)

**Purpose**: Page controllers and HTML templates.

**Modules**:

#### login.ts
- **Responsibility**: Login/registration page controller
- **Functions**:
  - `initLoginPage()`: Initialize login page
  - Form toggle (login ↔ register)
  - Form validation
  - Error display
- **Event Handlers**:
  - Login button
  - Register button
  - Form toggle links
  - Enter key submission
- **Dependencies**: `../data/auth.js`

#### login.html
- **Responsibility**: Login page HTML template
- **Contains**: Login and registration forms

#### app.html
- **Responsibility**: Main app HTML template
- **Contains**: Header, shopping list, user menu

**Testing**:
- `login.test.ts`: 20 tests covering login/registration page (100% coverage)
- **Total**: 20 tests, 100% coverage

**Principles**:
- ✅ Controllers orchestrate UI modules
- ✅ Templates are separate from logic
- ✅ Page-level concerns (routing, layout)

---

### 4. Entry Points (`src/`)

**Purpose**: Application initialization and orchestration.

**Modules**:

#### script.ts
- **Responsibility**: Main app entry point
- **Flow**:
  1. Check authentication
  2. Load app template
  3. Update user display
  4. Initialize UI modules (shopping list, user menu)
- **Dependencies**:
  - `./data/dom.js`, `./data/auth.js`
  - `./ui/shopping-list-ui.js`, `./ui/user-menu.js`

#### index-login.ts
- **Responsibility**: Login page entry point
- **Flow**:
  1. Initialize login page controller
- **Dependencies**: `./pages/login.js`

#### script-stores.ts
- **Responsibility**: Store admin page entry point
- **Flow**:
  1. Check authentication
  2. Initialize component library styles
  3. Load stores template
  4. Update user display
  5. Initialize store admin and user menu
- **Dependencies**: `./data/dom.js`, `./data/auth.js`, `./ui/store-admin.js`, `./ui/user-menu.js`

#### script-products.ts
- **Responsibility**: Product admin page entry point
- **Similar flow to script-stores.ts**
- **Dependencies**: `./ui/product-admin.js`

#### script-templates.ts
- **Responsibility**: Template admin page entry point
- **Flow**:
  1. Check authentication
  2. Initialize component library styles
  3. Load templates template
  4. Update user display
  5. Initialize template admin and user menu
- **Dependencies**: `./data/dom.js`, `./data/auth.js`, `./ui/template-admin.js`, `./ui/user-menu.js`

#### script-users.ts
- **Responsibility**: User admin page entry point
- **Similar flow to script-stores.ts**
- **Dependencies**: `./ui/user-admin.js`

**Principles**:
- ✅ Minimal code (orchestration only)
- ✅ No business logic
- ✅ Clear initialization sequence
- ✅ Consistent pattern across all entry points

---

## Dependency Rules

### Allowed Dependencies

```
Entry Points    → Pages Layer ✓
Entry Points    → UI Layer ✓
Entry Points    → Data Layer ✓

Pages Layer     → UI Layer ✓
Pages Layer     → Data Layer ✓

UI Layer        → Data Layer ✓
```

### Forbidden Dependencies

```
Data Layer      → UI Layer ✗
Data Layer      → Pages Layer ✗
Data Layer      → Entry Points ✗

UI Layer        → Pages Layer ✗
UI Layer        → Entry Points ✗

Pages Layer     → Entry Points ✗
```

**Rule**: Dependencies flow downward only. Lower layers never import from higher layers.

---

## Data Flow

### 1. User Action Flow

```
User Interaction
    ↓
UI Layer (Event Handler)
    ↓
Data Layer (API/Auth)
    ↓
Server
    ↓
Data Layer (Process Response)
    ↓
UI Layer (Update DOM)
    ↓
User Sees Result
```

### 2. Authentication Flow

```
User Login
    ↓
pages/login.ts (validate)
    ↓
data/auth.ts (login API call)
    ↓
Server (validate credentials)
    ↓
data/auth.ts (store JWT token)
    ↓
Redirect to /app
    ↓
script.ts (check auth)
    ↓
Initialize app
```

### 3. Shopping List Flow

```
Page Load
    ↓
script.ts (init)
    ↓
ui/shopping-list-ui.ts (loadItems)
    ↓
data/api.ts (ensureFreshToken → fetchItems)
    ↓
Server (return items)
    ↓
data/dom.ts (renderItems)
    ↓
Display in Browser
```

---

## Module Communication

### Good: UI → Data
```typescript
// ui/shopping-list-ui.ts
import { fetchItems, addItem, deleteItem } from '../data/api.js';

async function loadItems() {
  const items = await fetchItems();  // Data Layer handles API
  renderItems(items);                // Data Layer renders
}
```

### Bad: Data → UI
```typescript
// ❌ NEVER DO THIS
// data/api.ts
import { updateUI } from '../ui/shopping-list-ui.js';  // ✗ Wrong!
```

### Good: Event Delegation
```typescript
// ui/shopping-list-ui.ts - Single listener for all buttons
itemsList.addEventListener('click', async (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('removeBtn')) {
    const itemId = target.dataset.itemId;
    await deleteItem(itemId);
  }
});
```

### Bad: Individual Event Handlers
```typescript
// ❌ AVOID THIS - Creates memory leaks with dynamic content
// data/dom.ts
function createItemElement(item: Item) {
  const btn = document.createElement('button');
  btn.addEventListener('click', () => {
    deleteItem(item.id);  // ✗ Individual listener per button!
  });
  return li;
}
```

---

## File Organization

### Import Patterns

**Entry Points**:
```typescript
import { ... } from './data/...';
import { ... } from './ui/...';
import { ... } from './pages/...';
```

**UI Layer**:
```typescript
import { ... } from '../data/...';
```

**Pages Layer**:
```typescript
import { ... } from '../data/...';
import { ... } from '../ui/...';  // If needed
```

**Data Layer**:
```typescript
import { ... } from './...';  // Only within data layer
```

### Test Files

Tests are co-located with their modules:
```
src/data/
  api.ts
  api.test.ts       ← Tests api.ts (9 tests)
  auth.ts
  auth.test.ts      ← Tests auth.ts (33 tests)
  dom.ts
  dom.test.ts       ← Tests dom.ts (7 tests)

src/ui/
  shopping-list-ui.ts
  shopping-list-ui.test.ts  ← Tests shopping-list-ui.ts (14 tests)
  user-menu.ts
  user-menu.test.ts         ← Tests user-menu.ts (16 tests)
  components/
    button.ts
    button.test.ts          ← Tests button.ts (17 tests)
    modal.ts
    card.ts
    input.ts
    loading.ts
    index.ts

src/pages/
  login.ts
  login.test.ts     ← Tests login.ts (20 tests)
```

---

## Adding New Features

### Example: Adding a "Share List" feature

1. **Data Layer**: Create `src/data/share.ts`
   ```typescript
   export async function shareList(listId: string): Promise<string> {
     // API call to get share URL
   }
   ```

2. **UI Layer**: Create `src/ui/share-ui.ts`
   ```typescript
   import { shareList } from '../data/share.js';

   export function initShareUI() {
     // Event handlers for share button
   }
   ```

3. **Update Entry Point**: `src/script.ts`
   ```typescript
   import { initShareUI } from './ui/share-ui.js';

   // In initialization:
   initShareUI();
   ```

4. **Add Tests**: `src/data/share.test.ts`

---

## Security Considerations

### Token Management
- JWT tokens stored in localStorage
- Automatic token refresh on every API call
- Tokens cleared on logout/account deletion
- 401 responses trigger automatic redirect to login

### Best Practices
- All API calls go through Data Layer (centralized auth)
- No tokens in URL parameters
- HTTPS required in production
- Input validation in UI and server

---

## Testing Strategy

### Unit Tests (Data Layer)
- Mock fetch API
- Mock localStorage
- Test all success/error paths
- Test token refresh mechanism

### Integration Tests
- Test layer interactions
- Verify data flow
- Test authentication flow

### Current Coverage
- **445 tests total** (19 test suites)
- **85%+ overall code coverage**
- All critical paths tested

### Test Breakdown by Layer
- **Data Layer**: 68 tests (99.5%+ coverage)
  - auth.ts: 100% coverage (36 tests including token refresh optimization)
  - api.ts: 100% coverage (18 tests including 401 handling and edge cases)
  - dom.ts: 98% coverage (14 tests including template caching and DOM batching)
- **State Layer**: 93 tests (100% coverage)
  - shopping-list-state.ts: 100% coverage (35 tests)
  - user-state.ts: 100% coverage (24 tests)
  - store-state.ts: 100% coverage (34 tests including CRUD operations)
- **UI Layer**: 87 tests (98%+ coverage)
  - shopping-list-ui.ts: 97% coverage (29 tests including edit/delete-by-date/print features)
  - user-menu.ts: 100% coverage (16 tests)
  - button.ts: 100% coverage (17 tests)
  - store-admin.ts: 100% coverage (27 tests)
  - product-admin.ts: 100% coverage (15 tests)
  - Tests updated for Toast notifications
- **Pages Layer**: 20 tests (100% coverage)
  - login.ts: 100% coverage

### Component Library
- **9 components**: Button, Modal, Card, Input, Loading, Dropdown, Tabs, Toast, DatePicker
- **New Components (Dropdown, Tabs, Toast, DatePicker)**: Fully implemented with TypeScript types and style injection
- **Toast Integration**: All alert() calls replaced with Toast notifications across product-admin, store-admin, and shopping-list-ui
- **DatePicker Integration**: Full calendar component with German localization used for shopping date selection
- **Test Coverage**: All tests updated to expect Toast notifications instead of alert() calls (17 test files updated)

---

## Performance Considerations

### Optimization Strategies

1. **Token Refresh**: Optimized to prevent unnecessary refresh requests
   - **Singleton Pattern**: Only one refresh happens at a time, even with concurrent API calls
   - **Cooldown Period**: 5-second cooldown prevents excessive refresh requests
   - **Promise Caching**: Concurrent refresh requests wait for the same promise
   - **Example**: If `fetchItems()`, `addItem()`, and `deleteItem()` are called simultaneously, only one token refresh occurs

2. **Event Delegation**: Efficient delete button handling
   - **Single Listener**: One event listener on the parent `<ul>` handles all delete buttons
   - **Memory Efficiency**: No individual listeners attached to each button element
   - **Dynamic Content**: Works seamlessly with dynamically added/removed items
   - **Double-Click Prevention**: Buttons are disabled during deletion to prevent multiple requests
   - **Performance Impact**: With 100 items, this saves 99 event listeners (99% reduction)
   - **Implementation**: Uses `data-item-id` attributes and class checking for event routing

3. **Template Loading**: Intelligent caching system
   - **Memory Cache**: Templates stored in `Map<string, string>` after first fetch
   - **Zero Network Cost**: Subsequent loads use cached HTML (no fetch)
   - **Load Flag**: `isTemplateLoaded` prevents redundant DOM updates
   - **Performance Impact**: First load ~50-100ms (fetch), subsequent loads <1ms (cache)
   - **Example**: Refreshing page or navigating back uses cached template

4. **Minimal Reflows**: DocumentFragment batching
   - **Batch Operations**: Uses `DocumentFragment` to build DOM tree in memory
   - **Single Insertion**: One `appendChild()` call triggers one reflow
   - **Performance Impact**: O(1) reflows instead of O(n) for n items
   - **Real-World Gains**:
     - 10 items: ~0.5ms saved (marginal but cleaner code)
     - 100 items: ~5-10ms saved (noticeable improvement)
     - 1000 items: ~50-100ms saved (significant improvement)
   - **Example**: Rendering 100-item shopping list triggers 1 reflow, not 100

### Bundle Size
- TypeScript compiled to ES2020 modules
- Native browser modules (no bundler)
- Tree-shakeable imports

---

## Future Enhancements

### Potential Improvements
1. ~~**State Management**: Add centralized state (e.g., observables)~~ ✅ **IMPLEMENTED** - Observer pattern with shopping-list-state, user-state, and store-state
2. ~~**Store State**: Extend state management to stores, departments, and products~~ ✅ **IMPLEMENTED** - Full CRUD operations in store-state
3. ~~**Component Library**: Reusable UI components~~ ✅ **IMPLEMENTED** - 10 components: Button, Modal, Card, Input, Loading, Dropdown, Tabs, Toast, DatePicker, ConnectionStatus
4. ~~**Component Integration**: Use components across application~~ ✅ **IMPLEMENTED** - Modal, Button, and Toast components used throughout the application
5. ~~**Additional Components**: Extend component library~~ ✅ **IMPLEMENTED** - Dropdown (native & searchable), Tabs, Toast notifications, DatePicker
6. ~~**Replace alert() calls**: Convert to Toast notifications~~ ✅ **IMPLEMENTED** - All alert() calls replaced with Toast in product-admin, store-admin, and shopping-list-ui
7. ~~**Real-time Updates**: WebSocket integration for collaborative lists~~ ✅ **IMPLEMENTED** - Full WebSocket integration with auto-reconnection, heartbeat, and ConnectionStatus UI (see below)
8. **Offline Support**: Service worker for PWA capabilities with IndexedDB sync
9. **More UI Modules**: Advanced search, smart filters, category management
10. **Performance Monitoring**: Add analytics and performance tracking
11. **Accessibility Enhancements**: Full WCAG 2.1 AA compliance

### Architecture Evolution
- Previous: 3-layer architecture (Data → UI → Pages)
- Current: **4-layer architecture** (Data → State → UI → Pages)
- Added State Layer with Observer pattern for reactive updates
- Extended state management to all major data entities:
  - shopping-list-state: Shopping list items with CRUD
  - user-state: User management and authentication state
  - store-state: Stores, departments, and products with full CRUD operations
- Maintains separation of concerns principle
- Consistent API across all state managers

---

## Real-time Updates with WebSocket ✅ IMPLEMENTED

### Overview

WebSocket integration enables real-time collaborative shopping lists where multiple users can see changes instantly without polling or page refreshes.

**Status**: ✅ **FULLY IMPLEMENTED** - All components completed and tested

### Implementation Summary

The WebSocket feature has been successfully implemented with the following components:

- ✅ **WebSocket Module** ([client/src/data/websocket.ts](client/src/data/websocket.ts)) - Connection management, auto-reconnection, heartbeat
- ✅ **State Integration** ([client/src/state/shopping-list-state.ts](client/src/state/shopping-list-state.ts)) - Real-time state updates
- ✅ **Server Endpoint** ([server/src/websocket_manager.py](server/src/websocket_manager.py), [server/src/main.py](server/src/main.py)) - Connection manager and broadcasting
- ✅ **ConnectionStatus UI** ([client/src/ui/components/connection-status.ts](client/src/ui/components/connection-status.ts)) - Visual connection indicator
- ✅ **Entry Point Integration** ([client/src/script.ts](client/src/script.ts)) - Automatic connection on app load
- ✅ **Comprehensive Tests** ([client/src/data/websocket.test.ts](client/src/data/websocket.test.ts)) - 12 passing tests

**How to Enable**:

**Option 1: URL Parameter (easiest for mobile devices)**
- Visit your app with `?enable_ws=true` or `?ws=1` parameter
- Example: `https://your-app.com/app.html?enable_ws=true`
- The parameter will be removed from URL automatically after activation
- WebSocket will remain enabled for future visits

**Option 2: Browser Console**
- Open developer console
- Run: `localStorage.setItem('enable_ws', 'true')`
- Reload the page

### Architecture Integration

The WebSocket functionality integrates seamlessly with the existing 4-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                   WebSocket Layer                            │
│                                                              │
│   data/websocket.ts ──────> State Layer                     │
│   - Connection management    - shopping-list-state          │
│   - Event handling           - store-state                  │
│   - Reconnection logic       - user-state                   │
│                                                              │
│   Receives server events → Updates state → Notifies UI      │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Plan

#### 1. Data Layer: WebSocket Module (`src/data/websocket.ts`)

**Purpose**: Manage WebSocket connection and events

**Functions**:
```typescript
// Connection Management
export function connect(): void;
export function disconnect(): void;
export function isConnected(): boolean;
export function getConnectionState(): ConnectionState;

// Event Subscriptions
export function onItemAdded(callback: (item: Item) => void): () => void;
export function onItemDeleted(callback: (itemId: string) => void): () => void;
export function onItemUpdated(callback: (item: Item) => void): () => void;
export function onStoreChanged(callback: (store: Store) => void): () => void;
export function onUserJoined(callback: (user: User) => void): () => void;
export function onUserLeft(callback: (userId: number) => void): () => void;

// Send Events
export function broadcastItemAdd(item: Item): void;
export function broadcastItemDelete(itemId: string): void;
export function broadcastItemUpdate(item: Item): void;
```

**Features**:
- **Auto-Reconnection**: Exponential backoff strategy for connection failures
- **Heartbeat**: Ping/pong messages to detect stale connections
- **Message Queue**: Buffer messages during disconnection, replay on reconnect
- **Event Namespacing**: Separate channels for items, stores, users
- **Error Handling**: Graceful degradation to polling if WebSocket unavailable
- **Authentication**: JWT token in WebSocket handshake

#### 2. State Layer Integration

**Modified State Modules**:

**shopping-list-state.ts**:
```typescript
import * as websocket from '../data/websocket.js';

// Subscribe to WebSocket events on initialization
websocket.onItemAdded((item) => {
  // Add item to local state
  state.items = [...state.items, item];
  notifyListeners();
});

websocket.onItemDeleted((itemId) => {
  // Remove item from local state
  state.items = state.items.filter(i => i.id !== itemId);
  notifyListeners();
});

export async function addItem(name: string, menge?: string, ...) {
  const item = await api.addItem(name, menge, ...);
  // Broadcast to other users via WebSocket
  websocket.broadcastItemAdd(item);
  // Local state already updated by API response
  return item;
}
```

**Benefits**:
- State layer remains single source of truth
- UI automatically updates via existing Observer pattern
- No changes needed to UI Layer
- Separation of concerns maintained

#### 3. Server-Side Requirements

**FastAPI WebSocket Endpoint**:
```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        self.active_connections[user_id].discard(websocket)

    async def broadcast(self, message: dict, exclude_user: int = None):
        """Broadcast to all connected users except sender"""
        for user_id, connections in self.active_connections.items():
            if user_id == exclude_user:
                continue
            for connection in connections:
                await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    user = verify_jwt_token(token)  # Authenticate
    await manager.connect(websocket, user.id)

    try:
        while True:
            data = await websocket.receive_json()

            # Handle different event types
            if data['type'] == 'item:add':
                # Broadcast to other users
                await manager.broadcast({
                    'type': 'item:added',
                    'data': data['item']
                }, exclude_user=user.id)

            elif data['type'] == 'item:delete':
                await manager.broadcast({
                    'type': 'item:deleted',
                    'data': {'id': data['itemId']}
                }, exclude_user=user.id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
```

#### 4. UI Layer: Connection Indicator Component

**New Component**: `src/ui/components/connection-status.ts`

**Features**:
- Visual indicator in header (green dot = connected, yellow = reconnecting, red = offline)
- Toast notification on connection/disconnection
- Show active users count
- Offline mode indicator

**Usage**:
```typescript
import { ConnectionStatus } from './ui/components/connection-status.js';

const status = new ConnectionStatus({
  container: document.getElementById('header'),
  onReconnect: () => {
    // Refresh state from server
    shoppingListState.loadItems();
  }
});
```

### Message Protocol

**Event Types**:
```typescript
// Client → Server
{
  type: 'item:add' | 'item:delete' | 'item:update' | 'ping',
  data: { ... }
}

// Server → Client
{
  type: 'item:added' | 'item:deleted' | 'item:updated' |
        'store:changed' | 'user:joined' | 'user:left' | 'pong',
  data: { ... },
  timestamp: string,
  userId?: number  // Who triggered the event
}
```

**Conflict Resolution**:
- Last-Write-Wins (LWW) strategy with server timestamps
- Server is source of truth
- Client optimistically updates local state
- If server rejects: rollback local state, show error toast

### Performance Considerations

**Optimization Strategies**:

1. **Event Batching**: Group multiple rapid changes into single broadcast
2. **Debouncing**: Wait 100ms before broadcasting typing events
3. **Delta Updates**: Send only changed fields, not entire objects
4. **Compression**: Use MessagePack or similar for binary protocol
5. **Selective Subscription**: Only subscribe to events for current store/date

**Scalability**:
- Use Redis Pub/Sub for multi-server deployment
- Implement room-based broadcasting (per shopping list or store)
- Add rate limiting to prevent spam

### Fallback Strategy

**Progressive Enhancement**:
```typescript
// Try WebSocket first
if (isWebSocketSupported()) {
  websocket.connect();
} else {
  // Fall back to polling
  setInterval(() => {
    shoppingListState.loadItems();
  }, 5000);
}
```

**Offline Support**:
- Queue operations in IndexedDB during offline mode
- Sync when connection restored
- Show offline banner with queued changes count

### Security Considerations

**Best Practices**:
- **Authentication**: JWT token in WebSocket URL or initial handshake
- **Authorization**: Verify user permissions for each event
- **Rate Limiting**: Max messages per minute per user
- **Input Validation**: Sanitize all incoming messages
- **XSS Protection**: Escape user-generated content before rendering
- **CORS**: Configure allowed origins for WebSocket connections

### Testing Strategy

**Unit Tests**:
```typescript
// websocket.test.ts
describe('WebSocket Connection', () => {
  it('should connect and receive item:added events', async () => {
    const mockWs = createMockWebSocket();
    const callback = jest.fn();

    websocket.onItemAdded(callback);
    mockWs.emit('item:added', { id: '1', name: 'Test' });

    expect(callback).toHaveBeenCalledWith({ id: '1', name: 'Test' });
  });

  it('should auto-reconnect on disconnect', async () => {
    const mockWs = createMockWebSocket();
    mockWs.close();

    await waitFor(() => {
      expect(mockWs.connect).toHaveBeenCalled();
    });
  });
});
```

**Integration Tests**:
- Test state synchronization across multiple clients
- Verify conflict resolution
- Test reconnection scenarios
- Measure broadcast latency

### Migration Path

**Phase 1**: Add WebSocket module (backward compatible)
```typescript
// Feature flag approach
const ENABLE_WEBSOCKETS = localStorage.getItem('enable_ws') === 'true';

if (ENABLE_WEBSOCKETS) {
  websocket.connect();
}
```

**Phase 2**: Integrate with state layer (opt-in)
- Users can enable/disable in settings
- Fallback to HTTP API if disabled

**Phase 3**: Enable by default (production)
- Full rollout after testing
- Keep polling fallback for old browsers

### Benefits

**User Experience**:
- ✅ Instant updates across devices
- ✅ See who else is editing the list
- ✅ No page refresh needed
- ✅ Offline support with sync
- ✅ Better collaboration for families/teams

**Technical**:
- ✅ Reduced server load (no polling)
- ✅ Lower latency (push vs pull)
- ✅ Fits existing architecture perfectly
- ✅ No UI layer changes required
- ✅ Maintains separation of concerns

### Example Use Cases

1. **Family Shopping**: Mom adds items from home, dad sees them instantly at the store
2. **Shared Lists**: Roommates coordinate grocery shopping in real-time
3. **Store Mode**: Multiple people shop together, checking off items live
4. **Planning**: Team discusses what to buy with live updates

---

## Troubleshooting

### Common Issues

**Import Errors**:
- Ensure `.js` extension in imports (required for ES modules)
- Check relative paths (`../data/` not `./data/`)

**Authentication Issues**:
- Check localStorage for token
- Verify token refresh in Network tab
- Confirm 401 handling redirects to login

**Build Errors**:
- Run `npm run build` after file moves
- Check TypeScript errors with `tsc --noEmit`

---

## References

- [TypeScript Configuration](tsconfig.json)
- [Jest Configuration](jest.config.js)
- [Main README](README.md)
- [Project Root README](../README.md)
