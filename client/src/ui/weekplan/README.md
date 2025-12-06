# Weekplan Module

**Status**: ✨ **FULLY INTEGRATED** - Modular architecture for weekly meal planning

## Overview

The weekplan module provides a complete weekly meal planning system with support for templates, recipes, and real-time collaboration. Originally a monolithic 850-line file, it has been successfully refactored into 13 focused modules for better maintainability and testability.

**Refactoring Complete**: All modules are now integrated into the main weekplan.ts file.

## Refactoring Achievement

### Complexity Reduction

- **Before**: Single file with ~850 lines, McCabe 251, Cyclomatic 165
- **After**: Main file 228 lines (McCabe 35, Cyclomatic 22) + 13 focused modules
- **Result**:
  - **73% reduction** in main file size
  - Moved from "very high complexity" to "high complexity" (manageable)
  - Average module complexity: ~20 McCabe (moderate range)
  - All features preserved through modular composition
  - **Full backward compatibility maintained**

### Module Structure

```
weekplan/
├── index.ts                  # Barrel file - exports all modules
├── types.ts                  # Shared TypeScript types (McCabe: 0)
├── weekplan-state.ts         # State management (McCabe: 26)
├── weekplan-utils.ts         # Date utilities (McCabe: 11)
├── weekplan-navigation.ts    # Week navigation (McCabe: 6)
├── weekplan-websocket.ts     # WebSocket integration (McCabe: 10)
├── weekplan-print.ts         # Print functionality (McCabe: 6)
├── weekplan-rendering.ts     # DOM rendering (McCabe: 10)
├── entry-input.ts            # Entry input with autocomplete (McCabe: 29)
├── ingredient-parser.ts      # Quantity parsing (McCabe: 23)
├── template-modal.ts         # Template details modal (McCabe: 42)
├── recipe-modal.ts           # Recipe details modal (McCabe: 53)
└── modal-shared.ts           # Shared modal components (McCabe: 28)
```

### Complexity Metrics

| Module | Lines | McCabe | Cyclomatic | Responsibility |
|--------|-------|--------|------------|----------------|
| recipe-modal.ts | 270 | 53 | 34 | Recipe details and management |
| template-modal.ts | 250 | 42 | 24 | Template details and deltas |
| entry-input.ts | 169 | 29 | 20 | Entry input with autocomplete |
| modal-shared.ts | 257 | 28 | 13 | Shared modal components |
| weekplan-state.ts | 181 | 26 | 24 | State management |
| ingredient-parser.ts | 64 | 23 | 19 | Quantity parsing and scaling |
| weekplan-utils.ts | 60 | 11 | 5 | Date utilities |
| weekplan-rendering.ts | 108 | 10 | 3 | DOM rendering |
| weekplan-websocket.ts | 47 | 10 | 6 | WebSocket integration |
| weekplan-navigation.ts | 60 | 6 | 0 | Navigation logic |
| weekplan-print.ts | 28 | 6 | 3 | Print functionality |
| index.ts | 63 | 2 | 0 | Barrel file |
| types.ts | 39 | 0 | 0 | Type definitions |

**Total**: ~1,596 lines across 13 modules
**Average Complexity**: ~20 McCabe (moderate/low range)
**Main weekplan.ts**: 228 lines, McCabe 35

## Architecture

### Core Concepts

#### 1. State Management

Centralized state manager with Observer pattern for reactive UI updates.

```typescript
import { weekplanState } from './weekplan/index.js';

// Subscribe to state changes
const unsubscribe = weekplanState.subscribe(() => {
  console.log('State changed!');
  renderUI();
});

// Get entries for a specific date and meal
const entries = weekplanState.getEntries('2024-12-06', 'lunch');

// Add an entry
weekplanState.addEntry({
  id: 1,
  date: '2024-12-06',
  meal: 'lunch',
  text: 'Spaghetti Bolognese'
});

// Clean up when done
unsubscribe();
```

