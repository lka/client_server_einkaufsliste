# Einkaufsliste Client (TypeScript)

> **📚 Alle Dokumentationen:** Siehe [Dokumentations-Index](../INDEX.md)

Shopping list client application written in TypeScript with **quantity support**.

## Overview

This client application has been migrated from vanilla JavaScript to TypeScript, providing enhanced type safety, better IDE support, and improved maintainability.

### Features

- ✅ **Mengenangaben**: Optional quantity field for each item (e.g., "500 g", "2 Stück")
- ✅ **Department Grouping**: Shopping list items grouped by store departments in column layout
- ✅ **Department Sorting**: Departments displayed in user-defined order (via store admin ↑↓ buttons)
- ✅ **Auto Product Matching**: Automatic fuzzy matching of items to product catalog (60% threshold)
- ✅ **Reactive State Management**: Observer pattern with automatic UI updates
- ✅ **Component Library**: Reusable UI components (Button, Modal, Card, Input, Loading)
- ✅ **Four-Layer Architecture**: Entry Points → UI → State → Data
- ✅ **Type Safety**: Full TypeScript with strict mode
- ✅ **451 Tests**: Comprehensive test coverage (98.5%)

## Setup

Install dependencies:

```bash
npm install
```

## Development

Build TypeScript to JavaScript:

```bash
npm run build
```

Watch mode for automatic compilation:

```bash
npm run watch
```

Clean build output:

```bash
npm run clean
```

## Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate code coverage report:

```bash
npm run test:coverage
```

### Test Suite

The client includes comprehensive unit tests across all layers:

**Data Layer Tests**:
- **api.test.ts** (88 tests): Complete API client coverage with token refresh, 401 handling, CRUD operations for items, stores, departments, and products
- **auth.test.ts** (36 tests): Authentication, token management, user operations, and token refresh optimization
- **dom.test.ts** (18 tests): DOM manipulation, rendering, template caching, DOM batching, **quantity display**, and **department grouping**

**State Layer Tests**:
- **shopping-list-state.test.ts** (36 tests): Shopping list state management, subscriptions, reactivity, and **quantity handling**
- **user-state.test.ts** (24 tests): User state management, loading, and deletion
- **store-state.test.ts** (34 tests): Store state management, subscriptions, store/department selection, immutability

**UI Layer Tests**:
- **shopping-list-ui.test.ts** (14 tests): Shopping list UI interactions, **quantity input**, **Modal component integration**, and store filtering (96% coverage)
- **user-menu.test.ts** (16 tests): User menu functionality and navigation (100% coverage)
- **store-admin.test.ts** (19 tests): Store admin UI, CRUD operations, **Modal confirmations**, **department reordering** (↑↓ buttons) (92.23% coverage)
- **product-admin.test.ts** (12 tests): Product admin UI, CRUD operations, **Modal confirmations** (86.29% coverage)
- **store-browser.test.ts** (6 tests): Store and product browsing interface (98.59% coverage)
- **user-admin.test.ts** (8 tests): User admin UI and management (100% coverage)
- **components/button.test.ts** (17 tests): Button component with variants, sizes, loading states (100% coverage)

**Pages Layer Tests**:
- **login.test.ts** (20 tests): Login/registration page controller

**Entry Points Tests**:
- **index-login.test.ts** (4 tests): Login page entry point initialization
- **script.test.ts** (7 tests): Main app entry point initialization, authentication flow, error handling
- **script-stores.test.ts** (9 tests): Store admin page entry point, authentication, template loading
- **script-products.test.ts** (9 tests): Products page entry point, authentication, template loading

**Total**: **451 tests**, all passing ✅

**Coverage**: **98.5% overall code coverage**
- Data Layer: api.ts (100%), auth.ts (97.14%), dom.ts (98.83%)
- State Layer: shopping-list-state.ts (100%), user-state.ts (100%), store-state.ts (96.61%)
- UI Layer: user-menu.ts (100%), store-browser.ts (98.59%), shopping-list-ui.ts (96%), store-admin.ts (92.23%), product-admin.ts (86.29%)
- Pages Layer: login.ts (100%)
- Entry Points: script.ts (100%), script-stores.ts (100%), script-products.ts (100%), index-login.ts (100%)

## Project Structure

