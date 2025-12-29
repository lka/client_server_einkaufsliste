# Client Architecture Documentation

> **📚 Alle Dokumentationen:** Siehe [Dokumentations-Index](../INDEX.md)

## Overview

The shopping list client is a TypeScript application built with a **four-layer architecture** that emphasizes separation of concerns, maintainability, and scalability. The architecture uses **physical folder separation** to make layer boundaries explicit and easy to navigate.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Entry Points                           │
│                 (script.ts, index-login.ts)                 │
│         - Minimal orchestration                             │
│         - Initialize layers                                 │
│         - Route to pages                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Pages/UI Layer                            │
│   ┌─────────────────┬────────────────┬──────────────────┐   │
│   │   Pages         │   UI Modules   │                  │   │
│   │  login.ts       │  shopping-     │  user-menu.ts    │   │
│   │  login.html     │  list-ui.ts    │                  │   │
│   │  app.html       │                │                  │   │
│   └─────────────────┴────────────────┴──────────────────┘   │
│         - Page controllers                                  │
│         - Feature-specific UI logic                         │
│         - Event handlers                                    │
│         - Subscribe to state changes                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE LAYER (NEW)                      │
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
│   ┌──────────────┬──────────────┬──────────────────┐        │
│   │  product-    │  store-admin │  template-admin  │        │
│   │  admin-state │  -state      │  -state          │        │
│   │  - stores[]  │  - stores[]  │  - templates[]   │        │
│   │  - depts[]   │    (with     │  - filtered[]    │        │
│   │  - products[]│     depts[]) │  - filterQuery   │        │
│   │  - filtered[]│  - listeners │  - listeners     │        │
│   │  - listeners │  - loading   │  - loading       │        │
│   └──────────────┴──────────────┴──────────────────┘        │
│         - Centralized state management                      │
│         - Observer pattern for reactive updates             │
│         - Single source of truth with CRUD operations       │
│         - WebSocket integration for real-time sync          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  api/ (Modular)  │   auth.ts    │    dom.ts          │  │
│   │  ┌────────────┐  │              │                    │  │
│   │  │ types.ts   │  │  JWT auth    │  DOM utilities     │  │
│   │  │ utils.ts   │  │  localStorage│  Template loading  │  │
│   │  │ items-api  │  │  management  │  Rendering         │  │
│   │  │ stores-api │  │  expires_in  │                    │  │
│   │  │ products   │  │──────────────┤────────────────────│  │
│   │  │ users      │  │ websocket.ts │ inactivity-        │  │
│   │  │ templates  │  │              │ tracker.ts         │  │
│   │  │ weekplan   │  │  Real-time   │  Auto logout       │  │
│   │  │ recipes    │  │  connection  │  on timeout        │  │
│   │  │ backup     │  │              │                    │  │
│   │  │ webdav     │  │              │                    │  │
│   │  │ config     │  │              │                    │  │
│   │  └────────────┘  │              │                    │  │
│   │  13 modules      │              │                    │  │
│   │  McCabe: 6-50    │              │                    │  │
│   └──────────────────────────────────────────────────────┘  │
│         - Pure data operations                              │
│         - No UI knowledge                                   │
│         - Reusable utilities                                │
│         - Modular, focused responsibilities                 │
└─────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. Data Layer (`src/data/`)

**Purpose**: Core data operations and utilities with no UI knowledge.

**Modules**:

#### api.ts (Refactored - Modular Architecture)
- **Status**: ✨ **REFACTORED** - Reduced from 1,722 lines (McCabe: 317) to modular structure
- **Responsibility**: Barrel file that re-exports all API functionality from modular `api/` directory
- **Architecture**: All API operations split into focused modules for better maintainability
- **Backward Compatibility**: Existing imports continue to work without changes

**Modular Structure** (`src/data/api/`):

##### api/types.ts
- **Lines**: 125 | **McCabe**: 22
- **Responsibility**: Shared TypeScript interfaces and constants
- **Exports**: All type definitions and API endpoint constants
- **Interfaces**: `Item`, `Store`, `Department`, `Product`, `User`, `Template`, `TemplateItem`, `DeltaItem`, `WeekplanDeltas`, `WeekplanEntry`, `BackupData`, `RestoreResult`, `VersionInfo`, `Config`, `WebDAVSettings`, `ProductSuggestion`
- **Constants**: API endpoint URLs (API_BASE, API_STORES, API_USERS, API_TEMPLATES, etc.)

##### api/utils.ts
- **Lines**: 40 | **McCabe**: 6
- **Responsibility**: Shared authentication and HTTP utilities
- **Functions**:
  - `getAuthHeaders()`: Generate auth headers with JWT token
  - `handleUnauthorized()`: Clear token and redirect to login
  - `ensureFreshToken()`: Refresh token before API calls

##### api/items-api.ts
- **Lines**: 198 | **McCabe**: 43
- **Responsibility**: Shopping list items operations
- **Functions**:
  - `fetchItems()`: Get all shopping list items
  - `fetchItemsByDate(shoppingDate)`: Get items for specific date
  - `addItem(name, menge?, storeId?, shoppingDate?)`: Add new item
  - `deleteItem(id)`: Remove an item
  - `deleteItemsBeforeDate(beforeDate, storeId?)`: Bulk delete by date
  - `convertItemToProduct(itemId, departmentId)`: Convert to product

##### api/stores-api.ts
- **Lines**: 239 | **McCabe**: 50
- **Responsibility**: Stores and departments management
- **Functions**:
  - `fetchStores()`: Get all stores
  - `createStore(name, location?)`: Create new store
  - `updateStore(storeId, name?, location?, sortOrder?)`: Update store
  - `deleteStore(storeId)`: Delete store
  - `fetchDepartments(storeId)`: Get store departments
  - `createDepartment(storeId, name, sortOrder?)`: Create department
  - `updateDepartment(departmentId, name?, sortOrder?)`: Update department
  - `deleteDepartment(departmentId)`: Delete department

##### api/products-api.ts
- **Lines**: 225 | **McCabe**: 39
- **Responsibility**: Product catalog operations
- **Functions**:
  - `getProductSuggestions(storeId, query, limit?)`: Autocomplete suggestions
  - `fetchStoreProducts(storeId)`: Get all products for store
  - `fetchDepartmentProducts(departmentId)`: Get products by department
  - `createProduct(name, storeId, departmentId, fresh?, manufacturer?)`: Create product with optional manufacturer designation
  - `updateProduct(productId, updates)`: Update product (supports name, storeId, departmentId, fresh, manufacturer)
  - `deleteProduct(productId)`: Delete product

##### api/users-api.ts
- **Lines**: 114 | **McCabe**: 23
- **Responsibility**: User management operations
- **Functions**:
  - `fetchAllUsers()`: Get all users
  - `fetchPendingUsers()`: Get unapproved users
  - `approveUser(userId)`: Approve pending user
  - `deleteUser(userId)`: Delete user account

##### api/templates-api.ts
- **Lines**: 168 | **McCabe**: 42
- **Responsibility**: Shopping template operations
- **Functions**:
  - `fetchTemplates()`: Get all templates
  - `fetchTemplate(templateId)`: Get specific template
  - `createTemplate(name, description?, personCount, items)`: Create template
  - `updateTemplate(templateId, name?, description?, personCount?, items?)`: Update template
  - `deleteTemplate(templateId)`: Delete template

##### api/weekplan-api.ts
- **Lines**: 200 | **McCabe**: 35
- **Responsibility**: Weekplan and known units operations
- **Functions**:
  - `getWeekplanEntries(weekStart)`: Get entries for week
  - `createWeekplanEntry(entry)`: Create new entry
  - `deleteWeekplanEntry(entryId)`: Delete entry
  - `updateWeekplanEntryDeltas(entryId, deltas)`: Update entry deltas
  - `getWeekplanSuggestions(query, maxSuggestions?)`: Get template suggestions
  - `fetchKnownUnits()`: Get measurement units with caching
  - `getKnownUnits()`: Get cached units
  - `initializeKnownUnits()`: Initialize units cache

##### api/recipes-api.ts
- **Lines**: 53 | **McCabe**: 7
- **Responsibility**: Recipe search and retrieval
- **Functions**:
  - `searchRecipes(query, limit?)`: Search recipes by name
    - Returns: `Promise<Array<{id: number, name: string}>>`
    - Limit default: 10
  - `getRecipe(recipeId)`: Get recipe details by ID
    - Returns: `Promise<Recipe>` with full recipe data

