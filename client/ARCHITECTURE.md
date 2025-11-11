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
  - `addItem(name)`: Add a new item
  - `deleteItem(id)`: Remove an item
  - `deleteStoreItems(storeId)`: Delete all items for a store
  - `convertItemToProduct(itemId, departmentId)`: Convert item to product with department assignment
  - `fetchStores()`: Get all stores
  - `fetchDepartments(storeId)`: Get departments for a store
  - `ensureFreshToken()`: Refresh JWT before API calls
- **Dependencies**: auth.ts (for token management)
- **Interfaces**: `Item`, `Store`, `Department`, `Product`

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
  - `addItem(name)`: Add item via API and update state
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

##### index.ts
- **Purpose**: Central export point for all components
- **Exports**: All components and their types
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
- **State Integration**:
  - Subscribes to `shoppingListState` for automatic UI updates
  - UI re-renders automatically when state changes
  - No manual refresh calls needed
- **Event Handlers**:
  - Add button click → `shoppingListState.addItem()`
  - Enter key for adding items
  - Delete button click (event delegation) → `shoppingListState.deleteItem()`
  - Edit button click (event delegation) → `handleEditItem()` → Department selection dialog
  - Clear store button → `shoppingListState.deleteStoreItems()`
- **Event Delegation Pattern**:
  - Single click listener attached to `<ul id="items">` parent
  - Checks `target.classList.contains('removeBtn')` to identify delete buttons
  - Checks `target.classList.contains('editBtn')` to identify edit buttons
  - Extracts `data-item-id` from clicked button
  - Disables button during operations to prevent double-clicks
  - Re-enables button only if operation fails
- **Modal Dialogs**:
  - Department selection dialog with backdrop
  - List of department buttons for selection
  - Cancel option and backdrop click to close
- **Dependencies**:
  - `../state/shopping-list-state.js`: State management
  - `../data/dom.js`: renderItems (called by subscription)
  - `../data/api.js`: fetchDepartments, convertItemToProduct

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

**Principles**:
- ✅ Minimal code (orchestration only)
- ✅ No business logic
- ✅ Clear initialization sequence

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
- **451 tests total** (19 test suites)
- **98.5%+ overall code coverage**
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
- **UI Layer**: 47 tests (98%+ coverage)
  - shopping-list-ui.ts: 97% coverage (14 tests)
  - user-menu.ts: 100% coverage (16 tests)
  - button.ts: 100% coverage (17 tests)
- **Pages Layer**: 20 tests (100% coverage)
  - login.ts: 100% coverage

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
3. ~~**Component Library**: Reusable UI components~~ ✅ **IMPLEMENTED** - Button, Modal, Card, Input, Loading components
4. **Offline Support**: Service worker for PWA
5. **Real-time Updates**: WebSocket integration
6. **More UI Modules**: Search, filters, categories
7. **Additional Components**: Extend component library (Dropdown, Tabs, Toast notifications)

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