**State Structure**:
- `entriesStore`: Map<dateISO, Map<meal, WeekplanEntry[]>>
- `weekOffset`: Number (0 = current week, -1 = previous, +1 = next)
- `listeners`: Set<StateChangeListener>

#### 2. Week Navigation

Navigate between weeks while maintaining state.

```typescript
import {
  navigateToPreviousWeek,
  navigateToNextWeek,
  navigateToCurrentWeek,
  getCurrentWeekInfo,
  getWeekDisplayString
} from './weekplan/index.js';

// Navigate to previous week
navigateToPreviousWeek();

// Get current week info
const weekInfo = getCurrentWeekInfo();
// Returns: { weekNumber: 47, year: 2024, monday: Date, dates: Date[] }

// Get display string
const display = getWeekDisplayString();
// Returns: "KW 47 · 18.11. - 24.11.2024"
```

#### 3. Entry Management

Add entries with autocomplete support for templates and recipes.

```typescript
import { handleAddMealEntry } from './weekplan/index.js';

// Event handler for + button
button.addEventListener('click', handleAddMealEntry);

// Features:
// - Autocomplete with template and recipe suggestions
// - Smart-save workflow (save existing + create new input)
// - WebSocket broadcasting for real-time sync
// - Error handling with input preservation
```

**Autocomplete Features**:
- Templates and weekplan suggestions (shown first)
- Recipes marked with 🍳 emoji
- Combined limit of 5 suggestions
- Fuzzy search with case-insensitive matching
- Minimum 2 characters to trigger

#### 4. Template Modals

Display and manage template details with delta support.

```typescript
import { showTemplateDetails } from './weekplan/index.js';

// Show template modal
await showTemplateDetails('Grillabend', entryId);

// Modal features:
// - View template items with quantities
// - Adjust person count with live-scaling
// - Remove items via checkboxes
// - Add custom items with quantities
// - Save deltas to API
```

**Delta Structure**:
```typescript
interface WeekplanDeltas {
  person_count?: number;           // Adjusted person count
  removed_items?: string[];        // Disabled item names
  added_items?: DeltaItem[];       // Custom items
}

interface DeltaItem {
  name: string;
  menge?: string;
}
```

#### 5. Recipe Modals

Display and manage recipe details with ingredient scaling.

```typescript
import { showRecipeDetailsById, showRecipeDetails } from './weekplan/index.js';

// Show recipe by ID
await showRecipeDetailsById(recipeId, entryId);

// Show recipe by name (searches first)
await showRecipeDetails('Spaghetti Bolognese');

// Modal features:
// - Parse ingredients with quantities and units
// - Adjust portion count with live-scaling
// - Disable ingredients via checkboxes
// - Add custom ingredients
// - Save deltas to API
```

#### 6. Ingredient Parsing

Parse and scale ingredient quantities.

```typescript
import { parseIngredients, adjustQuantityByFactor } from './weekplan/index.js';

// Parse ingredient lines
const ingredients = await parseIngredients([
  '2 kg Tomaten',
  '500g Hackfleisch',
  '1/2 Zwiebel'
]);

// Returns: Array<{ quantity: string, name: string, originalLine: string }>

// Adjust quantity by factor
const scaled = adjustQuantityByFactor('2 kg', 1.5);
// Returns: "3 kg"
```

**Features**:
- Fetches known units from server for accurate parsing
- Handles fractions (e.g., "1/2", "1/4")
- Handles decimals with comma or dot
- Extracts quantity and name from ingredient lines
- Preserves unit information

#### 7. Real-time Synchronization

WebSocket integration for collaborative editing.

```typescript
import { initializeWeekplanWebSocket } from './weekplan/index.js';

// Initialize WebSocket listeners (call once during app init)
initializeWeekplanWebSocket();

// Automatically handles:
// - weekplan:added events → adds entry to state and DOM
// - weekplan:deleted events → removes entry from state and DOM
// - Real-time synchronization across all users
```

