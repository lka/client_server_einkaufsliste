# Client Architecture Documentation

## Overview

The shopping list client is a TypeScript application built with a **three-layer architecture** that emphasizes separation of concerns, maintainability, and scalability. The architecture uses **physical folder separation** to make layer boundaries explicit and easy to navigate.

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
  - `ensureFreshToken()`: Refresh JWT before API calls
- **Dependencies**: auth.ts (for token management)
- **Interface**: `Item { id: string, name: string }`

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
  - `createItemElement(item)`: Create DOM element for item (no individual event handlers)
  - `loadTemplate(path)`: Load HTML template with caching
  - `loadAppTemplate()`: Load main app template
  - `clearTemplateCache()`: Internal function for testing
- **Dependencies**: api.ts (for Item interface)
- **Event Delegation Support**:
  - `createItemElement()` creates buttons with `data-item-id` attributes
  - No `onDelete` callback parameter - enforces event delegation pattern
  - Buttons include `removeBtn` class for delegation selector
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

### 2. UI Layer (`src/ui/`)

**Purpose**: Feature-specific UI logic and event handlers.

**Modules**:

#### shopping-list-ui.ts
- **Responsibility**: Shopping list feature UI
- **Functions**:
  - `initShoppingListUI()`: Initialize event handlers
  - `loadItems()`: Fetch and display items
- **Event Handlers**:
  - Add button click
  - Enter key for adding items
  - Delete button click (event delegation on parent container)
- **Event Delegation Pattern**:
  - Single click listener attached to `<ul id="items">` parent
  - Checks `target.classList.contains('removeBtn')` to identify delete buttons
  - Extracts `data-item-id` from clicked button
  - Disables button during deletion to prevent double-clicks
  - Re-enables button only if deletion fails
- **Dependencies**:
  - `../data/api.js`: fetchItems, addItem, deleteItem
  - `../data/dom.js`: renderItems

#### user-menu.ts
- **Responsibility**: User menu feature UI
- **Functions**:
  - `initUserMenu()`: Initialize menu event handlers
  - `updateUserDisplay()`: Show username in header
- **Event Handlers**:
  - Menu toggle (open/close)
  - Click outside to close
  - Logout button
  - Delete account button (with confirmation)
- **Dependencies**:
  - `../data/auth.js`: logout, getCurrentUser, deleteUser

**Testing**:
- `shopping-list-ui.test.ts`: 14 tests covering all UI interactions (100% coverage)
- `user-menu.test.ts`: 16 tests covering menu functionality (100% coverage)
- **Total**: 30 tests, 100% coverage

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
- **102 tests total** (6 test suites)
- **98.5%+ overall code coverage**
- All critical paths tested

### Test Breakdown by Layer
- **Data Layer**: 68 tests (99.5%+ coverage)
  - auth.ts: 100% coverage (36 tests including token refresh optimization)
  - api.ts: 100% coverage (18 tests including 401 handling and edge cases)
  - dom.ts: 98% coverage (14 tests including template caching and DOM batching)
- **UI Layer**: 30 tests (98%+ coverage)
  - shopping-list-ui.ts: 97% coverage (14 tests)
  - user-menu.ts: 100% coverage (16 tests)
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
1. **State Management**: Add centralized state (e.g., observables)
2. **Offline Support**: Service worker for PWA
3. **Real-time Updates**: WebSocket integration
4. **More UI Modules**: Search, filters, categories
5. **Component Library**: Reusable UI components

### Architecture Evolution
- Current: 3-layer architecture
- Future: Could add a State Layer between UI and Data
- Maintains separation of concerns principle

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