##### api/backup-api.ts
- **Lines**: 74 | **McCabe**: 17
- **Responsibility**: Database backup and restore
- **Functions**:
  - `createBackup()`: Create database backup (returns JSON)
  - `restoreBackup(backupData, clearExisting?)`: Restore from backup

##### api/webdav-api.ts
- **Lines**: 150 | **McCabe**: 27
- **Responsibility**: WebDAV settings and recipe import
- **Functions**:
  - `fetchWebDAVSettings()`: Get all WebDAV settings
  - `createWebDAVSettings(settings)`: Create new settings
  - `updateWebDAVSettings(id, settings)`: Update settings
  - `deleteWebDAVSettings(id)`: Delete settings
  - `importRecipesFromWebDAV(settingsId)`: Trigger recipe import
    - Returns: `Promise<{success: boolean, imported: number, deleted: number, errors: string[], message: string}>`

##### api/config-api.ts
- **Lines**: 43 | **McCabe**: 6
- **Responsibility**: Server configuration and version info
- **Functions**:
  - `getVersion()`: Get application version (no auth required)
  - `getConfig()`: Get server configuration (no auth required)

##### api/index.ts
- **Lines**: 15 | **McCabe**: 0
- **Responsibility**: Barrel file that re-exports all API modules
- **Purpose**: Single entry point for importing API functionality

**Migration Guide**:
```typescript
// Old (still works - backward compatible)
import { fetchItems, Store, Item } from './data/api.js';

// New (preferred - direct module imports)
import { fetchItems } from './data/api/items-api.js';
import type { Store, Item } from './data/api/types.js';

// New (using barrel file)
import { fetchItems, Store, Item } from './data/api/index.js';
```

**Benefits of Refactoring**:
- **Complexity Reduction**: From single 317 McCabe file to modules averaging ~25 McCabe
- **Better Organization**: Related functions grouped by domain
- **Easier Maintenance**: Single responsibility per module
- **Improved Navigation**: Clear file structure makes code easy to find
- **No Breaking Changes**: Full backward compatibility maintained

#### webdav-admin.ts ✨ REFACTORED (ERWEITERT)
- **Status**: ✨ **REFACTORED** - Reduced from 465 lines to 42 lines (-91%)
- **Responsibility**: WebDAV-Einstellungen mit Rezept-Import-Funktion orchestrator
- **Modular Architecture** (`src/ui/webdav-admin/`):
  - **modals.ts**: All modal dialogs (create, edit, delete, import)
  - **form.ts**: Form rendering and WebDAV settings display
  - **event-handlers.ts**: Event handlers for all CRUD operations
  - **renderer.ts**: WebDAV settings list rendering
- **Rezept-Import Features**:
  - **Import-Button**: "📥 Rezepte importieren" Button pro WebDAV-Konfiguration
    - Nur aktiv wenn WebDAV-Einstellung enabled ist
    - Öffnet Bestätigungs-Modal mit Warnung über lange Dauer
  - **Import-Modal**: `handleImportRecipes(settingsId)`
    - Zeigt Hinweis: "Dies kann einige Sekunden dauern"
    - Deaktiviert Button während Import: "⏳ Importiere..."
    - Zeigt Erfolg mit Anzahl importierter Rezepte
    - Zeigt Warnung bei Fehlern mit Fehleranzahl
    - Error-Handling mit Toast-Benachrichtigungen
  - **Button-Status**: Import-Button ist nur bei aktiver Konfiguration klickbar

#### auth.ts
- **Responsibility**: Authentication and user management with inactivity tracking
- **Functions**:
  - `login(credentials)`: Authenticate user, returns `expires_in` (seconds)
  - `register(data)`: Create new account
  - `logout()`: Clear authentication, session storage, and browser history
  - `refreshToken()`: Renew JWT token (optimized with singleton pattern)
  - `setToken(token, expiresIn?)`: Store token with expiration time
  - `getTokenExpiresIn()`: Retrieve stored token expiration time
  - `clearToken()`: Remove token and expiration info
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

#### websocket.ts ✨ REFACTORED
- **Status**: ✨ **REFACTORED** - Reduced from 401 lines to 43 lines (-90%)
- **Responsibility**: Real-time WebSocket connection management orchestrator
- **Modular Architecture** (`src/data/websocket/`):
  - **types.ts**: TypeScript interfaces and types
  - **config.ts**: Configuration constants
  - **state.ts**: Internal state management
  - **event-system.ts**: Observer pattern implementation
  - **message-handler.ts**: Message processing logic
  - **heartbeat.ts**: Ping/pong heartbeat
  - **connection.ts**: Connection and reconnection logic
  - **subscriptions.ts**: Event subscription handlers
  - **broadcasts.ts**: Message broadcasting functions
- **Functions**:
  - `connect()`: Establish WebSocket connection with JWT authentication
  - `disconnect()`: Close connection gracefully
  - `isConnected()`: Check connection status
  - `getConnectionState()`: Get detailed state (disconnected/connecting/connected/reconnecting)
  - **Shopping List Events**: `onItemAdded()`, `onItemDeleted()`, `onItemUpdated()`, `onActiveUserCount()`
  - **Shopping List Broadcasting**: `broadcastItemAdd()`, `broadcastItemDelete()`, `broadcastItemUpdate()`
  - **Weekplan Events**: `onWeekplanAdded()`, `onWeekplanDeleted()`
  - **Weekplan Broadcasting**: `broadcastWeekplanAdd()`, `broadcastWeekplanDelete()`
- **Features**:
  - Auto-reconnection with exponential backoff (1s to 30s)
  - Heartbeat ping/pong every 30 seconds
  - Message queue (up to 100 messages during offline)
  - JWT token in WebSocket URL for authentication
  - Supports multiple feature event types (items, weekplan, users)
- **Event System**: Observer pattern with Map-based event listeners

#### inactivity-tracker.ts
- **Responsibility**: Track user activity and auto-logout after inactivity across all pages
- **Functions**:
  - `initInactivityTracker(expiresInSeconds)`: Start tracking with token expiration time
  - `stopInactivityTracker()`: Stop tracking and cleanup
  - `resetInactivityTimer()`: Reset timer on activity (exported for API operations)
  - `getRemainingTime()`: Get remaining seconds until timeout
- **Activity Events Monitored** (passive listeners on window):
  - Mouse: `mousedown`, `mousemove`, `click`
  - Keyboard: `keypress`
  - Touch: `touchstart`
  - Scroll: `scroll`
- **Initialization**:
  - Called in all entry point scripts for authenticated pages:
    - `script.ts` (shopping list)
    - `script-weekplan.ts` (weekplan)
    - `script-products.ts` (product admin)
    - `script-stores.ts` (store admin)
    - `script-templates.ts` (template admin)
    - `script-users.ts` (user admin)
    - `script-backup.ts` (backup admin)
    - `script-webdav.ts` (WebDAV settings)
    - `script-units.ts` (units admin)
  - Uses `isTrackerActive` flag to prevent duplicate event listeners across page navigation
  - Event listeners persist globally across single-page navigation
- **Behavior**:
  - Timer resets on any activity event
  - After timeout: Alert message, logout, clear history, redirect to login
  - Configurable timeout from server (`ACCESS_TOKEN_EXPIRE_MINUTES`)
  - Clears SessionStorage and Browser History on logout
  - Works seamlessly when switching between all application pages
  - Single global instance ensures consistent tracking across entire session
- **Implementation Details**:
  - Global state variables: `inactivityTimeout`, `inactivityTimeoutMs`, `isTrackerActive`
  - Event listeners added only once per session (not per page load)
  - Timer continues running across page transitions

**Testing**:
- `api.test.ts`: 18 tests covering all API operations, 401 handling, and edge cases (100% coverage)
- `auth.test.ts`: 36 tests covering authentication, token management, and refresh optimization (100% coverage)
- `dom.test.ts`: 14 tests for DOM manipulation, rendering, template caching, and batching (98% coverage)
- `websocket.test.ts`: 12 tests for WebSocket connection, events, and reconnection (100% coverage)
- **Total**: 80 tests, 99%+ coverage

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

