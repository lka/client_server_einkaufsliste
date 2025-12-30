# Data Layer

📚 [Back to Main](../ARCHITECTURE.md) | [← Overview](01-overview.md) | [Next: State Layer →](03-state-layer.md)

## Data Layer (`src/data/`)

**Purpose**: Core data operations and utilities with no UI knowledge.

**Modules**:

### api.ts (Refactored - Modular Architecture)

- **Status**: ✨ **REFACTORED** - Reduced from 1,722 lines (McCabe: 317) to modular structure
- **Responsibility**: Barrel file that re-exports all API functionality from modular `api/` directory
- **Architecture**: All API operations split into focused modules for better maintainability
- **Backward Compatibility**: Existing imports continue to work without changes

**Modular Structure** (`src/data/api/`):

#### api/types.ts

- **Lines**: 125 | **McCabe**: 22
- **Responsibility**: Shared TypeScript interfaces and constants
- **Exports**: All type definitions and API endpoint constants
- **Interfaces**: `Item`, `Store`, `Department`, `Product`, `User`, `Template`, `TemplateItem`, `DeltaItem`, `WeekplanDeltas`, `WeekplanEntry`, `BackupData`, `RestoreResult`, `VersionInfo`, `Config`, `WebDAVSettings`, `ProductSuggestion`
- **Constants**: API endpoint URLs (API_BASE, API_STORES, API_USERS, API_TEMPLATES, etc.)

#### api/utils.ts

- **Lines**: 40 | **McCabe**: 6
- **Responsibility**: Shared authentication and HTTP utilities
- **Functions**:
  - `getAuthHeaders()`: Generate auth headers with JWT token
  - `handleUnauthorized()`: Clear token and redirect to login
  - `ensureFreshToken()`: Refresh token before API calls

#### api/items-api.ts

- **Lines**: 198 | **McCabe**: 43
- **Responsibility**: Shopping list items operations
- **Functions**:
  - `fetchItems()`: Get all shopping list items
  - `fetchItemsByDate(shoppingDate)`: Get items for specific date
  - `addItem(name, menge?, storeId?, shoppingDate?)`: Add new item
  - `deleteItem(id)`: Remove an item
  - `deleteItemsBeforeDate(beforeDate, storeId?)`: Bulk delete by date
  - `convertItemToProduct(itemId, departmentId)`: Convert to product

#### api/stores-api.ts

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

#### api/products-api.ts

- **Lines**: 225 | **McCabe**: 39
- **Responsibility**: Product catalog operations
- **Functions**:
  - `getProductSuggestions(storeId, query, limit?)`: Autocomplete suggestions
  - `fetchStoreProducts(storeId)`: Get all products for store
  - `fetchDepartmentProducts(departmentId)`: Get products by department
  - `createProduct(name, storeId, departmentId, fresh?, manufacturer?)`: Create product with optional manufacturer designation
  - `updateProduct(productId, updates)`: Update product (supports name, storeId, departmentId, fresh, manufacturer)
  - `deleteProduct(productId)`: Delete product

#### api/users-api.ts

- **Lines**: 114 | **McCabe**: 23
- **Responsibility**: User management operations
- **Functions**:
  - `fetchAllUsers()`: Get all users
  - `fetchPendingUsers()`: Get unapproved users
  - `approveUser(userId)`: Approve pending user
  - `deleteUser(userId)`: Delete user account

#### api/templates-api.ts

- **Lines**: 168 | **McCabe**: 42
- **Responsibility**: Shopping template operations
- **Functions**:
  - `fetchTemplates()`: Get all templates
  - `fetchTemplate(templateId)`: Get specific template
  - `createTemplate(name, description?, personCount, items)`: Create template
  - `updateTemplate(templateId, name?, description?, personCount?, items?)`: Update template
  - `deleteTemplate(templateId)`: Delete template

#### api/weekplan-api.ts

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

#### api/recipes-api.ts

- **Lines**: 53 | **McCabe**: 7
- **Responsibility**: Recipe search and retrieval
- **Functions**:
  - `searchRecipes(query, limit?)`: Search recipes by name
    - Returns: `Promise<Array<{id: number, name: string}>>`
    - Limit default: 10
  - `getRecipe(recipeId)`: Get recipe details by ID
    - Returns: `Promise<Recipe>` with full recipe data

#### api/backup-api.ts

- **Lines**: 74 | **McCabe**: 17
- **Responsibility**: Database backup and restore
- **Functions**:
  - `createBackup()`: Create database backup (returns JSON)
  - `restoreBackup(backupData, clearExisting?)`: Restore from backup

#### api/webdav-api.ts

- **Lines**: 150 | **McCabe**: 27
- **Responsibility**: WebDAV settings and recipe import
- **Functions**:
  - `fetchWebDAVSettings()`: Get all WebDAV settings
  - `createWebDAVSettings(settings)`: Create new settings
  - `updateWebDAVSettings(id, settings)`: Update settings
  - `deleteWebDAVSettings(id)`: Delete settings
  - `importRecipesFromWebDAV(settingsId)`: Trigger recipe import
    - Returns: `Promise<{success: boolean, imported: number, deleted: number, errors: string[], message: string}>`

#### api/config-api.ts

- **Lines**: 43 | **McCabe**: 6
- **Responsibility**: Server configuration and version info
- **Functions**:
  - `getVersion()`: Get application version (no auth required)
  - `getConfig()`: Get server configuration (no auth required)

#### api/index.ts

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

### auth.ts

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

### dom.ts

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

### websocket.ts ✨ REFACTORED

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

### inactivity-tracker.ts

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

## Testing

- `api.test.ts`: 18 tests covering all API operations, 401 handling, and edge cases (100% coverage)
- `auth.test.ts`: 36 tests covering authentication, token management, and refresh optimization (100% coverage)
- `dom.test.ts`: 14 tests for DOM manipulation, rendering, template caching, and batching (98% coverage)
- `websocket.test.ts`: 12 tests for WebSocket connection, events, and reconnection (100% coverage)
- **Total**: 80 tests, 99%+ coverage

## Principles

- ✅ No direct DOM manipulation for UI features
- ✅ Pure functions where possible
- ✅ Clear, single-purpose modules
- ✅ Comprehensive error handling

---

📚 [Back to Main](../ARCHITECTURE.md) | [← Overview](01-overview.md) | [Next: State Layer →](03-state-layer.md)
