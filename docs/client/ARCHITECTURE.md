# Client Architecture Documentation

> **📚 Alle Dokumentationen:** Siehe [Dokumentations-Index](../INDEX.md)

## Table of Contents

### Quick Navigation

1. **[Overview](architecture/01-overview.md)** - Architecture overview, diagram, and layer introductions
2. **[Data Layer](architecture/02-data-layer.md)** - API modules, authentication, WebSocket, utilities
3. **[State Layer](architecture/03-state-layer.md)** - Centralized state management with reactive updates
4. **[UI Layer](architecture/04-ui-layer.md)** - Component library and feature UI modules
5. **[Pages & Entry Points](architecture/05-pages.md)** - Page controllers and application entry points
6. **[Detailed Modules](architecture/06-modules.md)** - Weekplan modules deep-dive
7. **[Refactoring](architecture/07-refactoring.md)** - Success stories and opportunities
8. **[Code Quality & Testing](architecture/08-code-quality.md)** - Metrics, testing strategy, performance

---

## Quick Reference

### Architecture at a Glance

The shopping list client is a TypeScript application built with a **four-layer architecture**:

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
│         - Page controllers                                  │
│         - Feature-specific UI logic                         │
│         - Event handlers                                    │
│         - Subscribe to state changes                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE LAYER                            │
│         - Centralized state management                      │
│         - Observer pattern for reactive updates             │
│         - Single source of truth with CRUD operations       │
│         - WebSocket integration for real-time sync          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│         - Pure data operations                              │
│         - No UI knowledge                                   │
│         - Reusable utilities                                │
│         - Modular, focused responsibilities                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

#### Dependency Rules

**Allowed:**
```
Entry Points → Pages Layer ✓
Entry Points → UI Layer ✓
Entry Points → Data Layer ✓
Pages Layer → UI Layer ✓
Pages Layer → Data Layer ✓
UI Layer → Data Layer ✓
UI Layer → State Layer ✓
State Layer → Data Layer ✓
```

**Forbidden:**
```
Data Layer → UI/State/Pages/Entry ✗
State Layer → UI/Pages/Entry ✗
UI Layer → Pages/Entry ✗
Pages Layer → Entry ✗
```

**Rule**: Dependencies flow downward only. Lower layers never import from higher layers.

---

## Layers Overview

### 1. Data Layer (`src/data/`)

**Purpose**: Core data operations and utilities with no UI knowledge.