#### store-state.ts ✨ REFACTORED
- **Status**: ✨ **REFACTORED** - Reduced from 662 lines to 181 lines (-73%)
- **Responsibility**: Manage stores, departments, and products state with full CRUD operations
- **Modular Architecture** (`src/state/store-state/`):
  - **types.ts**: TypeScript interfaces and state types
  - **store-operations.ts**: Store CRUD operations
  - **department-operations.ts**: Department CRUD operations
  - **product-operations.ts**: Product CRUD operations
  - **selection.ts**: Store and department selection logic
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

#### product-admin-state.ts ✨ NEW
- **Status**: ✨ **NEW** - State-based architecture for product management with WebSocket integration
- **Responsibility**: Centralized state management for product admin with real-time synchronization
- **State Properties**:
  - `stores: Store[]`: All stores
  - `selectedStoreId: number | null`: Currently selected store
  - `departments: Department[]`: Departments for selected store
  - `products: Product[]`: Products for selected store
  - `filteredProducts: Product[]`: Filtered products based on search query
  - `editingProductId: number | null`: Product being edited (null if creating new)
  - `filterQuery: string`: Current search/filter text
- **Functions**:
  - `getState()`: Get complete state (read-only copy)
  - `subscribe(listener)`: Subscribe to state changes (returns unsubscribe function)
  - `loadStores()`: Load all stores from API
  - `loadDepartments(storeId)`: Load departments for store
  - `loadProducts(storeId)`: Load products for store
  - `setSelectedStoreId(id)`: Update selected store
  - `setEditingProductId(id)`: Set product for editing
  - `setFilterQuery(query)`: Update filter and trigger re-filtering
  - `getProductById(id)`: Get specific product
  - `resetStateForStoreChange()`: Reset state when store changes
- **WebSocket Integration**:
  - `onProductAdded`: Adds product to state if it belongs to current store
  - `onProductUpdated`: Updates product in state
  - `onProductDeleted`: Removes product from state
  - `onDepartmentAdded`, `onDepartmentUpdated`, `onDepartmentDeleted`: Department updates
  - `onStoreAdded`, `onStoreUpdated`, `onStoreDeleted`: Store updates
- **Pattern**: Observer pattern with automatic UI updates via subscriptions
- **Benefits**:
  - Real-time synchronization across users
  - Automatic filtering and state updates
  - Single source of truth for product admin
  - No manual refresh calls needed

#### store-admin-state.ts ✨ NEW
- **Status**: ✨ **NEW** - State-based architecture for store administration with WebSocket integration
- **Responsibility**: Centralized state management for store/department admin with real-time synchronization
- **State Properties**:
  - `stores: Store[]`: All stores with nested departments
- **Functions**:
  - `getState()`: Get complete state (read-only copy)
  - `getStores()`: Get all stores (read-only copy)
  - `subscribe(listener)`: Subscribe to state changes (returns unsubscribe function)
  - `loadStores()`: Load stores from API
- **WebSocket Integration**:
  - `onStoreAdded`: Adds new store to state
  - `onStoreUpdated`: Updates store information
  - `onStoreDeleted`: Removes store from state
  - `onDepartmentAdded`: Adds department to parent store
  - `onDepartmentUpdated`: Updates department information
  - `onDepartmentDeleted`: Removes department from parent store
- **Pattern**: Observer pattern for reactive UI updates
- **Benefits**:
  - Real-time updates when stores/departments change
  - Automatic UI synchronization
  - Simplified state management for admin operations

#### template-admin-state.ts ✨ NEW
- **Status**: ✨ **NEW** - State-based architecture for template management with WebSocket integration
- **Responsibility**: Centralized state management for template admin with real-time synchronization
- **State Properties**:
  - `templates: Template[]`: All templates
  - `filteredTemplates: Template[]`: Templates matching filter query
  - `filterQuery: string`: Current search text
- **Functions**:
  - `getState()`: Get complete state (read-only copy)
  - `getTemplates()`: Get all templates (read-only copy)
  - `getFilteredTemplates()`: Get filtered templates (read-only copy)
  - `subscribe(listener)`: Subscribe to state changes (returns unsubscribe function)
  - `loadTemplates()`: Load templates from API
  - `setFilterQuery(query)`: Update filter and apply filtering
  - `getTemplateById(id)`: Get specific template
- **WebSocket Integration**:
  - `onTemplateAdded`: Adds new template to state
  - `onTemplateUpdated`: Updates template information
  - `onTemplateDeleted`: Removes template from state
- **Pattern**: Observer pattern for reactive UI updates
- **Benefits**:
  - Real-time template synchronization across users
  - Automatic filtering on state change
  - Consistent state management pattern

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
- ✅ WebSocket integration for real-time synchronization (shopping-list, product-admin, store-admin, template-admin)

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

##### dropdown.ts ✨ REFACTORED
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
- **State Management Details**:
  - **Centralized**: `template-admin-state.ts` holds templates and filter query
  - **Local**: `editingTemplateId` and `currentItems` in `render-templates.ts` for form state
  - Button references (`saveBtn`, `cancelBtn`)
- **Event Handlers**:
  - Add item button → `handleAddItem()` → adds to currentItems array
  - Remove item button (event delegation) → `handleRemoveItem()` → removes from currentItems
  - Save button → `handleSaveTemplate()` → create or update template
  - Cancel button → `handleCancelEdit()` → reset form
  - Edit template button (event delegation) → `handleEditTemplate()` → load template into form
  - Delete template button (event delegation) → `handleDeleteTemplate()` → delete with confirmation
  - Enter key support for item name and quantity inputs
  - Filter input → `filterTemplates()` → calls state.setFilterQuery() for real-time filtering
  - Clear filter button → resets filter and refocuses input
- **Filtering Logic**:
  - `filterTemplates(query)`: Delegates to `templateAdminState.setFilterQuery()`
  - State handles normalization (lowercase, trimmed)
  - State provides `filteredTemplates` array
  - Shows all templates when query is empty
  - Uses Array.filter() with includes() for substring matching
  - Auto-shows/hides clear button based on input value
- **Button State Management**:
  - `updateSaveButtonState()`: Disables save button when no items present
  - Called after every add/remove operation
  - Called on initial load and form reset
- **Dependencies**:
  - `../state/template-admin-state.js`: Centralized state management with WebSocket
  - `../data/api.js`: fetchTemplates, createTemplate, updateTemplate, deleteTemplate
  - `../data/websocket.js`: Real-time event subscriptions
  - `./components/button.js`: createButton
  - `./components/toast.js`: showError, showSuccess

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
- **Dependencies**:
  - `../state/product-admin-state.js`: Centralized state management with WebSocket
  - `../data/api.js`: Product CRUD operations
  - `../data/websocket.js`: Real-time event subscriptions
  - `./components/modal.js`, `./components/button.js`, `./components/toast.js`: UI components

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
- **Dependencies**:
  - `../state/store-admin-state.js`: Centralized state management with WebSocket
  - `../data/api.js`: Store and department CRUD operations
  - `../data/websocket.js`: Real-time event subscriptions
  - `./components/modal.js`, `./components/button.js`, `./components/toast.js`: UI components
  - `./store-admin/*.js`: Modular handlers and renderers

#### user-admin.ts
- **Responsibility**: User administration UI for managing user accounts
- **Features**:
  - List all users with roles
  - Edit user roles
  - Reset user passwords
- **Dependencies**:
  - `../data/api.js`: User management operations

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
- **Core Functions** (remaining in main file):
  - `initWeekplan()`: Initialize weekplan UI, event handlers, and WebSocket subscriptions
  - `renderWeek()`: Display week view with date calculations and entry loading (now uses weekplanState)
  - `navigateToPreviousWeekLocal()`, `navigateToNextWeekLocal()`: Week navigation wrappers
  - `handleWeekplanAdded(data)`: Handle incoming WebSocket event for new entries
  - `handleWeekplanDeleted(data)`: Handle incoming WebSocket event for deleted entries
