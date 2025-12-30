# Detailed Module Documentation

📚 [Back to Main](../ARCHITECTURE.md) | [← Pages & Entry Points](05-pages.md) | [Next: Refactoring →](07-refactoring.md)

## Weekplan Modules (`src/ui/weekplan/`)

**Purpose**: Modular weekplan components for weekly meal planning with recipe and template support.

### weekplan/types.ts

- **Lines**: 39 | **McCabe**: 0
- **Responsibility**: Shared TypeScript types for weekplan modules
- **Exports**:
  - Re-exports from API: `WeekplanEntry`, `WeekplanDeltas`, `DeltaItem`
  - `ParsedIngredient`: Ingredient with quantity and name
  - `WeekplanState`: State structure for entries and offset
  - `DAY_NAMES`, `MEAL_TYPES`: Constants for day/meal configuration
  - `DayName`, `MealType`: Type definitions
  - `WeekInfo`: Week metadata structure

### weekplan/weekplan-state.ts

- **Lines**: 181 | **McCabe**: 26
- **Responsibility**: Centralized state management for weekplan entries
- **Pattern**: Observer pattern with reactive updates
- **State**:
  - `entriesStore`: Map<dateISO, Map<meal, WeekplanEntry[]>>
  - `weekOffset`: Number (0 = current week, -1 = previous, +1 = next)
  - `listeners`: Set of state change callbacks
- **Functions**:
  - `getEntries(date, meal)`: Get entries for specific date and meal
  - `getDateEntries(date)`: Get all entries for a date
  - `getAllEntries()`: Get complete entries store (read-only copy)
  - `addEntry(entry)`: Add entry to state
  - `removeEntry(entryId)`: Remove entry by ID
  - `updateEntry(entry)`: Update existing entry
  - `clearEntries()`: Clear all entries
  - `setEntries(entries)`: Bulk set entries from API
  - `getWeekOffset()`, `setWeekOffset(offset)`: Week navigation state
  - `incrementWeekOffset()`, `decrementWeekOffset()`: Week navigation helpers
  - `subscribe(listener)`: Subscribe to state changes
- **Benefits**:
  - Single source of truth for weekplan data
  - Automatic UI updates via subscriptions
  - Immutable state (returns copies)

### weekplan/weekplan-utils.ts

- **Lines**: 60 | **McCabe**: 11
- **Responsibility**: Date utility functions for weekplan
- **Functions**:
  - `getISOWeek(date)`: Calculate ISO week number
  - `getMonday(date)`: Get Monday of the week for a date
  - `formatShortDate(date)`: Format as DD.MM. for display
  - `formatISODate(date)`: Format as YYYY-MM-DD for API
  - `getWeekDates(mondayDate)`: Get array of dates for a week
  - `isToday(date)`: Check if a date is today

### weekplan/weekplan-navigation.ts

- **Lines**: 60 | **McCabe**: 6
- **Responsibility**: Week navigation functionality
- **Functions**:
  - `getCurrentWeekInfo()`: Get week metadata based on offset
  - `getWeekDisplayString()`: Format week display string (e.g., "KW 47 · 18.11. - 24.11.2024")
  - `navigateToPreviousWeek()`: Navigate to previous week
  - `navigateToNextWeek()`: Navigate to next week
  - `navigateToCurrentWeek()`: Reset to current week
  - `navigateToWeekOffset(offset)`: Navigate to specific offset

### weekplan/weekplan-websocket.ts

- **Lines**: 47 | **McCabe**: 10
- **Responsibility**: WebSocket integration for real-time weekplan updates
- **Functions**:
  - `initializeWeekplanWebSocket()`: Initialize WebSocket listeners
  - `handleWeekplanAdded(data)`: Handle weekplan entry added event
  - `handleWeekplanDeleted(data)`: Handle weekplan entry deleted event
- **Features**:
  - Updates weekplanState on incoming events
  - Dynamically adds/removes entries from DOM
  - Real-time synchronization across users

### weekplan/weekplan-print.ts

- **Lines**: 28 | **McCabe**: 6
- **Responsibility**: Print functionality for weekplan
- **Functions**:
  - `handlePrintWeekplan()`: Generate and print current week's plan
- **Features**:
  - Builds entries map for all 7 days
  - Uses print-utils for platform-specific printing
  - Includes week number and year in output

### weekplan/weekplan-rendering.ts

- **Lines**: 108 | **McCabe**: 10
- **Responsibility**: DOM rendering for weekplan entries
- **Functions**:
  - `addMealItemToDOM(container, text, entryId, recipeId?)`: Create meal item element
