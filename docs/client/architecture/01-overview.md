# Overview

📚 [Back to Main](../ARCHITECTURE.md) | [Next: Data Layer →](02-data-layer.md)

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

## Layer Details Introduction

The architecture consists of four distinct layers, each with specific responsibilities:

### 1. Data Layer (`src/data/`)

**Purpose**: Core data operations and utilities with no UI knowledge.

The Data Layer provides:
- **Pure data operations** with no UI dependencies
- **Modular API architecture** with 13 focused modules
- **Authentication and token management** with JWT
- **WebSocket real-time updates** for synchronized state
- **DOM utilities** for template loading and rendering
- **Inactivity tracking** for automatic logout

**Key Modules**:
- `api/` - Modular API with 13 specialized modules (McCabe: 6-50)
- `auth.ts` - JWT authentication and user management
- `websocket.ts` ✨ REFACTORED - Real-time WebSocket connection
- `dom.ts` - DOM manipulation and template loading
- `inactivity-tracker.ts` - Auto-logout on timeout

[→ See complete Data Layer documentation](02-data-layer.md)

### 2. State Layer (`src/state/`)

**Purpose**: Centralized state management with reactive updates.

The State Layer provides:
- **Single source of truth** for application state
- **Observer pattern** for reactive UI updates
- **CRUD operations** that automatically notify subscribers
- **Loading state tracking** for all operations
- **Immutable state** with read-only copies

**Key Modules**:
- `shopping-list-state.ts` - Shopping list items state
- `user-state.ts` - Current user state
- `store-state.ts` ✨ REFACTORED - Stores, departments, products
- `product-admin-state.ts` - Product administration
- `store-admin-state.ts` - Store administration
- `template-admin-state.ts` - Template administration

[→ See complete State Layer documentation](03-state-layer.md)

### 3. UI Layer (`src/ui/`)

**Purpose**: Feature-specific UI logic and components.

The UI Layer provides:
- **Reusable UI components** with consistent styling
- **Feature-specific modules** for complex UI logic
- **Event delegation** for efficient event handling
- **Reactive updates** via state subscriptions
- **Modular architecture** for maintainability

**Key Modules**:
- `components.ts` - Reusable UI components library
- `shopping-list-ui.ts` ✨ REFACTORED - Shopping list UI logic
- `user-menu.ts` - User menu and profile
- `weekplan/` ✨ REFACTORED - Weekplan UI modules
- `product-admin/` ✨ REFACTORED - Product admin UI
- `store-admin/` ✨ REFACTORED - Store admin UI
- `template-admin/` ✨ REFACTORED - Template admin UI
- `webdav-admin/` ✨ REFACTORED - WebDAV settings UI

[→ See complete UI Layer documentation](04-ui-layer.md)

### 4. Pages Layer (`src/pages/`)

**Purpose**: Page controllers that orchestrate UI and state.

The Pages Layer provides:
- **Minimal page controllers** that wire up UI and state
- **Entry point logic** for each application page
- **Route initialization** and setup
- **Template loading** and rendering

**Key Files**:
- `login.ts` / `login.html` - Login page
- `app.html` - Main application shell
- Entry point scripts (script.ts, script-weekplan.ts, etc.)

[→ See complete Pages and Entry Points documentation](05-pages.md)

---

📚 [Back to Main](../ARCHITECTURE.md) | [Next: Data Layer →](02-data-layer.md)