- **Delegated to Modules**:
  - Date utilities → `weekplan/weekplan-utils.ts`
  - State management → `weekplan/weekplan-state.ts`
  - Navigation → `weekplan/weekplan-navigation.ts`
  - Entry input → `weekplan/entry-input.ts`
  - Rendering → `weekplan/weekplan-rendering.ts`
  - WebSocket integration → `weekplan/weekplan-websocket.ts`
  - Print functionality → `weekplan/weekplan-print.ts`
  - Ingredient parsing → `weekplan/ingredient-parser/` (modularized)
  - Template modal → `weekplan/template-modal.ts`
  - Recipe modal → `weekplan/recipe-modal.ts`
  - Modal shared utilities → `weekplan/modal-shared.ts`
  - Types → `weekplan/types.ts`
- **Dependencies**:
  - `../data/api.js`: getWeekplanEntries (minimal API usage)
  - `../data/websocket.js`: onWeekplanAdded, onWeekplanDeleted
  - `./weekplan/index.js`: All weekplan modules

#### Weekplan Modules (`src/ui/weekplan/`)

**Purpose**: Modular weekplan components for weekly meal planning with recipe and template support.

##### weekplan/types.ts
- **Lines**: 39 | **McCabe**: 0
- **Responsibility**: Shared TypeScript types for weekplan modules
- **Exports**:
  - Re-exports from API: `WeekplanEntry`, `WeekplanDeltas`, `DeltaItem`
  - `ParsedIngredient`: Ingredient with quantity and name
  - `WeekplanState`: State structure for entries and offset
  - `DAY_NAMES`, `MEAL_TYPES`: Constants for day/meal configuration
  - `DayName`, `MealType`: Type definitions
  - `WeekInfo`: Week metadata structure

##### weekplan/weekplan-state.ts
- **Lines**: 181 | **McCabe**: 26
- **Responsibility**: Centralized state management for weekplan entries
- **Pattern**: Observer pattern with reactive updates
- **State**:
  - `entriesStore`: Map<dateISO, Map<meal, WeekplanEntry[]>>
  - `weekOffset`: Number (0 = current week, -1 = previous, +1 = next)
  - `listeners`: Set of state change callbacks
- **Functions**:
  - `getEntries(date, meal)`: Get entries for specific date and meal
  - `getDateEntries(date)`: Get all entries for a date
  - `getAllEntries()`: Get complete entries store (read-only copy)
  - `addEntry(entry)`: Add entry to state
  - `removeEntry(entryId)`: Remove entry by ID
  - `updateEntry(entry)`: Update existing entry
  - `clearEntries()`: Clear all entries
  - `setEntries(entries)`: Bulk set entries from API
  - `getWeekOffset()`, `setWeekOffset(offset)`: Week navigation state
  - `incrementWeekOffset()`, `decrementWeekOffset()`: Week navigation helpers
  - `subscribe(listener)`: Subscribe to state changes
- **Benefits**:
  - Single source of truth for weekplan data
  - Automatic UI updates via subscriptions
  - Immutable state (returns copies)

##### weekplan/weekplan-utils.ts
- **Lines**: 60 | **McCabe**: 11
- **Responsibility**: Date utility functions for weekplan
- **Functions**:
  - `getISOWeek(date)`: Calculate ISO week number
  - `getMonday(date)`: Get Monday of the week for a date
  - `formatShortDate(date)`: Format as DD.MM. for display
  - `formatISODate(date)`: Format as YYYY-MM-DD for API
  - `getWeekDates(mondayDate)`: Get array of dates for a week
  - `isToday(date)`: Check if a date is today

##### weekplan/weekplan-navigation.ts
- **Lines**: 60 | **McCabe**: 6
- **Responsibility**: Week navigation functionality
- **Functions**:
  - `getCurrentWeekInfo()`: Get week metadata based on offset
  - `getWeekDisplayString()`: Format week display string (e.g., "KW 47 · 18.11. - 24.11.2024")
  - `navigateToPreviousWeek()`: Navigate to previous week
  - `navigateToNextWeek()`: Navigate to next week
  - `navigateToCurrentWeek()`: Reset to current week
  - `navigateToWeekOffset(offset)`: Navigate to specific offset

##### weekplan/weekplan-websocket.ts
- **Lines**: 47 | **McCabe**: 10
- **Responsibility**: WebSocket integration for real-time weekplan updates
- **Functions**:
  - `initializeWeekplanWebSocket()`: Initialize WebSocket listeners
  - `handleWeekplanAdded(data)`: Handle weekplan entry added event
  - `handleWeekplanDeleted(data)`: Handle weekplan entry deleted event
- **Features**:
  - Updates weekplanState on incoming events
  - Dynamically adds/removes entries from DOM
  - Real-time synchronization across users

##### weekplan/weekplan-print.ts
- **Lines**: 28 | **McCabe**: 6
- **Responsibility**: Print functionality for weekplan
- **Functions**:
  - `handlePrintWeekplan()`: Generate and print current week's plan
- **Features**:
  - Builds entries map for all 7 days
  - Uses print-utils for platform-specific printing
  - Includes week number and year in output

##### weekplan/weekplan-rendering.ts
- **Lines**: 108 | **McCabe**: 10
- **Responsibility**: DOM rendering for weekplan entries
- **Functions**:
  - `addMealItemToDOM(container, text, entryId, recipeId?)`: Create meal item element
- **Features**:
  - Clickable entry text with hover effects
  - Delete button with confirmation
  - Dispatches custom `weekplan:show-details` event for template/recipe modals
  - Handles delete via API and broadcasts WebSocket event

##### weekplan/entry-input.ts
- **Lines**: 169 | **McCabe**: 29
- **Responsibility**: Entry input field with autocomplete
- **Functions**:
  - `handleAddMealEntry(event)`: Create/manage entry input fields
  - `calculateDateForDay(dayName)`: Convert day name to ISO date
  - `createEntryInput(mealContent, meal, dayName)`: Create input field with autocomplete
- **Features**:
  - **Optimized + Button Workflow**: Rapid entry without mouse-keyboard switching
    - **Smart-Save**: Saves existing input and creates new one on + click
    - **Empty Input Behavior**: Focuses empty input instead of creating new one
    - **Error Handling**: Keeps input active if save fails
  - **Autocomplete Integration**: Shows suggestions from templates and recipes
    - Templates and weekplan suggestions first
    - Recipes marked with 🍳 emoji
    - Combined limit of 5 suggestions
  - Escape key to cancel
  - Enter key to save
  - Auto-remove on blur if empty

##### weekplan/ingredient-parser/ ✨ MODULARIZED
- **Status**: ✨ **MODULARIZED** - Split from 231 lines (McCabe 60) into 7 focused modules
- **Responsibility**: Parse and adjust ingredient quantities with fractions and units
- **Modular Architecture** (`src/ui/weekplan/ingredient-parser/`):
  - **index.ts**: Public API (re-exports)
  - **constants.ts**: FRACTIONS_MAP (Unicode fractions → decimal values)
  - **fraction-converter.ts** (McCabe 9): Convert Unicode fractions to decimal
    - `convertFractionToDecimal(fractionStr)`: Handles simple (½) and mixed (1½) fractions
    - `applySign(value, minusSign)`: Apply +/- sign to values
  - **formatters.ts** (McCabe 7): Value formatting utilities
    - `formatValue(value)`: Format numbers with comma separator
    - `formatValueWithUnit(value, unit)`: Format with optional unit
    - `removeApproximationPrefix(text)`: Remove "ca. " prefix
  - **parsers.ts** (McCabe 26): Core parsing functions
    - `parseUnicodeFractionValue(text)`: Parse Unicode fractions (½, 1½)
    - `parseTextFractionValue(text)`: Parse text fractions (1/2, 2 1/2)
    - `parseUnicodeFraction(text)`: Parse with unit (½ TL, 1½ kg)
    - `parseTextFraction(text)`: Parse with unit (1/2 TL, 2 1/2 kg)
    - `parseDecimalNumber(text)`: Parse decimals (500, 2.5, 1,5)
  - **ingredient-parser.ts** (McCabe 13): Main functionality
    - `parseIngredients(ingredientLines)`: Parse ingredient lines with server units
    - `adjustQuantityByFactor(originalMenge, factor)`: Scale quantities
  - **quantity-parser.ts** (McCabe 5): Numeric quantity parsing
    - `parseQuantity(quantityStr)`: Parse numeric values (handles fractions)