```
client/
├── src/
│   ├── data/                    # Data Layer
│   │   ├── api.ts               # API client functions
│   │   ├── api.test.ts          # API tests (18 tests)
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── auth.test.ts         # Auth tests (36 tests)
│   │   ├── dom.ts               # DOM manipulation utilities
│   │   └── dom.test.ts          # DOM tests (14 tests)
│   ├── state/                   # State Layer
│   │   ├── shopping-list-state.ts      # Shopping list state manager
│   │   ├── shopping-list-state.test.ts # State tests (35 tests)
│   │   ├── user-state.ts               # User state manager
│   │   └── user-state.test.ts          # State tests (24 tests)
│   ├── ui/                      # UI Layer
│   │   ├── shopping-list-ui.ts  # Shopping list UI module
│   │   ├── shopping-list-ui.test.ts  # Shopping list tests (14 tests)
│   │   ├── user-menu.ts         # User menu module
│   │   └── user-menu.test.ts    # User menu tests (16 tests)
│   ├── pages/                   # Pages Layer
│   │   ├── login.ts             # Login page controller
│   │   ├── login.test.ts        # Login tests (20 tests)
│   │   ├── login.html           # Login template
│   │   └── app.html             # App template
│   ├── script.ts                # Main app entry point
│   └── index-login.ts           # Login entry point
├── dist/                        # Compiled JavaScript (generated)
├── coverage/                    # Test coverage reports (generated)
├── node_modules/                # NPM dependencies (gitignored)
├── index.html                   # Login page
├── index-app.html               # Main app page
├── favicon.svg                  # Application icon
├── styles.css                   # Styles
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest testing configuration
├── package.json                 # Node dependencies and scripts
├── ARCHITECTURE.md              # Architecture documentation
├── STATE_LAYER.md               # State layer documentation
└── .gitignore                   # Git ignore rules
```

### Layered Architecture

The client follows a **four-layer architecture** with physical folder separation:

#### **Data Layer** (`src/data/`)
Core functionality for data operations and utilities. This layer has no UI knowledge.

- **api.ts**: API client for shopping list operations (fetchItems, addItem, deleteItem, updateDepartment)
- **auth.ts**: Authentication utilities (login, register, logout, token management with optimization)
- **dom.ts**: DOM manipulation utilities (renderItems with department grouping, sorting by sort_order, and DOM batching; loadTemplate with caching)
- **Tests**: api.test.ts (19), auth.test.ts (36), dom.test.ts (18) - **73 tests total**, 99.5%+ coverage

#### **State Layer** (`src/state/`)
Centralized state management with reactive updates using the Observer pattern.

- **shopping-list-state.ts**: Manages shopping list items state with subscriptions
- **user-state.ts**: Manages current user state with subscriptions
- **store-state.ts**: Manages stores, departments, and products state with parallel loading
- **Key Features**:
  - Single source of truth for application state
  - Reactive UI updates via Observer pattern
  - Loading state tracking
  - Immutability (returns copies, not references)
- **Tests**: shopping-list-state.test.ts (36), user-state.test.ts (24), store-state.test.ts (34) - **94 tests total**, 100% coverage

#### **UI Layer** (`src/ui/`)
Feature-specific UI logic and event handlers. Subscribes to state changes for automatic updates.

- **shopping-list-ui.ts**: Shopping list UI logic (subscribes to state, triggers state updates)
- **user-menu.ts**: User menu functionality (subscribes to user state, handles logout/deletion)
- **store-admin.ts**: Store and department management UI with CRUD operations and reordering
- **product-admin.ts**: Product management UI with store/department filtering
- **Tests**: shopping-list-ui.test.ts (16), user-menu.test.ts (16), store-admin.test.ts (19), product-admin.test.ts (15) - **66 tests total**, 100% coverage

#### **Pages Layer** (`src/pages/`)
Page controllers and HTML templates that combine UI modules into complete pages.

- **login.ts**: Login/registration page controller
- **login.html**: Login page HTML template
- **app.html**: Main application HTML template
- **Tests**: login.test.ts (20) - **20 tests total**, 100% coverage

#### **Entry Points** (`src/`)
Minimal orchestration code that initializes appropriate layers.

- **script.ts**: Main app entry point (initializes shopping list UI and State layers)
- **script-stores.ts**: Store admin page entry point (initializes store admin UI)
- **script-products.ts**: Products page entry point (initializes product admin UI)
- **index-login.ts**: Login page entry point
- **Tests**: script.test.ts (7), script-stores.test.ts (9), script-products.test.ts (9), index-login.test.ts (4) - **29 tests total**, 100% coverage

### Dependency Flow

```
Entry Points (script.ts, script-stores.ts, script-products.ts, index-login.ts)
         ↓
Pages/UI Layer (login.ts, shopping-list-ui.ts, store-admin.ts, product-admin.ts, user-menu.ts)
         ↓
State Layer (shopping-list-state.ts, store-state.ts, user-state.ts)
         ↓
Data Layer (api.ts, auth.ts, dom.ts)
```

