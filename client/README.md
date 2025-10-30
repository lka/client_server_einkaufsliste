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

The client includes comprehensive unit tests:

- **API Tests** (`api.test.ts`): Tests for all API functions (fetchItems, addItem, deleteItem)
  - Success scenarios
  - Error handling
  - Network failure cases
- **DOM Tests** (`dom.test.ts`): Tests for DOM manipulation functions
  - Item rendering
  - Empty state handling
  - Element creation
  - Event delegation

**Coverage**: 80%+ code coverage across all modules

## Project Structure

```
client/
├── src/
│   ├── api.ts             # API client functions
│   ├── api.test.ts        # API tests
│   ├── dom.ts             # DOM manipulation utilities
│   ├── dom.test.ts        # DOM tests
│   ├── script.ts          # Application entry point
│   └── app.html           # Application HTML template
├── dist/
│   └── script.js          # Compiled JavaScript (generated)
├── coverage/              # Test coverage reports (generated)
├── node_modules/          # NPM dependencies (gitignored)
├── index.html             # Entry point with JS required message
├── styles.css             # Styles
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Jest testing configuration
├── package.json           # Node dependencies and scripts
└── .gitignore             # Ignores node_modules, dist, and coverage
```

### File Descriptions

- **index.html**: Entry point that displays a "JavaScript required" message for users without JS enabled. Contains a `<div id="app">` where the application loads.
- **src/app.html**: HTML template containing the actual application structure (header, input form, item list).
- **src/api.ts**: API client functions for fetching, adding, and deleting items.
- **src/api.test.ts**: Comprehensive unit tests for API functions.
- **src/dom.ts**: DOM manipulation utilities for rendering items and loading templates.
- **src/dom.test.ts**: Unit tests for DOM manipulation functions.
- **src/script.ts**: Application entry point that coordinates API and DOM modules.
- **dist/script.js**: Compiled JavaScript served to the browser.
- **jest.config.js**: Jest configuration for TypeScript testing.

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

### Progressive Enhancement

The application follows a progressive enhancement approach:

1. **No JavaScript**: Users without JavaScript see a clear "JavaScript required" message in both German and English.
2. **With JavaScript**: The application dynamically loads the HTML template (`src/app.html`) and initializes the shopping list functionality.

### Loading Process

1. `index.html` loads with a `<noscript>` message and empty `<div id="app">`
2. `dist/script.js` executes on DOMContentLoaded
3. Script fetches and injects `src/app.html` into the `#app` container
4. Event handlers are initialized for the loaded DOM elements
5. Initial shopping list data is fetched and displayed

### Benefits

- **Accessibility**: Clear message for users without JavaScript
- **Clean separation**: HTML structure separate from entry point
- **Type safety**: TypeScript ensures runtime correctness
- **Maintainability**: Template and logic are separated

## Usage

After building, the compiled JavaScript in `dist/script.js` is automatically served by the application server. No additional configuration needed.

For development with auto-compilation:
```bash
npm run watch
```

This will automatically recompile TypeScript files whenever you save changes.
