# State Layer

📚 [Back to Main](../ARCHITECTURE.md) | [← Data Layer](02-data-layer.md) | [Next: UI Layer →](04-ui-layer.md)

## State Layer (`src/state/`)

**Purpose**: Centralized state management with reactive updates.

**Modules**:

### shopping-list-state.ts

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

### user-state.ts

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

### store-state.ts ✨ REFACTORED

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

### product-admin-state.ts ✨ NEW

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

### store-admin-state.ts ✨ NEW

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

### template-admin-state.ts ✨ NEW

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

## Testing

- `shopping-list-state.test.ts`: 35 tests covering state management, subscriptions, and API integration
- `user-state.test.ts`: 24 tests covering user state, subscriptions, and error handling
- `store-state.test.ts`: 34 tests covering stores, departments, products, selections, and immutability
- **Total**: 93 tests for state layer

## Principles

- ✅ Single source of truth for application state
- ✅ Observer pattern for reactive updates
- ✅ Immutable state (returns copies, not references)
- ✅ Loading state tracking for UX
- ✅ No direct UI manipulation
- ✅ WebSocket integration for real-time synchronization (shopping-list, product-admin, store-admin, template-admin)

**See also**: [STATE_LAYER.md](../STATE_LAYER.md) for detailed state layer documentation.

---

📚 [Back to Main](../ARCHITECTURE.md) | [← Data Layer](02-data-layer.md) | [Next: UI Layer →](04-ui-layer.md)