- **Features**:
  - Clickable entry text with hover effects
  - Delete button with confirmation
  - Dispatches custom `weekplan:show-details` event for template/recipe modals
  - Handles delete via API and broadcasts WebSocket event

### weekplan/entry-input.ts

- **Lines**: 169 | **McCabe**: 29
- **Responsibility**: Entry input field with autocomplete
- **Functions**:
  - `handleAddMealEntry(event)`: Create/manage entry input fields
  - `calculateDateForDay(dayName)`: Convert day name to ISO date
  - `createEntryInput(mealContent, meal, dayName)`: Create input field with autocomplete
- **Features**:
  - **Optimized + Button Workflow**: Rapid entry without mouse-keyboard switching
    - **Smart-Save**: Saves existing input and creates new one on + click
    - **Empty Input Behavior**: Focuses empty input instead of creating new one
    - **Error Handling**: Keeps input active if save fails
  - **Autocomplete Integration**: Shows suggestions from templates and recipes
    - Templates and weekplan suggestions first
    - Recipes marked with 🍳 emoji
    - Combined limit of 5 suggestions
  - Escape key to cancel
  - Enter key to save
  - Auto-remove on blur if empty

### weekplan/ingredient-parser/ ✨ MODULARIZED

- **Status**: ✨ **MODULARIZED** - Split from 231 lines (McCabe 60) into 7 focused modules
- **Responsibility**: Parse and adjust ingredient quantities with fractions and units
- **Modular Architecture** (`src/ui/weekplan/ingredient-parser/`):
  - **index.ts**: Public API (re-exports)
  - **constants.ts**: FRACTIONS_MAP (Unicode fractions → decimal values)
  - **fraction-converter.ts** (McCabe 9): Convert Unicode fractions to decimal
    - `convertFractionToDecimal(fractionStr)`: Handles simple (½) and mixed (1½) fractions
    - `applySign(value, minusSign)`: Apply +/- sign to values
  - **formatters.ts** (McCabe 7): Value formatting utilities
    - `formatValue(value)`: Format numbers with comma separator
    - `formatValueWithUnit(value, unit)`: Format with optional unit
    - `removeApproximationPrefix(text)`: Remove "ca. " prefix
  - **parsers.ts** (McCabe 26): Core parsing functions
    - `parseUnicodeFractionValue(text)`: Parse Unicode fractions (½, 1½)
    - `parseTextFractionValue(text)`: Parse text fractions (1/2, 2 1/2)
    - `parseUnicodeFraction(text)`: Parse with unit (½ TL, 1½ kg)
    - `parseTextFraction(text)`: Parse with unit (1/2 TL, 2 1/2 kg)
    - `parseDecimalNumber(text)`: Parse decimals (500, 2.5, 1,5)
  - **ingredient-parser.ts** (McCabe 13): Main functionality
    - `parseIngredients(ingredientLines)`: Parse ingredient lines with server units
    - `adjustQuantityByFactor(originalMenge, factor)`: Scale quantities
  - **quantity-parser.ts** (McCabe 5): Numeric quantity parsing
    - `parseQuantity(quantityStr)`: Parse numeric values (handles fractions)
- **Backward Compatibility**: Original `ingredient-parser.ts` re-exports all functions
- **Features**:
  - **Unicode Fractions**: Supports ½, ¼, ¾, ⅓, ⅔, ⅕, ⅙, ⅛, etc.
  - **Mixed Numbers**: Handles 1½, 2¼, 3⅓, etc.
  - **Text Fractions**: Parses 1/2, 2 1/2, 3/4, etc.
  - **Decimal Support**: Comma or dot separators (2.5 or 2,5)
  - **Unit Parsing**: Fetches known units from server
  - **Approximation Prefix**: Removes "ca. " before parsing
  - **Scaling**: Adjusts quantities by factor (for person count changes)
- **Architecture Benefits**:
  - **Low Complexity**: Max McCabe 26 per module (was 60)
  - **High Cohesion**: Each module has one clear responsibility
  - **Testability**: Small modules easier to unit test
  - **Reusability**: Parsers/formatters can be imported individually

### weekplan/template-modal.ts

- **Lines**: 250 | **McCabe**: 42
- **Responsibility**: Template details modal with delta management
- **Functions**:
  - `showTemplateDetails(templateName, entryId)`: Display template modal
  - `findEntryById(entryId)`: Find entry in weekplan state
- **Features**:
  - **Delta Management**: Checkboxes to remove individual items
  - **Quantity Adjustment**: Live-scaling for person count
  - **Additional Items**: Add custom items with quantities
  - **Scrollable Layout**: Template items scroll, input form stays fixed
  - **Save Changes**: Persist deltas via API
  - Loads existing deltas from entry
  - Validates items against template list