**WebSocket Flow**:
1. User A adds entry → API call → broadcast `weekplan:add`
2. User B receives `weekplan:added` event → updates state → UI re-renders
3. User C deletes entry → API call → broadcast `weekplan:delete`
4. All users receive `weekplan:deleted` → update state → remove from DOM

#### 8. Printing

Print the current week's meal plan.

```typescript
import { handlePrintWeekplan } from './weekplan/index.js';

// Generate and print weekplan
handlePrintWeekplan();

// Features:
// - Includes all 7 days
// - Groups by meals (morning, lunch, dinner)
// - Shows week number and year
// - Platform-specific printing (Android/iOS/Desktop)
```

## Usage Examples

### Basic Integration

```typescript
import { initWeekplan } from '../ui/weekplan.js';

// Initialize weekplan UI
initWeekplan();

// This sets up:
// - Week navigation buttons
// - Add entry buttons
// - Entry rendering
// - WebSocket listeners
// - Print functionality
// - Custom event handlers
```

### Custom Rendering

```typescript
import {
  weekplanState,
  formatISODate,
  DAY_NAMES,
  MEAL_TYPES,
  addMealItemToDOM
} from '../ui/weekplan/index.js';

// Subscribe to state changes for reactive rendering
weekplanState.subscribe(() => {
  DAY_NAMES.forEach((day, index) => {
    const dateISO = formatISODate(dates[index]);

    MEAL_TYPES.forEach(meal => {
      const entries = weekplanState.getEntries(dateISO, meal);
      const container = document.querySelector(
        `[data-day="${day}"][data-meal="${meal}"] .meal-content`
      );

      // Clear and re-render
      container.innerHTML = '';
      entries.forEach(entry => {
        addMealItemToDOM(container, entry.text, entry.id, entry.recipe_id);
      });
    });
  });
});
```

### Advanced State Management

```typescript
import { weekplanState } from '../ui/weekplan/index.js';

// Load entries from API
const entries = await getWeekplanEntries(weekStartISO);
weekplanState.setEntries(entries);

// Add single entry
weekplanState.addEntry({
  id: 1,
  date: '2024-12-06',
  meal: 'lunch',
  text: 'Pizza Margherita',
  recipe_id: 42
});

// Update entry with deltas
weekplanState.updateEntry({
  id: 1,
  date: '2024-12-06',
  meal: 'lunch',
  text: 'Pizza Margherita',
  deltas: {
    person_count: 4,
    removed_items: ['Oliven'],
    added_items: [{ name: 'Extra Käse', menge: '100g' }]
  }
});

// Remove entry
weekplanState.removeEntry(1);

// Get all entries (returns immutable copy)
const allEntries = weekplanState.getAllEntries();
```

## Date Utilities

```typescript
import {
  getISOWeek,
  getMonday,
  formatShortDate,
  formatISODate,
  getWeekDates,
  isToday
} from '../ui/weekplan/index.js';

// Get ISO week number
const week = getISOWeek(new Date()); // 47

// Get Monday of a week
const monday = getMonday(new Date()); // Date object

// Format dates
const short = formatShortDate(new Date()); // "06.12."
const iso = formatISODate(new Date()); // "2024-12-06"

// Get all dates for a week (Mon-Sun)
const dates = getWeekDates(monday); // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]

// Check if date is today
const todayCheck = isToday(new Date()); // true
```

## Type Definitions