- **Backward Compatibility**: Original `ingredient-parser.ts` re-exports all functions
- **Features**:
  - **Unicode Fractions**: Supports ½, ¼, ¾, ⅓, ⅔, ⅕, ⅙, ⅛, etc.
  - **Mixed Numbers**: Handles 1½, 2¼, 3⅓, etc.
  - **Text Fractions**: Parses 1/2, 2 1/2, 3/4, etc.
  - **Decimal Support**: Comma or dot separators (2.5 or 2,5)
  - **Unit Parsing**: Fetches known units from server
  - **Approximation Prefix**: Removes "ca. " before parsing
  - **Scaling**: Adjusts quantities by factor (for person count changes)
- **Architecture Benefits**:
  - **Low Complexity**: Max McCabe 26 per module (was 60)
  - **High Cohesion**: Each module has one clear responsibility
  - **Testability**: Small modules easier to unit test
  - **Reusability**: Parsers/formatters can be imported individually

##### weekplan/template-modal.ts
- **Lines**: 250 | **McCabe**: 42
- **Responsibility**: Template details modal with delta management
- **Functions**:
  - `showTemplateDetails(templateName, entryId)`: Display template modal
  - `findEntryById(entryId)`: Find entry in weekplan state
- **Features**:
  - **Delta Management**: Checkboxes to remove individual items
  - **Quantity Adjustment**: Live-scaling for person count
  - **Additional Items**: Add custom items with quantities
  - **Scrollable Layout**: Template items scroll, input form stays fixed
  - **Save Changes**: Persist deltas via API
  - Loads existing deltas from entry
  - Validates items against template list

##### weekplan/recipe-modal.ts ✨ REFACTORED
- **Status**: ✨ **REFACTORED** - Reduced from 363 lines to 99 lines (-73%)
- **Lines**: 99 | **McCabe**: ~20 (reduced from 53)
- **Responsibility**: Recipe details modal orchestrator with ingredient management
- **Modular Architecture** (`src/ui/weekplan/recipe-modal/`):
  - **types.ts**: RecipeModalState interface
  - **recipe-loader.ts**: Recipe fetching by ID and name
  - **ingredient-renderer.ts**: Ingredient list rendering with checkboxes
  - **delta-manager.ts**: Delta state initialization and save logic
  - **modal-builder.ts**: Modal content construction
  - **save-handler.ts**: Save functionality for recipe deltas
  - **utils.ts**: Utility functions (entry lookup, quantity parsing)
- **Functions**:
  - `showRecipeDetailsById(recipeId, entryId)`: Show recipe by ID
  - `showRecipeDetails(recipeName)`: Show recipe by name (search first)
  - `displayRecipeModal(recipeName, recipeData, entryId?)`: Display modal
- **Features**:
  - **Rezept-Parsing**: Parses ingredients with quantities and units
  - **Personenanzahl-Anpassung**: Live-scaling for portion count
  - **Delta-Management**: Checkboxes to disable individual ingredients
  - **Zusätzliche Items**: Add custom ingredients
  - **Scrollbares Layout**: Ingredients scroll, input form fixed
  - **Save Changes**: Persist deltas via API
  - Description, quantity, and full ingredient list display

##### weekplan/modal-shared.ts
- **Lines**: 257 | **McCabe**: 28
- **Responsibility**: Shared modal UI components
- **Functions**:
  - `createQuantityAdjustmentSection(originalPersonCount, currentPersonCount, onAdjust)`: Person count adjuster
  - `createAddItemForm(onAddItem, existingItems?)`: Add item form with validation
  - `createAddedItemsList(addedItems, onRemove)`: Display added items with remove buttons
  - `createScrollableSection()`: Scrollable content container
  - `createFixedFormSection()`: Fixed form container at bottom
- **Features**:
  - Reusable UI components for both template and recipe modals
  - Consistent styling and behavior
  - Input validation and duplicate detection

##### weekplan/index.ts
- **Lines**: 63 | **McCabe**: 2
- **Responsibility**: Barrel file for weekplan modules
- **Exports**: All weekplan functions, types, and utilities
- **Functions**:
  - `initWeekplanModule()`: Initialize WebSocket and state subscriptions
- **Benefits**:
  - Single import point for all weekplan functionality
  - Clean module boundaries
  - Easy to extend and maintain

**Weekplan Features**:
- **Rezept-Autocomplete**: Integration with `/api/recipes/search` endpoint
  - Recipes appear in autocomplete after templates (templates have priority)
  - Fuzzy search with case-insensitive matching
  - Limit: Maximum 10 suggestions (templates + recipes combined)
- **Template Preview**: Click on entry to view template details
  - Visual feedback (blue background, underline, blue text on hover)
  - Smart detection (case-insensitive template matching)
  - Modal display with items and quantities
- **Recipe Modal mit Personenanzahl**: Full recipe details
  - Loads complete recipe data via API
  - Shows metadata: name, category, tags, preparation time, person count
  - Ingredient list with quantity parsing
  - **Person count input**: Live-scaling of all quantities
  - **Delta management**: Checkboxes to disable individual ingredients
  - **Additional items**: Input field for custom ingredients
  - **Scrollable layout**: Ingredients scroll, input fields stay fixed
- **Delta-Struktur**: `WeekplanDeltas` with recipe support
  - `person_count?: number`: Desired person count
  - `removed_items?: string[]`: List of disabled ingredient names
  - `added_items?: Array<{name: string, menge: string}>`: Additional items
- **Server-Integration**:
  - `POST /api/weekplan`: Saves entries with `recipe_id` and `deltas`
  - Server-side ingredient processing and quantity calculations

**Benefits of Modular Refactoring**:
- **Complexity Reduction**: From very high to high complexity (manageable)
- **Better Organization**: Each module has single responsibility
- **Easier Maintenance**: Changes isolated to specific modules
- **Improved Testability**: Individual modules easier to test
- **No Breaking Changes**: Full backward compatibility maintained
- **Reusable Components**: Modal utilities, state management, parsing logic

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
- **Dependencies**:
  - `./print-debug.js`: Debug console (dynamic import, optional)

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
- ✅ Platform-specific optimizations for best user experience
- ✅ Optional debug features via feature flags

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
  2. **Initialize WebSocket connection (if enabled via feature flag)**
  3. Initialize component library styles
  4. Load stores template
  5. Update user display
  6. Initialize store admin and user menu
- **Dependencies**: `./data/dom.js`, `./data/auth.js`, `./data/websocket.js`, `./ui/store-admin.js`, `./ui/user-menu.js`
- **WebSocket Integration**: Connects to WebSocket for real-time store and department updates

#### script-products.ts
- **Responsibility**: Product admin page entry point
- **Flow**:
  1. Check authentication
  2. **Initialize WebSocket connection (if enabled via feature flag)**
  3. Initialize component library styles
  4. Load products template
  5. Update user display
  6. Initialize product admin and user menu
- **Dependencies**: `./data/dom.js`, `./data/auth.js`, `./data/websocket.js`, `./ui/product-admin.js`, `./ui/user-menu.js`
- **WebSocket Integration**: Connects to WebSocket for real-time product updates

#### script-templates.ts
- **Responsibility**: Template admin page entry point
- **Flow**:
  1. Check authentication
  2. **Initialize WebSocket connection (if enabled via feature flag)**
  3. Initialize component library styles
  4. Load templates template
  5. Update user display
  6. Initialize template admin and user menu
- **Dependencies**: `./data/dom.js`, `./data/auth.js`, `./data/websocket.js`, `./ui/template-admin.js`, `./ui/user-menu.js`
- **WebSocket Integration**: Connects to WebSocket for real-time template updates

#### script-users.ts
- **Responsibility**: User admin page entry point
- **Similar flow to script-stores.ts**
- **Dependencies**: `./ui/user-admin.js`

#### script-weekplan.ts
- **Responsibility**: Weekly meal plan page entry point
- **Flow**:
  1. Check authentication
  2. Initialize component library styles
  3. Load weekplan template
  4. Update user display
  5. Initialize weekplan UI and user menu
  6. Initialize WebSocket connection (if enabled)
