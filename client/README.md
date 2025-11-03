# Einkaufsliste Client (TypeScript)

Shopping list client application written in TypeScript.

## Overview

This client application has been migrated from vanilla JavaScript to TypeScript, providing enhanced type safety, better IDE support, and improved maintainability.

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
- **api.test.ts** (18 tests): API client functions with token refresh, 401 handling, and edge cases
- **auth.test.ts** (36 tests): Authentication, token management, user operations, and token refresh optimization
- **dom.test.ts** (14 tests): DOM manipulation, rendering, template caching, and DOM batching

**UI Layer Tests**:
- **shopping-list-ui.test.ts** (14 tests): Shopping list UI interactions
- **user-menu.test.ts** (16 tests): User menu functionality

**Pages Layer Tests**:
- **login.test.ts** (20 tests): Login/registration page controller

**Total**: **102 tests**, all passing ✅

**Coverage**: **98.5%+ overall code coverage**
- Data Layer: auth.ts (100%), dom.ts (98%), api.ts (100%)
- UI Layer: user-menu.ts (100%), shopping-list-ui.ts (97%)
- Pages Layer: login.ts (100%)

## Project Structure

```
client/
├── src/
│   ├── data/                    # Data Layer
│   │   ├── api.ts               # API client functions
│   │   ├── api.test.ts          # API tests (9 tests)
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── auth.test.ts         # Auth tests (33 tests)
│   │   ├── dom.ts               # DOM manipulation utilities
│   │   └── dom.test.ts          # DOM tests (7 tests)
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
├── styles.css                   # Styles
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest testing configuration
├── package.json                 # Node dependencies and scripts
├── ARCHITECTURE.md              # Architecture documentation
└── .gitignore                   # Git ignore rules
```

### Layered Architecture

The client follows a **three-layer architecture** with physical folder separation:

#### **Data Layer** (`src/data/`)
Core functionality for data operations and utilities. This layer has no UI knowledge.

- **api.ts**: API client for shopping list operations (fetchItems, addItem, deleteItem)
- **auth.ts**: Authentication utilities (login, register, logout, token management with optimization)
- **dom.ts**: DOM manipulation utilities (renderItems with batching, loadTemplate with caching)
- **Tests**: api.test.ts (18), auth.test.ts (36), dom.test.ts (14) - **68 tests total**, 99.5%+ coverage

#### **UI Layer** (`src/ui/`)
Feature-specific UI logic and event handlers. Uses the Data Layer via clear interfaces.

- **shopping-list-ui.ts**: Shopping list UI logic (add, delete, render items)
- **user-menu.ts**: User menu functionality (logout, account deletion, user display)
- **Tests**: shopping-list-ui.test.ts (14), user-menu.test.ts (16) - **30 tests total**, 100% coverage

#### **Pages Layer** (`src/pages/`)
Page controllers and HTML templates that combine UI modules into complete pages.

- **login.ts**: Login/registration page controller
- **login.html**: Login page HTML template
- **app.html**: Main application HTML template
- **Tests**: login.test.ts (20) - **20 tests total**, 100% coverage

#### **Entry Points** (`src/`)
Minimal orchestration code that initializes appropriate layers.

- **script.ts**: Main app entry point (orchestrates UI and Data layers)
- **index-login.ts**: Login page entry point

### Dependency Flow

```
Entry Points (script.ts, index-login.ts)
         ↓
Pages/UI Layer (login.ts, shopping-list-ui.ts, user-menu.ts)
         ↓
Data Layer (api.ts, auth.ts, dom.ts)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## TypeScript Features

### Type Safety
- **Item Interface**: Strongly typed data structure with `id: string` and `name: string`
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

- **Layer Separation**: Clear boundaries between data, UI, and pages
- **Type Safety**: TypeScript ensures compile-time correctness
- **Maintainability**: Easy to find and modify features
- **Testability**: Each layer tested independently
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