```typescript
import type {
  WeekplanEntry,
  WeekplanDeltas,
  DeltaItem,
  ParsedIngredient,
  WeekplanState,
  DayName,
  MealType,
  WeekInfo
} from '../ui/weekplan/index.js';

// WeekplanEntry
interface WeekplanEntry {
  id?: number;
  date: string;           // ISO format: "2024-12-06"
  meal: string;           // "morning", "lunch", "dinner"
  text: string;
  recipe_id?: number;
  deltas?: WeekplanDeltas;
}

// ParsedIngredient
interface ParsedIngredient {
  quantity: string | null;
  name: string;
  originalLine: string;
}

// Constants
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['morning', 'lunch', 'dinner'];

// WeekInfo
interface WeekInfo {
  weekNumber: number;
  year: number;
  monday: Date;
  dates: Date[];
}
```

## Best Practices

### 1. State Management
- ✅ Always use `weekplanState` for reading/writing entries
- ✅ Subscribe to state changes for reactive UI updates
- ✅ Don't modify state directly - use provided methods
- ✅ Unsubscribe when component unmounts to prevent memory leaks

### 2. Date Handling
- ✅ Use `formatISODate()` for API calls (YYYY-MM-DD)
- ✅ Use `formatShortDate()` for display (DD.MM.)
- ✅ Use `getMonday()` to calculate week boundaries
- ✅ Always work with Date objects internally, format only for display

### 3. Entry Management
- ✅ Use `handleAddMealEntry()` for consistent entry creation
- ✅ Broadcast changes via WebSocket for real-time sync
- ✅ Handle errors gracefully (keep input active on failure)
- ✅ Validate data before API calls

### 4. Modal Integration
- ✅ Use `showTemplateDetails()` for template entries
- ✅ Use `showRecipeDetailsById()` for recipe entries
- ✅ Always provide `entryId` when editing existing entries
- ✅ Save deltas to persist user modifications

### 5. Performance
- ✅ Use state subscriptions instead of manual DOM updates
- ✅ Debounce rapid state changes if needed
- ✅ Lazy-load modals (only when clicked)
- ✅ Cache parsed ingredients to avoid re-parsing

## Features

### Rezept-Autocomplete
- Integration with `/api/recipes/search` endpoint
- Recipes appear in autocomplete after templates (templates have priority)
- Fuzzy search with case-insensitive matching
- Maximum 10 suggestions (templates + recipes combined)
- Recipe suggestions marked with 🍳 emoji

### Template Preview
- Click on entry to view template details
- Visual feedback (blue background, underline on hover)
- Smart detection (case-insensitive template matching)
- Modal display with items and quantities
- Scrollable content for long templates

### Recipe Modal
- Loads complete recipe data via API
- Shows metadata: name, description, preparation time
- Ingredient list with quantity parsing
- Person count input with live-scaling of quantities
- Delta management: checkboxes to disable ingredients
- Additional items: input field for custom ingredients
- Scrollable layout: ingredients scroll, input fields stay fixed

### Delta Structure
Support for user modifications to templates and recipes:

```typescript
{
  person_count?: number;              // Adjusted person/portion count
  removed_items?: string[];           // Disabled ingredient names
  added_items?: Array<{               // Custom ingredients
    name: string;
    menge?: string;
  }>;
}
```

### Server Integration
- `POST /api/weekplan`: Saves entries with `recipe_id` and `deltas`
- Server-side ingredient processing and quantity calculations
- Intelligent quantity merging for duplicate items
- Real-time updates via WebSocket broadcasts

## Migration Guide

### From Monolithic weekplan.ts

The refactoring maintains **100% backward compatibility**. Existing code continues to work without changes.

**Before** (old usage):
```typescript
import { initWeekplan } from './ui/weekplan.js';
initWeekplan(); // Still works!
```

**After** (with module access):
```typescript
// Main initialization still works the same
import { initWeekplan } from './ui/weekplan.js';

// But now you can also import specific modules
import {
  weekplanState,
  getCurrentWeekInfo,
  showTemplateDetails,
  parseIngredients
} from './ui/weekplan/index.js';
```