- **Dependencies**: `./data/dom.js`, `./data/auth.js`, `./ui/weekplan.js`, `./ui/user-menu.js`, `./data/websocket.js`
- **WebSocket Integration**: Connects to WebSocket for real-time weekplan synchronization
- **Features**:
  - Week navigation (previous/next week)
  - Day columns for Monday-Sunday
  - 3 meal sections per day (morning, lunch, dinner)
  - Shared plan visible to all authenticated users
  - Real-time updates via WebSocket events (`weekplan:added`, `weekplan:deleted`)

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
- ✅ **State Integration** ([client/src/state/shopping-list-state.ts](client/src/state/shopping-list-state.ts)) - Real-time state updates with intelligent event dispatching
  - **New items** → `broadcastItemAdd()` → `item:add` event
  - **Deleted items** → `broadcastItemDelete()` → `item:delete` event
  - **Updated items** (quantity, department) → `broadcastItemUpdate()` → `item:update` event
  - **Smart broadcasting**: Distinguishes between add and update based on existing state
- ✅ **UI Integration** ([client/src/ui/shopping-list-ui.ts](client/src/ui/shopping-list-ui.ts)) - Department assignment uses updateItem() for optimized WebSocket sync
- ✅ **Server Endpoint** ([server/src/websocket_manager.py](server/src/websocket_manager.py), [server/src/main.py](server/src/main.py)) - Connection manager and broadcasting
- ✅ **ConnectionStatus UI** ([client/src/ui/components/connection-status.ts](client/src/ui/components/connection-status.ts)) - Visual connection indicator
- ✅ **Entry Point Integration** ([client/src/script.ts](client/src/script.ts)) - Automatic connection on app load
- ✅ **Comprehensive Tests** ([client/src/data/websocket.test.ts](client/src/data/websocket.test.ts)) - 12 passing tests

### Synchronized Operations

All shopping list modifications are now synchronized in real-time:

1. **Adding Items**:
   - If item is new → Sends `item:add` event
   - If item exists (quantity merge) → Sends `item:update` event
   - Server merges quantities for same item+date combinations

2. **Deleting Items**:
   - Sends `item:delete` event with item ID
   - All connected clients remove the item immediately

3. **Updating Items**:
   - **Quantity changes** (re-adding with new quantity) → `item:update` event
   - **Department assignment** (Edit button) → `item:update` event
   - Uses optimized `updateItem()` method to avoid unnecessary API calls

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
│                   WebSocket Layer                           │
│                                                             │
│   data/websocket.ts ──────> State Layer                     │
│   - Connection management    - shopping-list-state          │
│   - Event handling           - store-state                  │
│   - Reconnection logic       - user-state                   │
│                                                             │
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

// Event Subscriptions - Shopping List
export function onItemAdded(callback: (item: Item) => void): () => void;
export function onItemDeleted(callback: (itemId: string) => void): () => void;
export function onItemUpdated(callback: (item: Item) => void): () => void;

// Event Subscriptions - Products ✨ NEW
export function onProductAdded(callback: (product: Product) => void): () => void;
export function onProductUpdated(callback: (product: Product) => void): () => void;
export function onProductDeleted(callback: (data: { id: number }) => void): () => void;

// Event Subscriptions - Stores & Departments ✨ NEW
export function onStoreChanged(callback: (store: Store) => void): () => void;
export function onStoreAdded(callback: (store: Store) => void): () => void;
export function onStoreUpdated(callback: (store: Store) => void): () => void;
export function onStoreDeleted(callback: (data: { id: number }) => void): () => void;
export function onDepartmentAdded(callback: (department: Department) => void): () => void;
export function onDepartmentUpdated(callback: (department: Department) => void): () => void;
export function onDepartmentDeleted(callback: (data: { id: number }) => void): () => void;

// Event Subscriptions - Templates ✨ NEW
export function onTemplateAdded(callback: (template: Template) => void): () => void;
export function onTemplateUpdated(callback: (template: Template) => void): () => void;
export function onTemplateDeleted(callback: (data: { id: number }) => void): () => void;

// Event Subscriptions - Weekplan
export function onWeekplanAdded(callback: (data: any) => void): () => void;
export function onWeekplanDeleted(callback: (data: { id: number }) => void): () => void;

// Event Subscriptions - Users
export function onUserJoined(callback: (user: User) => void): () => void;
export function onUserLeft(callback: (userId: number) => void): () => void;
export function onActiveUserCount(callback: (data: { count: number }) => void): () => void;

// Event Subscriptions - Connection
export function onConnectionOpen(callback: () => void): () => void;
export function onConnectionClose(callback: (event: { code: number; reason: string }) => void): () => void;
export function onConnectionError(callback: (error: Event) => void): () => void;

// Send Events
export function broadcastItemAdd(item: Item): void;
export function broadcastItemDelete(itemId: string): void;
export function broadcastItemUpdate(item: Item): void;
export function broadcastWeekplanAdd(entry: WeekplanEntry): void;
export function broadcastWeekplanDelete(entryId: number): void;
```

**Features**:
- **Auto-Reconnection**: Exponential backoff strategy for connection failures
- **Heartbeat**: Ping/pong messages to detect stale connections
- **Message Queue**: Buffer messages during disconnection, replay on reconnect
- **Event Namespacing**: Separate channels for items, stores, users
- **Error Handling**: Graceful degradation to polling if WebSocket unavailable
- **Authentication**: JWT token in WebSocket handshake

#### 2. State Layer Integration ✨ EXPANDED

**All State Modules Now Have WebSocket Integration**:

**shopping-list-state.ts** (Existing):
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

websocket.onItemUpdated((item) => {
  // Update item in local state
  const index = state.items.findIndex(i => i.id === item.id);
  if (index !== -1) {
    state.items[index] = item;
    notifyListeners();
  }
});

websocket.onDepartmentUpdated(() => {
  // Reload items to get updated department information
  loadItems();
});

export async function addItem(name: string, menge?: string, ...) {
  const item = await api.addItem(name, menge, ...);
  // Broadcast to other users via WebSocket
  if (websocket.isConnected()) {
    websocket.broadcastItemAdd(item);
  }
  return item;
}
```

**product-admin-state.ts** ✨ NEW:
```typescript
import * as websocket from '../data/websocket.js';

class ProductAdminState {
  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    // Subscribe to product events
    websocket.onProductAdded((product) => {
      if (this.state.selectedStoreId && product.store_id === this.state.selectedStoreId) {
        this.state.products.push(product);
        this.applyFilter();
        this.notifyListeners();
      }
    });

    websocket.onProductUpdated((product) => {
      const index = this.state.products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        this.state.products[index] = product;
        this.applyFilter();
        this.notifyListeners();
      }
    });

    websocket.onProductDeleted((data) => {
      this.state.products = this.state.products.filter(p => p.id !== data.id);
      this.applyFilter();
      this.notifyListeners();
    });

    // Subscribe to department and store events
    websocket.onDepartmentAdded((department) => { /* ... */ });
    websocket.onDepartmentUpdated((department) => { /* ... */ });
    websocket.onDepartmentDeleted((data) => { /* ... */ });
    websocket.onStoreAdded((store) => { /* ... */ });
    websocket.onStoreUpdated((store) => { /* ... */ });
    websocket.onStoreDeleted((data) => { /* ... */ });
  }
}
```

**store-admin-state.ts** ✨ NEW:
```typescript
import * as websocket from '../data/websocket.js';

class StoreAdminState {
  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    websocket.onStoreAdded((store) => {
      if (!this.state.stores.find(s => s.id === store.id)) {
        this.state.stores.push(store);
        this.notifyListeners();
      }
    });

    websocket.onStoreUpdated((store) => {
      const index = this.state.stores.findIndex(s => s.id === store.id);
      if (index !== -1) {
        this.state.stores[index] = store;
        this.notifyListeners();
      }
    });

    websocket.onStoreDeleted((data) => {
      this.state.stores = this.state.stores.filter(s => s.id !== data.id);
      this.notifyListeners();
    });

    websocket.onDepartmentAdded((department) => {
      const store = this.state.stores.find(s => s.id === department.store_id);
      if (store?.departments) {
        store.departments.push(department);
        this.notifyListeners();
      }
    });

    // ... similar for onDepartmentUpdated, onDepartmentDeleted
  }
}
```