**Key Modules**:
- **api/** - 13 modular API modules (McCabe: 6-43)
  - **stores-api/** ✨ REFACTORED - Store and department operations (2 modules)
  - **webdav-api/** ✨ REFACTORED - WebDAV settings and recipe import (2 modules)
- **auth.ts** - JWT authentication and user management
- **websocket.ts** ✨ REFACTORED - Real-time WebSocket connection (9 modules)
- **dom.ts** - DOM manipulation and template loading
- **inactivity-tracker.ts** - Auto-logout on timeout

**[→ Full Documentation](architecture/02-data-layer.md)**

### 2. State Layer (`src/state/`)

**Purpose**: Centralized state management with reactive updates.

**Key Modules**:
- **shopping-list-state.ts** - Shopping list items state
- **user-state.ts** - Current user state
- **store-state.ts** ✨ REFACTORED - Stores, departments, products (5 modules)
- **product-admin-state.ts** ✨ NEW - Product administration with WebSocket
- **store-admin-state.ts** ✨ NEW - Store administration with WebSocket
- **template-admin-state.ts** ✨ NEW - Template management with WebSocket

**Pattern**: Observer pattern for reactive UI updates

**[→ Full Documentation](architecture/03-state-layer.md)**

### 3. UI Layer (`src/ui/`)

**Purpose**: Feature-specific UI logic, event handlers, and reusable components.

#### Component Library (`src/ui/components/`)

9 reusable components with consistent styling:
- **Button** - Variants, sizes, loading states
- **Modal** - Full-featured dialog component
- **Card** - Container with header/body/footer
- **Input** - Form inputs with validation
- **Loading** - Spinners and skeleton loaders
- **Dropdown** ✨ REFACTORED - Native and searchable (6 modules)
- **Tabs** - Tab navigation component
- **Toast** - Notification system (replaces all alert() calls)
- **DatePicker** - Calendar component with German localization

#### Feature Modules

- **shopping-list-ui.ts** ✨ REFACTORED - Shopping list UI (3 modules: initialization, date-picker, events)
- **template-admin.ts** - Template management with filtering
- **user-menu.ts** ✨ REFACTORED - User menu orchestrator (5 modules)
- **product-admin.ts** - Product administration with real-time sync
- **store-admin.ts** ✨ REFACTORED - Store administration (5 modules)
- **weekplan.ts** ✨ REFACTORED - Meal planning (13 modules)
- **print-utils.ts** - Platform-specific printing

**[→ Full Documentation](architecture/04-ui-layer.md)**

### 4. Pages Layer (`src/pages/`)

**Purpose**: Page controllers and HTML templates.

**Modules**:
- **login.ts** / **login.html** - Login/registration page
- **app.html** - Main application shell

**[→ Full Documentation](architecture/05-pages.md)**

### 5. Entry Points (`src/`)

**Purpose**: Application initialization and orchestration.

**Files**:
- **script.ts** - Main app entry point
- **index-login.ts** - Login page entry point
- **script-stores.ts** - Store admin entry point
- **script-products.ts** - Product admin entry point
- **script-templates.ts** - Template admin entry point
- **script-weekplan.ts** - Weekplan entry point
- And more...

**[→ Full Documentation](architecture/05-pages.md)**

---

## Important Concepts

### Observer Pattern for State

All state modules use the observer pattern for reactive updates:

```typescript
// State module exposes subscribe()
import { subscribe, loadItems } from './state/shopping-list-state.js';

// UI subscribes to state changes
const unsubscribe = subscribe(() => {
  const items = getItems();
  renderItems(items);  // Auto-update UI
});

// Any state change triggers subscribers
await loadItems();  // → Automatically re-renders UI
```

### Event Delegation

UI uses event delegation for efficient event handling:

```typescript
// Single listener on parent element
itemsList.addEventListener('click', async (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('removeBtn')) {
    const itemId = target.dataset.itemId;
    await deleteItem(itemId);
  }
});
```

### WebSocket Real-time Updates

WebSocket integration enables real-time collaboration:

- Auto-reconnection with exponential backoff
- Heartbeat ping/pong every 30 seconds
- Message queue during offline periods
- JWT authentication in WebSocket URL
- ConnectionStatus UI component

---

## File Structure Overview

```
client/src/
├── data/                    # Data Layer
│   ├── api/                 # 13 API modules
│   ├── auth.ts
│   ├── websocket/           # 9 WebSocket modules
│   ├── dom.ts
│   └── inactivity-tracker.ts
├── state/                   # State Layer
│   ├── shopping-list-state.ts
│   ├── user-state.ts
│   ├── store-state/         # 5 modules
│   ├── product-admin-state.ts
│   ├── store-admin-state.ts
│   └── template-admin-state.ts
├── ui/                      # UI Layer
│   ├── components/          # 9 components
│   │   ├── button.ts
│   │   ├── modal.ts
│   │   ├── dropdown/        # 6 modules
│   │   ├── toast.ts
│   │   └── ...
│   ├── shopping-list-ui.ts
│   ├── template-admin/      # 4 modules
│   ├── user-menu/           # 5 modules
│   ├── product-admin/       # 3 modules
│   ├── store-admin/         # 5 modules
│   ├── weekplan/            # 13 modules
│   └── print-utils.ts
├── pages/                   # Pages Layer
│   ├── login.ts
│   ├── login.html
│   └── app.html
└── script*.ts               # Entry Points
```

---

## Recent Achievements

### Refactoring Success (10 major refactorings)

- **Total line reduction**: 3,464 → 608 lines (-82%)
- **Complexity reduction**: All files now have McCabe ≤50
- **Eliminated**: All very high complexity files (>50)
- **Pattern**: Extract modular responsibilities into subdirectories
- **Maintained**: Full backward compatibility and type safety

**[→ See Refactoring Details](architecture/07-refactoring.md)**

### Test Coverage

- **445 tests total** across 19 test suites
- **85%+ overall code coverage**
- Data Layer: 99.5%+ coverage
- State Layer: 100% coverage
- UI Layer: 98%+ coverage
- Pages Layer: 100% coverage

**[→ See Testing Strategy](architecture/08-code-quality.md)**

### Code Quality Metrics

- **140 files analyzed**
- **Average McCabe complexity**: 15.91 (down from 49.60)
- **Files with very high complexity (>50)**: 0 ✅
- **Files with moderate/low complexity**: 95 (68%)

**[→ See Full Metrics](architecture/08-code-quality.md)**

---

## Next Steps

### For New Developers

1. Read [Overview](architecture/01-overview.md) to understand the architecture
2. Review [Data Layer](architecture/02-data-layer.md) to learn the API structure
3. Study [State Layer](architecture/03-state-layer.md) to understand state management
4. Explore [UI Layer](architecture/04-ui-layer.md) to see component library
5. Check [Code Quality](architecture/08-code-quality.md) for testing guidelines

### For Contributors

1. Follow the dependency rules (downward flow only)
2. Use state layer for centralized state management
3. Use component library for consistent UI
4. Write tests for new features (aim for 85%+ coverage)
5. Monitor complexity with `npm run complexity`
6. Keep McCabe complexity ≤50 per file

### For Architects

1. Review [Refactoring](architecture/07-refactoring.md) for improvement opportunities
2. Consider future enhancements in [Code Quality](architecture/08-code-quality.md)
3. Maintain modular architecture pattern
4. Ensure backward compatibility during refactorings

---

## Additional Resources

- [Dokumentations-Index](../INDEX.md) - All project documentation
- [Complexity Report](complexity-report.md) - Detailed complexity analysis
- [TypeScript Configuration](tsconfig.json)
- [Jest Configuration](jest.config.js)
- [Main README](README.md)
- [Project Root README](../../README.md)

---

**Last Updated**: 2025-12-30

**Architecture Version**: 4-layer (Data → State → UI → Pages)