**Key Changes**:
- ✅ All functionality preserved - no breaking changes
- ✅ Main `initWeekplan()` function works exactly the same
- ✅ State now managed by `weekplanState` singleton
- ✅ Utilities available for direct import from `weekplan/index.js`
- ✅ Modals extracted into separate, reusable components

## Troubleshooting

### Common Issues

**Issue**: State changes don't trigger UI updates

```typescript
// ❌ Wrong - modifying state directly
weekplanState.entriesStore.set(date, entries);

// ✅ Correct - use provided methods
weekplanState.setEntries(entries);
```

**Issue**: Autocomplete not showing suggestions

Check that:
1. Input field has proper structure
2. `fetchKnownUnits()` is called during initialization
3. API endpoints are accessible
4. Minimum 2 characters entered
5. User has typed after input focus

**Issue**: WebSocket events not received

```typescript
// Ensure WebSocket is initialized
import { initializeWeekplanWebSocket } from './weekplan/index.js';
initializeWeekplanWebSocket();

// Check connection status
import { isConnected } from '../data/websocket.js';
console.log('WebSocket connected:', isConnected());
```

**Issue**: Date calculations off by one day

```typescript
// ❌ Wrong - direct date manipulation
const monday = new Date();
monday.setDate(monday.getDate() - monday.getDay() + 1);

// ✅ Correct - use utility function
const monday = getMonday(new Date());

// Get all week dates
const dates = getWeekDates(monday);
```

## Testing

### Unit Tests Example

```typescript
import { parseIngredients, adjustQuantityByFactor } from '../ui/weekplan/index.js';

describe('Ingredient Parser', () => {
  it('should parse quantities correctly', async () => {
    const ingredients = await parseIngredients(['2 kg Tomaten']);
    expect(ingredients[0].quantity).toBe('2 kg');
    expect(ingredients[0].name).toBe('Tomaten');
  });

  it('should scale quantities by factor', () => {
    expect(adjustQuantityByFactor('2 kg', 1.5)).toBe('3 kg');
    expect(adjustQuantityByFactor('500g', 2)).toBe('1000 g');
    expect(adjustQuantityByFactor('1/2', 3)).toBe('1.5');
  });
});
```

### Integration Tests Example

```typescript
import { weekplanState } from '../ui/weekplan/index.js';

describe('Weekplan State', () => {
  it('should notify subscribers on state change', () => {
    const listener = jest.fn();
    const unsubscribe = weekplanState.subscribe(listener);

    weekplanState.addEntry({
      date: '2024-12-06',
      meal: 'lunch',
      text: 'Test Entry'
    });

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('should return immutable state copies', () => {
    const entries = weekplanState.getAllEntries();
    expect(() => {
      entries.set('2024-12-06', new Map());
    }).not.toThrow();

    // Original state unchanged
    expect(weekplanState.getAllEntries()).not.toBe(entries);
  });
});
```

## References

- [Main Architecture Documentation](../../ARCHITECTURE.md)
- [API Documentation](../../data/api/README.md)
- [Component Library](../components/README.md)
- [Complexity Report](../../complexity-report.md)
- [Weekplan Refactoring Plan](../../docs/weekplan-refactoring.md)

## Contributing

When adding new features to the weekplan module:

1. **Keep modules focused**: Each module should have a single responsibility
2. **Maintain complexity**: Target McCabe < 50 for all modules
3. **Use state manager**: Don't create separate state stores
4. **Document changes**: Update this README and ARCHITECTURE.md
5. **Add tests**: Write unit tests for new functionality
6. **Follow patterns**: Use existing patterns for consistency

## Refactoring Summary

**Date**: December 2024
**Original**: ~850 lines, McCabe 251, Cyclomatic 165
**Current**: 228 lines (main) + 13 modules (~1,596 lines total)
**Reduction**: 73% smaller main file
**Complexity**: McCabe 35 (main), average 20 (modules)
**Result**: 85% complexity reduction per file
**Status**: ✅ **COMPLETE** - Fully integrated and documented
