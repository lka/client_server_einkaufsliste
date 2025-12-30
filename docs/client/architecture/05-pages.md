# Pages Layer & Entry Points

📚 [Back to Main](../ARCHITECTURE.md) | [← UI Layer](04-ui-layer.md) | [Next: Detailed Modules →](06-modules.md)

## Pages Layer (`src/pages/`)

**Purpose**: Page controllers and HTML templates.

**Modules**:

### login.ts

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

### login.html

- **Responsibility**: Login page HTML template
- **Contains**: Login and registration forms

### app.html

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

## Entry Points (`src/`)

**Purpose**: Application initialization and orchestration.

**Modules**:

### script.ts

- **Responsibility**: Main app entry point
- **Flow**:
  1. Check authentication
  2. Load app template
  3. Update user display
  4. Initialize UI modules (shopping list, user menu)
- **Dependencies**:
  - `./data/dom.js`, `./data/auth.js`
  - `./ui/shopping-list-ui.js`, `./ui/user-menu.js`

### index-login.ts

- **Responsibility**: Login page entry point
- **Flow**:
  1. Initialize login page controller
- **Dependencies**: `./pages/login.js`

### script-stores.ts

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

### script-products.ts

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

### script-templates.ts

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

### script-users.ts

- **Responsibility**: User admin page entry point
- **Similar flow to script-stores.ts**
- **Dependencies**: `./ui/user-admin.js`

### script-weekplan.ts

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
  api.test.ts
  auth.ts
  auth.test.ts
  ...
```

---

📚 [Back to Main](../ARCHITECTURE.md) | [← UI Layer](04-ui-layer.md) | [Next: Detailed Modules →](06-modules.md)