**template-admin-state.ts** ✨ NEW:
```typescript
import * as websocket from '../data/websocket.js';

class TemplateAdminState {
  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    websocket.onTemplateAdded((template) => {
      if (!this.state.templates.find(t => t.id === template.id)) {
        this.state.templates.push(template);
        this.applyFilter();
        this.notifyListeners();
      }
    });

    websocket.onTemplateUpdated((template) => {
      const index = this.state.templates.findIndex(t => t.id === template.id);
      if (index !== -1) {
        this.state.templates[index] = template;
        this.applyFilter();
        this.notifyListeners();
      }
    });

    websocket.onTemplateDeleted((data) => {
      this.state.templates = this.state.templates.filter(t => t.id !== data.id);
      this.applyFilter();
      this.notifyListeners();
    });
  }
}
```

**Benefits**:
- ✅ State layer remains single source of truth across all admin pages
- ✅ UI automatically updates via existing Observer pattern
- ✅ No changes needed to UI Layer - subscriptions handle everything
- ✅ Separation of concerns maintained
- ✅ Consistent pattern across all state modules
- ✅ Real-time synchronization for shopping-list, products, stores, templates, and weekplan
- ✅ Feature flag support via `localStorage.setItem('enable_ws', 'true')`

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
  type: 'item:add' | 'item:delete' | 'item:update' |
        'weekplan:add' | 'weekplan:delete' |
        'product:add' | 'product:update' | 'product:delete' |
        'store:add' | 'store:update' | 'store:delete' |
        'department:add' | 'department:update' | 'department:delete' |
        'template:add' | 'template:update' | 'template:delete' |
        'ping',
  data: { ... },
  timestamp?: string
}

