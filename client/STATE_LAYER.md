# State Layer Architecture

## Overview

The State Layer sits between the UI Layer and the Data Layer, providing centralized state management with reactive updates through the Observer pattern.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Entry Points                            │
│                 (script.ts, index-login.ts)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Pages/UI Layer                             │
│          (login.ts, shopping-list-ui.ts, user-menu.ts)       │
│         - Subscribe to state changes                         │
│         - Trigger state updates via user actions             │
│         - Automatically re-render on state changes           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE LAYER (NEW)                       │
│   ┌──────────────────────┬──────────────────────────┐       │
│   │  shopping-list-state │  user-state              │       │
│   │  - items: Item[]     │  - currentUser: User     │       │
│   │  - listeners         │  - listeners             │       │
│   │  - loading state     │  - loading state         │       │
│   └──────────────────────┴──────────────────────────┘       │
│         - Centralized state management                       │
│         - Observer pattern for reactive updates              │
│         - Loading state tracking                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│         (api.ts, auth.ts, dom.ts)                            │
│         - API calls                                          │
│         - Token management                                   │
│         - DOM utilities                                      │
└─────────────────────────────────────────────────────────────┘
```

## State Layer Modules

### shopping-list-state.ts

**Purpose**: Manages shopping list items state with reactive updates.

**Key Features**:
- **Centralized State**: Single source of truth for shopping list items
- **Observer Pattern**: Automatic UI updates via subscription
- **Loading State**: Tracks async operations
- **Immutability**: Returns copies of state (not references)

**API**:
```typescript
// Get current items (read-only copy)
getItems(): Item[]

// Check loading status
isLoading(): boolean

// Subscribe to state changes (returns unsubscribe function)
subscribe(listener: (items: Item[]) => void): () => void

// Load items from API
async loadItems(): Promise<boolean>

// Add item via API
async addItem(name: string): Promise<Item | null>

// Delete item via API
async deleteItem(id: string): Promise<boolean>

// Clear local state
clear(): void
```

**Usage Example**:
```typescript
import { shoppingListState } from '../state/shopping-list-state.js';

// Subscribe to state changes
const unsubscribe = shoppingListState.subscribe((items) => {
  renderItems(items); // UI updates automatically
});

// Trigger state updates
await shoppingListState.addItem('Milk');
// UI automatically updates via subscription

// Clean up
unsubscribe();
```

### user-state.ts

**Purpose**: Manages current user state and authentication status.

**Key Features**:
- **User Management**: Tracks currently logged-in user
- **Observer Pattern**: Automatic UI updates on user changes
- **Loading State**: Tracks async operations
- **Immutability**: Returns copies of user data

**API**:
```typescript
// Get current user (read-only copy)
getCurrentUser(): User | null

// Check loading status
isLoading(): boolean

// Subscribe to user state changes (returns unsubscribe function)
subscribe(listener: (user: User | null) => void): () => void

// Load current user from API
async loadCurrentUser(): Promise<User | null>

// Delete current user via API
async deleteCurrentUser(): Promise<boolean>

// Clear user state (e.g., on logout)
clearUser(): void

// Set user directly (e.g., after login)
setUser(user: User): void
```

**Usage Example**:
```typescript
import { userState } from '../state/user-state.js';

// Subscribe to user changes
userState.subscribe((user) => {
  if (user) {
    updateHeader(`Welcome, ${user.username}`);
  }
});

// Load user
await userState.loadCurrentUser();
// UI automatically updates via subscription

// Logout
userState.clearUser();
// UI automatically updates to show logged-out state
```

## Benefits of the State Layer

### 1. **Separation of Concerns**
- UI Layer focuses on rendering and user interactions
- State Layer manages application state
- Data Layer handles API calls and data transformation

### 2. **Reactive UI Updates**
- **Before**: Manual `loadItems()` calls after each action
- **After**: Automatic UI updates via state subscriptions

```typescript
// Before (manual updates)
await addItem('Milk');
await loadItems(); // Must remember to refresh

// After (automatic updates)
await shoppingListState.addItem('Milk');
// UI updates automatically via subscription
```

### 3. **Single Source of Truth**
- All components subscribe to the same state
- No inconsistencies between different UI parts
- Easier debugging and state tracking

### 4. **Testability**
- State logic tested independently of UI
- UI tests can mock state layer easily
- Clear boundaries between layers

### 5. **Scalability**
- Easy to add new state properties
- Simple to add new subscribers
- Can implement middleware (logging, persistence, etc.)

### 6. **Loading State Management**
- Centralized loading indicators
- Prevents race conditions
- Better UX with loading feedback

## Migration Guide

### Before (Direct API Calls)
```typescript
// shopping-list-ui.ts
import { fetchItems, addItem } from '../data/api.js';

addBtn.addEventListener('click', async () => {
  const item = await addItem(input.value);
  if (item) {
    await loadItems(); // Manual refresh
  }
});
```

### After (State Layer)
```typescript
// shopping-list-ui.ts
import { shoppingListState } from '../state/shopping-list-state.js';

// Subscribe once during init
shoppingListState.subscribe((items) => {
  renderItems(items); // Automatic updates
});

addBtn.addEventListener('click', async () => {
  await shoppingListState.addItem(input.value);
  // UI updates automatically
});
```

## Testing the State Layer

State layer tests verify:
- State initialization
- State updates
- Observer notifications
- Loading state tracking
- Error handling
- Immutability of returned state

**Test Files**:
- `shopping-list-state.test.ts` (35 tests)
- `user-state.test.ts` (24 tests)

**Total**: 59 new tests for state management

## Performance Considerations

### Memory
- Minimal overhead: Only stores current state
- Listeners are Set (O(1) add/remove)
- Unsubscribe functions prevent memory leaks

### Efficiency
- No unnecessary re-renders
- State changes batch naturally
- Loading state prevents duplicate API calls

## Future Enhancements

Possible improvements to the state layer:

1. **State Persistence**: Save state to localStorage
2. **Middleware**: Add logging, dev tools integration
3. **Computed State**: Derived values from base state
4. **State History**: Undo/redo functionality
5. **Optimistic Updates**: Update UI before API confirms
6. **State Selectors**: Subscribe to specific state slices

## Files Added

```
client/src/state/
├── shopping-list-state.ts     # Shopping list state manager
├── shopping-list-state.test.ts# Tests (35 tests)
├── user-state.ts              # User state manager
└── user-state.test.ts         # Tests (24 tests)
```

## Files Modified

```
client/src/ui/
├── shopping-list-ui.ts        # Now uses state layer
└── user-menu.ts               # Now uses state layer
```

## Summary

The State Layer introduces a clean separation between UI and data, providing:
- **Reactive updates** via Observer pattern
- **Single source of truth** for application state
- **Better testability** with clear boundaries
- **Improved maintainability** with centralized state logic
- **Scalability** for future features

This architecture follows modern frontend patterns (similar to Redux, MobX, Zustand) while keeping implementation simple and lightweight.