### weekplan/recipe-modal.ts ✨ REFACTORED

- **Status**: ✨ **REFACTORED** - Reduced from 363 lines to 99 lines (-73%)
- **Lines**: 99 | **McCabe**: ~20 (reduced from 53)
- **Responsibility**: Recipe details modal orchestrator with ingredient management
- **Modular Architecture** (`src/ui/weekplan/recipe-modal/`):
  - **types.ts**: RecipeModalState interface
  - **recipe-loader.ts**: Recipe fetching by ID and name
  - **ingredient-renderer.ts**: Ingredient list rendering with checkboxes
  - **delta-manager.ts**: Delta state initialization and save logic
  - **modal-builder.ts**: Modal content construction
  - **save-handler.ts**: Save functionality for recipe deltas
  - **utils.ts**: Utility functions (entry lookup, quantity parsing)
- **Functions**:
  - `showRecipeDetailsById(recipeId, entryId)`: Show recipe by ID
  - `showRecipeDetails(recipeName)`: Show recipe by name (search first)
  - `displayRecipeModal(recipeName, recipeData, entryId?)`: Display modal
- **Features**:
  - **Rezept-Parsing**: Parses ingredients with quantities and units
  - **Personenanzahl-Anpassung**: Live-scaling for portion count
  - **Delta-Management**: Checkboxes to disable individual ingredients
  - **Zusätzliche Items**: Add custom ingredients
  - **Scrollbares Layout**: Ingredients scroll, input form fixed
  - **Save Changes**: Persist deltas via API
  - Description, quantity, and full ingredient list display

### weekplan/modal-shared.ts

- **Lines**: 257 | **McCabe**: 28
- **Responsibility**: Shared modal UI components
- **Functions**:
  - `createQuantityAdjustmentSection(originalPersonCount, currentPersonCount, onAdjust)`: Person count adjuster
  - `createAddItemForm(onAddItem, existingItems?)`: Add item form with validation
  - `createAddedItemsList(addedItems, onRemove)`: Display added items with remove buttons
  - `createScrollableSection()`: Scrollable content container
  - `createFixedFormSection()`: Fixed form container at bottom
- **Features**:
  - Reusable UI components for both template and recipe modals
  - Consistent styling and behavior
  - Input validation and duplicate detection

### weekplan/index.ts

- **Lines**: 63 | **McCabe**: 2
- **Responsibility**: Barrel file for weekplan modules
- **Exports**: All weekplan functions, types, and utilities
- **Functions**:
  - `initWeekplanModule()`: Initialize WebSocket and state subscriptions
- **Benefits**:
  - Single import point for all weekplan functionality
  - Clean module boundaries
  - Easy to extend and maintain

## Weekplan Features

- **Rezept-Autocomplete**: Integration with `/api/recipes/search` endpoint
  - Recipes appear in autocomplete after templates (templates have priority)
  - Fuzzy search with case-insensitive matching
  - Limit: Maximum 10 suggestions (templates + recipes combined)
- **Template Preview**: Click on entry to view template details
  - Visual feedback (blue background, underline, blue text on hover)
  - Smart detection (case-insensitive template matching)
  - Modal display with items and quantities
- **Recipe Modal mit Personenanzahl**: Full recipe details
  - Loads complete recipe data via API
  - Shows metadata: name, category, tags, preparation time, person count
  - Ingredient list with quantity parsing
  - **Person count input**: Live-scaling of all quantities
  - **Delta management**: Checkboxes to disable individual ingredients
  - **Additional items**: Input field for custom ingredients
  - **Scrollable layout**: Ingredients scroll, input fields stay fixed
- **Delta-Struktur**: `WeekplanDeltas` with recipe support
  - `person_count?: number`: Desired person count
  - `removed_items?: string[]`: List of disabled ingredient names
  - `added_items?: Array<{name: string, menge: string}>`: Additional items
- **Server-Integration**:
  - `POST /api/weekplan`: Saves entries with `recipe_id` and `deltas`
  - Server-side ingredient processing and quantity calculations

## Benefits of Modular Refactoring

- **Complexity Reduction**: From very high to high complexity (manageable)
- **Better Organization**: Each module has single responsibility
- **Easier Maintenance**: Changes isolated to specific modules
- **Improved Testability**: Individual modules easier to test
- **No Breaking Changes**: Full backward compatibility maintained
- **Reusable Components**: Modal utilities, state management, parsing logic

---

📚 [Back to Main](../ARCHITECTURE.md) | [← Pages & Entry Points](05-pages.md) | [Next: Refactoring →](07-refactoring.md)
