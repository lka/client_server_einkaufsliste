# Client Architecture

## Overview

The shopping list client is built with TypeScript and follows a progressive enhancement approach with clean separation of concerns.

## File Structure

```
client/
├── index.html          # Entry point (minimal, shows "JS required" message)
├── src/
│   ├── app.html        # Application HTML template
│   └── script.ts       # TypeScript application logic
├── dist/
│   └── script.js       # Compiled JavaScript
└── styles.css          # Application styles
```

## Loading Flow

### 1. Initial Page Load (index.html)
- Displays a `<noscript>` message for users without JavaScript
- Contains an empty `<div id="app">` container
- Loads `dist/script.js`

### 2. JavaScript Execution (script.ts)
- Waits for DOMContentLoaded event
- Fetches `src/app.html` template
- Injects template HTML into `#app` container
- Initializes event handlers
- Loads initial shopping list data

### 3. Runtime
- User interactions handled by TypeScript event handlers
- API calls for CRUD operations
- DOM updates to reflect data changes

## Key Features

### Progressive Enhancement
- **No JavaScript**: Clear multilingual message
- **With JavaScript**: Full application functionality

### Separation of Concerns
- **HTML Template** (app.html): Structure only
- **TypeScript** (script.ts): Logic and behavior
- **Entry Point** (index.html): Minimal bootstrap

### Type Safety
- TypeScript interfaces for data structures
- Type-safe DOM manipulation
- Compile-time error checking

## Benefits

1. **Accessibility**: Users without JS get clear feedback
2. **Maintainability**: Clean separation makes changes easier
3. **Type Safety**: TypeScript prevents runtime errors
4. **Modern Architecture**: Template loading pattern
5. **Developer Experience**: Clear file organization

## Development Workflow

1. Edit `src/script.ts` or `src/app.html`
2. Run `npm run build` or `npm run watch`
3. TypeScript compiles to `dist/script.js`
4. Refresh browser to see changes

## Future Enhancements

Potential improvements:
- Bundle all assets (HTML, CSS, JS) with a build tool
- Add service worker for offline functionality
- Implement virtual DOM for better performance
- Add routing for multiple pages