// Server → Client
{
  type: 'item:added' | 'item:deleted' | 'item:updated' |
        'weekplan:added' | 'weekplan:deleted' |
        'product:added' | 'product:updated' | 'product:deleted' |
        'store:added' | 'store:updated' | 'store:deleted' |
        'department:added' | 'department:updated' | 'department:deleted' |
        'template:added' | 'template:updated' | 'template:deleted' |
        'store:changed' | 'user:joined' | 'user:left' |
        'users:active_count' | 'pong',
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

### WebSocket Implementation Summary

**Current Status**: ✅ **COMPLETE** - All admin pages now have unified WebSocket integration

**Pages with WebSocket Integration**:
1. ✅ **Shopping List** - Real-time item synchronization (original implementation)
2. ✅ **Weekplan** - Real-time weekplan entry synchronization
3. ✅ **Product Admin** - Real-time product updates (NEW)
4. ✅ **Store Admin** - Real-time store and department updates (NEW)
5. ✅ **Template Admin** - Real-time template updates (NEW)

**State Managers with WebSocket**:
- `shopping-list-state.ts` - Manages shopping list items
- `product-admin-state.ts` - Manages products, stores, departments with filtering
- `store-admin-state.ts` - Manages stores with embedded departments
- `template-admin-state.ts` - Manages templates with filtering

**Unified Architecture Pattern**:
1. **State Layer Integration**: All state managers follow Observer pattern
2. **WebSocket Initialization**: Entry points (script-*.ts) initialize WebSocket on load
3. **Feature Flag Support**: `localStorage.getItem('enable_ws') === 'true'`
4. **Event Subscriptions**: State constructors subscribe to WebSocket events
5. **Automatic UI Updates**: State changes trigger UI re-rendering via subscriptions
6. **No UI Changes Required**: WebSocket integration is transparent to UI layer

**WebSocket Events Supported**:
- **Items**: `item:added`, `item:updated`, `item:deleted`
- **Weekplan**: `weekplan:added`, `weekplan:deleted`
- **Products**: `product:added`, `product:updated`, `product:deleted`
- **Stores**: `store:added`, `store:updated`, `store:deleted`
- **Departments**: `department:added`, `department:updated`, `department:deleted`
- **Templates**: `template:added`, `template:updated`, `template:deleted`

**Key Files Created/Modified**:
- `client/src/state/product-admin-state.ts` (NEW - 300+ lines)
- `client/src/state/store-admin-state.ts` (NEW - 180 lines)
- `client/src/state/template-admin-state.ts` (NEW - 180 lines)
- `client/src/data/websocket/subscriptions.ts` (EXTENDED with new events)
- `client/src/script-products.ts` (MODIFIED - WebSocket initialization)
- `client/src/script-stores.ts` (MODIFIED - WebSocket initialization)
- `client/src/script-templates.ts` (MODIFIED - WebSocket initialization)
- `client/src/ui/product-admin/init.ts` (REFACTORED - State integration)
- `client/src/ui/product-admin/rendering.ts` (REFACTORED - State integration)
- `client/src/ui/product-admin/event-handlers.ts` (REFACTORED - State integration)
- `client/src/ui/store-admin.ts` (REFACTORED - State integration)
- `client/src/ui/template-admin/render-templates.ts` (REFACTORED - State integration)

**Implementation Consistency**:
All admin pages now follow the same state-based WebSocket pattern established by shopping-list, ensuring:
- Consistent architecture across the application
- Predictable behavior for developers
- Easy maintenance and debugging
- Scalable pattern for future features

### Product Manufacturer Field ✅ IMPLEMENTED

**Status**: ✅ **FULLY IMPLEMENTED** - Optional manufacturer designation for products

**Overview**:
Products can now have an optional manufacturer-specific designation (e.g., "Harry's Dinkelkrüstchen" instead of generic "Brötchen"). This field automatically propagates to shopping list items and is preferred when printing shopping lists.

**Implementation Details**:

**Database** ([server/migrations/003_add_manufacturer_to_product.py](server/migrations/003_add_manufacturer_to_product.py)):
- Added `manufacturer VARCHAR NULL` column to `product` table
- Added `manufacturer VARCHAR NULL` column to `item` table
- Migration executed successfully with backward compatibility

**Backend** (Python/FastAPI):
- **Models** ([server/src/models.py](server/src/models.py)): `Product.manufacturer` and `Item.manufacturer` fields
- **Schemas** ([server/src/schemas.py](server/src/schemas.py)): ProductCreate, ProductUpdate, ItemWithDepartment schemas
- **Products Router** ([server/src/routers/products.py](server/src/routers/products.py)):
  - `create_product()`: Saves manufacturer and propagates to linked items
  - `update_product()`: Auto-updates all associated items when product manufacturer changes
  - WebSocket broadcasts for real-time manufacturer updates
- **Items Router** ([server/src/routers/items.py](server/src/routers/items.py)): Automatic item enrichment with manufacturer from matched products

**Frontend** (TypeScript):
- **Types** ([client/src/data/api/types.ts](client/src/data/api/types.ts)): `Item.manufacturer` and `Product.manufacturer` optional fields
- **API Client** ([client/src/data/api/products-api.ts](client/src/data/api/products-api.ts)):
  - `createProduct(name, storeId, departmentId, fresh?, manufacturer?)`
  - `updateProduct(productId, updates)` - supports manufacturer in updates object
- **Product Admin UI**:
  - [rendering.ts](client/src/ui/product-admin/rendering.ts): Manufacturer input field in product form
  - [event-handlers.ts](client/src/ui/product-admin/event-handlers.ts): Manufacturer save/update logic
- **Print Rendering** ([client/src/ui/shopping-list/print-rendering.ts](client/src/ui/shopping-list/print-rendering.ts)): **Prefers manufacturer over item.name**

**Behavior**:
- **Product Admin**: Optional text field "Produktbezeichnung (optional, z.B. 'Harry's Dinkelkrüstchen')"
- **Shopping List**: Items automatically enriched with manufacturer when saved
- **Regular UI**: Continues displaying `item.name` (unchanged user experience)
- **Print View**: Displays `item.manufacturer || item.name` (manufacturer takes precedence)
- **Autocomplete**: Continues showing product names (not manufacturer)
- **Real-time Updates**: Changes to product manufacturer auto-update all linked items via WebSocket
- **Backward Compatible**: All fields optional, existing data works without changes

**Testing**:
- ✅ All 474 client tests passing (including [product-admin.test.ts](client/src/ui/product-admin.test.ts))
- ✅ All 101 server tests passing
- Test updated to expect 5th parameter in `createProduct()` calls

**Use Cases**:
- Generic product "Brötchen" → Manufacturer: "Harry's Dinkelkrüstchen"
- Generic product "Milch" → Manufacturer: "Weihenstephan Frische Vollmilch 3,5%"
- Generic product "Butter" → Manufacturer: "Kerrygold Original Irische Butter"

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

## Code Quality Metrics

### Complexity Analysis

A detailed complexity analysis is available in [complexity-report.md](complexity-report.md), generated using the command:

```bash
npm run complexity
```

The report includes:
- **Lines of Code**: Count of non-comment, non-empty lines per file
- **Function Count**: Total number of functions per file
- **Complexity Score**: Basic complexity metric based on control structures
- **Cyclomatic Complexity**: Measure of independent paths through code (decision points)
- **McCabe Complexity**: Extended cyclomatic complexity including function count

### Complexity Metrics Summary

- **Total files analyzed**: 68 TypeScript files (includes 13 API modules + 13 weekplan modules)
- **Total lines of code**: 13,071 lines
- **Total functions**: 628 functions
- **Average complexity**: 20.94 ⬇️ (was 25.44, originally 33.31)
- **Average cyclomatic complexity**: 21.84 ⬇️ (was 26.85, originally 35.17)
- **Average McCabe complexity**: 31.07 ⬇️ (was 37.87, originally 49.60)

### Complexity Ratings

According to McCabe Complexity thresholds:
- **1-10**: Simple, low risk
- **11-20**: More complex, moderate risk
- **21-50**: Complex, high risk
- **51+**: Very complex, very high risk

**Current distribution** (per [complexity-report.md](complexity-report.md)):
- **Total files**: 140
- **Average McCabe complexity**: 15.91 (down from previous highs)
- **Files with very high complexity (>50)**: 0 ✅ (down from 12+ before refactorings!)
- **Files with high complexity (21-50)**: 45
- **Files with moderate/low complexity**: 95 (68% of all files)
- **Note**: Refactorings successfully eliminated all files with McCabe >50, significantly improving maintainability

### Top 3 Most Complex Files (current)

1. **[src/data/api/stores-api.ts](src/data/api/stores-api.ts)**: McCabe 50, 239 lines
   - Store and department API operations

2. **[src/ui/shopping-list-ui.ts](src/ui/shopping-list-ui.ts)**: McCabe 49, 247 lines
   - Shopping list feature with event handling, state management, and modal dialogs

3. **[src/ui/user-admin.ts](src/ui/user-admin.ts)**: McCabe 48, 212 lines
   - User administration UI with CRUD operations

**Recent Refactoring Success** (9 files refactored):
- ✨ **api.ts**: McCabe 317 → 0 (re-exports, 13 modules)
- ✨ **weekplan.ts**: McCabe 251 → 35 (228 lines, 13 modules)
- ✨ **store-admin.ts**: 465 → 114 lines (-75%, 5 modules)
- ✨ **user-menu.ts**: 387 → 60 lines (-84%, 5 modules)
- ✨ **websocket.ts**: 401 → 43 lines (-90%, 9 modules)
- ✨ **store-state.ts**: 662 → 181 lines (-73%, 5 modules)
- ✨ **webdav-admin.ts**: 465 → 42 lines (-91%, 4 modules)
- ✨ **recipe-modal.ts**: 363 → 99 lines (-73%, 7 modules)
- ✨ **dropdown.ts**: 490 → 61 lines (-88%, 6 modules)

### Refactoring Success Stories

#### 1. api.ts Modular Refactoring (Completed)
- **Before**: Single file with 1,722 lines, McCabe 317, Cyclomatic 265
- **After**: 13 focused modules with McCabe ranging from 6-50
- **Result**:
  - Eliminated the highest complexity file in the codebase
  - Average module complexity: ~25 McCabe (manageable range)
  - Maintained full backward compatibility
  - Improved code organization and maintainability

**API Modules** (all McCabe < 51):
- types.ts (22), utils.ts (6), items-api.ts (43), stores-api.ts (50)
- products-api.ts (39), users-api.ts (23), templates-api.ts (42)
- weekplan-api.ts (35), recipes-api.ts (7), backup-api.ts (17)
- webdav-api.ts (27), config-api.ts (6), index.ts (0)

#### 2. weekplan.ts Modular Refactoring (Completed)
- **Before**: Single file with ~850 lines, McCabe 251, Cyclomatic 165
- **After**: Main file 228 lines (McCabe 35, Cyclomatic 22) + 13 focused modules
- **Result**:
  - Reduced main file by 73%
  - Moved from "very high complexity" to "high complexity" (manageable)
  - Average module complexity: ~20 McCabe (moderate range)
  - Maintained full backward compatibility
  - All features preserved through modular composition

**Weekplan Modules** (all McCabe < 54):
- types.ts (0), weekplan-state.ts (26), weekplan-utils.ts (11)
- weekplan-navigation.ts (6), weekplan-websocket.ts (10), weekplan-print.ts (6)
- weekplan-rendering.ts (10), entry-input.ts (29)
- ingredient-parser/ (modularized - see below)
- template-modal.ts (42), recipe-modal.ts (53), modal-shared.ts (28)
- index.ts (2)

### Refactoring Opportunities

**Current Status**: ✅ **All files now have McCabe ≤50!** Great achievement through systematic refactoring.

Remaining refactoring candidates (by priority, based on current complexity-report.md):
- **stores-api.ts** (McCabe 50, 239 lines): Right at threshold, could benefit from splitting store and department operations
- **shopping-list-ui.ts** (McCabe 49, 247 lines): Extract modal dialogs and event handlers into separate modules
- **user-admin.ts** (McCabe 48, 212 lines): Consider splitting form management from rendering logic
- **items-api.ts** (McCabe 43, 198 lines): Split into smaller focused modules if it grows
- **product-admin** modules (already refactored but event-handlers.ts has McCabe 43): Monitor for further splitting if needed
- **template-admin** modules (already refactored but render-templates.ts has McCabe 41): Monitor for further splitting if needed

**Completed Refactorings**:
- ~~**api.ts** (McCabe 317)~~ ✅ Refactored into 13 modules
- ~~**weekplan.ts** (McCabe 251)~~ ✅ Refactored into 13 modules
- ~~**store-admin.ts** (465 lines)~~ ✅ Refactored into 5 modules → 114 lines (-75%)
- ~~**user-menu.ts** (387 lines)~~ ✅ Refactored into 5 modules → 60 lines (-84%)
- ~~**websocket.ts** (401 lines)~~ ✅ Refactored into 9 modules → 43 lines (-90%)
- ~~**store-state.ts** (662 lines)~~ ✅ Refactored into 5 modules → 181 lines (-73%)
- ~~**webdav-admin.ts** (465 lines)~~ ✅ Refactored into 4 modules → 42 lines (-91%)
- ~~**recipe-modal.ts** (363 lines)~~ ✅ Refactored into 7 modules → 99 lines (-73%)
- ~~**dropdown.ts** (490 lines)~~ ✅ Refactored into 6 modules → 61 lines (-88%)
- ~~**ingredient-parser.ts** (231 lines, McCabe 60)~~ ✅ Refactored into 7 modules → 8 lines re-export (-97%)

**Refactoring Summary** (10 recent refactorings):
- **Total reduction**: 3,464 → 608 lines (-82%)
- **Pattern**: Extract modular responsibilities into subdirectories
- **Maintained**: Full backward compatibility and type safety
- **Result**: Improved maintainability, reduced complexity, easier testing

#### 3. ingredient-parser Modular Refactoring (Completed)
- **Before**: Single file with 231 lines, McCabe 60
- **After**: Main re-export 8 lines + 7 focused modules (max McCabe 26)
- **Result**:
  - Reduced complexity by 57% (McCabe 60 → 26 max)
  - Average module complexity: ~8.6 McCabe (low range)
  - Maintained full backward compatibility
  - Improved code organization with clear separation of concerns

**Ingredient Parser Modules** (all McCabe ≤ 26):
- index.ts (0), constants.ts (0), fraction-converter.ts (9)
- formatters.ts (7), parsers.ts (26), ingredient-parser.ts (13)
- quantity-parser.ts (5)

### Maintaining Code Quality

To monitor code quality over time:
1. Run `npm run complexity` after significant changes
2. Compare metrics with previous reports
3. Address increases in complexity before they accumulate
4. Consider breaking down files with McCabe >100

---

## References

- [TypeScript Configuration](tsconfig.json)
- [Jest Configuration](jest.config.js)
- [Complexity Report](complexity-report.md)
- [Main README](README.md)
- [Project Root README](../README.md)