The State Layer provides reactive state management - UI components subscribe to state changes and automatically re-render when state updates.

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation and [STATE_LAYER.md](STATE_LAYER.md) for state management patterns.

## TypeScript Features

### Type Safety
- **Item Interface**: Strongly typed data structure with `id: string`, `name: string`, optional `menge?: string`, and optional department fields (`department_id?: number`, `department_name?: string`, `department_sort_order?: number`)
- **Type Annotations**: All functions have explicit parameter and return types
- **DOM Type Safety**: Type assertions for HTML elements (`HTMLInputElement`, `HTMLButtonElement`)
- **Strict Mode**: All TypeScript strict compiler options enabled

### Code Quality
- **Error Handling**: Comprehensive try-catch blocks with console logging
- **Null Checks**: Proper null checks for DOM elements to prevent runtime errors
- **JSDoc Comments**: Inline documentation for all functions
- **Async/Await**: Modern asynchronous patterns with proper error handling
- **Performance Optimizations**:
  - Token refresh uses singleton pattern to prevent race conditions
  - 5-second cooldown prevents excessive token refresh requests
  - Concurrent API calls share a single token refresh operation
  - Event delegation: Single listener handles all delete buttons (scales efficiently)
  - Double-click prevention: Buttons disabled during operations
  - Template caching: Templates fetched once and cached in memory (instant subsequent loads)
  - DOM batching: DocumentFragment reduces reflows from O(n) to O(1)

### Developer Experience
- **IntelliSense**: Full IDE autocomplete and type hints
- **Refactoring**: Safe refactoring with compile-time checks
- **Documentation**: JSDoc provides inline help in the IDE

## TypeScript Configuration

The TypeScript compiler is configured with:
- **Target**: ES2020 (modern JavaScript features)
- **Module**: ES2020 modules
- **Strict Mode**: Maximum type safety
- **Output Directory**: `dist/` for compiled JavaScript
- **Source Directory**: `src/` for TypeScript files

### Key Improvements Over JavaScript

1. **Compile-time Type Checking**: Catch errors before runtime
2. **Better IDE Support**: IntelliSense, autocomplete, and navigation
3. **Self-documenting Code**: Types serve as documentation
4. **Safer Refactoring**: Type system prevents breaking changes
5. **Enhanced Error Handling**: Explicit error cases and logging

## Application Architecture

### Multi-Page Application

The application consists of two main pages:

1. **Login Page** (`index.html` → `index-login.ts`)
   - User authentication (login/register)
   - Redirects to main app on successful authentication
   - Form validation and error handling

2. **Main App** (`index-app.html` → `script.ts`)
   - Protected by authentication check
   - Shopping list functionality
   - User menu (logout, account deletion)

### Authentication Flow

1. User visits `/` (login page)
2. Login or register with credentials
3. JWT token stored in localStorage
4. Redirect to `/app` (main application)
5. Token automatically refreshed on every API call (optimized with singleton pattern and cooldown)
6. Logout or account deletion clears token

### Loading Process

**Login Page:**
1. `index.html` loads with embedded login form
2. `dist/index-login.js` executes on DOMContentLoaded
3. Login page controller initializes form handlers
4. On successful login, redirects to `/app`

**Main App:**
1. `index-app.html` loads with empty `<div id="app">`
2. `dist/script.js` checks authentication
3. Fetches and injects `src/pages/app.html` into `#app`
4. Initializes UI modules (shopping list, user menu)
5. Fetches and displays shopping list data

### Architecture Benefits

- **Layer Separation**: Clear boundaries between data, state, UI, and pages
- **Reactive Updates**: Automatic UI re-renders via state subscriptions
- **Single Source of Truth**: All components share the same state
- **Type Safety**: TypeScript ensures compile-time correctness
- **Maintainability**: Easy to find and modify features
- **Testability**: Each layer tested independently (314 tests total, 100% coverage)
- **Scalability**: Easy to add new features or UI modules
- **Security**: Token-based authentication with automatic refresh
- **Performance**: Event delegation and optimized token refresh reduce overhead
- **Memory Efficiency**: Minimal event listeners, no memory leaks from dynamic content

## Usage

After building, the compiled JavaScript in `dist/script.js` is automatically served by the application server. No additional configuration needed.

For development with auto-compilation:
```bash
npm run watch
```

This will automatically recompile TypeScript files whenever you save changes.
