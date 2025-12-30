# Code Quality, Testing & Performance

📚 [Back to Main](../ARCHITECTURE.md) | [← Refactoring](07-refactoring.md)

## Code Quality Metrics

### Complexity Analysis

A detailed complexity analysis is available in [complexity-report.md](../../complexity-report.md), generated using the command:

```bash
npm run complexity
```

The report includes:

- **Lines of Code**: Count of non-comment, non-empty lines per file
- **Function Count**: Total number of functions per file
- **Complexity Score**: Basic complexity metric based on control structures
- **Cyclomatic Complexity**: Measure of independent paths through code (decision points)
- **McCabe Complexity**: Extended cyclomatic complexity including function count

### Complexity Metrics Summary

- **Total files analyzed**: 68 TypeScript files (includes 13 API modules + 13 weekplan modules)
- **Total lines of code**: 13,071 lines
- **Total functions**: 628 functions
- **Average complexity**: 20.94 ⬇️ (was 25.44, originally 33.31)
- **Average cyclomatic complexity**: 21.84 ⬇️ (was 26.85, originally 35.17)
- **Average McCabe complexity**: 31.07 ⬇️ (was 37.87, originally 49.60)

### Complexity Ratings

According to McCabe Complexity thresholds:

- **1-10**: Simple, low risk
- **11-20**: More complex, moderate risk
- **21-50**: Complex, high risk
- **51+**: Very complex, very high risk

**Current distribution** (per [complexity-report.md](../../complexity-report.md)):

- **Total files**: 140
- **Average McCabe complexity**: 15.91 (down from previous highs)
- **Files with very high complexity (>50)**: 0 ✅ (down from 12+ before refactorings!)
- **Files with high complexity (21-50)**: 45
- **Files with moderate/low complexity**: 95 (68% of all files)
- **Note**: Refactorings successfully eliminated all files with McCabe >50, significantly improving maintainability

### Top 3 Most Complex Files (current)

1. **[src/data/api/stores-api.ts](../../src/data/api/stores-api.ts)**: McCabe 50, 239 lines
   - Store and department API operations

2. **[src/ui/shopping-list-ui.ts](../../src/ui/shopping-list-ui.ts)**: McCabe 49, 247 lines
   - Shopping list feature with event handling, state management, and modal dialogs

3. **[src/ui/user-admin.ts](../../src/ui/user-admin.ts)**: McCabe 48, 212 lines
   - User administration UI with CRUD operations

**Recent Refactoring Success** (9 files refactored):

- ✨ **api.ts**: McCabe 317 → 0 (re-exports, 13 modules)
- ✨ **weekplan.ts**: McCabe 251 → 35 (228 lines, 13 modules)
- ✨ **store-admin.ts**: 465 → 114 lines (-75%, 5 modules)
- ✨ **user-menu.ts**: 387 → 60 lines (-84%, 5 modules)
- ✨ **websocket.ts**: 401 → 43 lines (-90%, 9 modules)
- ✨ **store-state.ts**: 662 → 181 lines (-73%, 5 modules)
- ✨ **webdav-admin.ts**: 465 → 42 lines (-91%, 4 modules)
- ✨ **recipe-modal.ts**: 363 → 99 lines (-73%, 7 modules)
- ✨ **dropdown.ts**: 490 → 61 lines (-88%, 6 modules)

---

## Testing Strategy

### Unit Tests (Data Layer)

- Mock fetch API
- Mock localStorage
- Test all success/error paths
- Test token refresh mechanism

### Integration Tests

- Test layer interactions
- Verify data flow
- Test authentication flow

### Current Coverage

- **445 tests total** (19 test suites)
- **85%+ overall code coverage**
- All critical paths tested

### Test Breakdown by Layer

**Data Layer**: 68 tests (99.5%+ coverage)

- auth.ts: 100% coverage (36 tests including token refresh optimization)
- api.ts: 100% coverage (18 tests including 401 handling and edge cases)
- dom.ts: 98% coverage (14 tests including template caching and DOM batching)

**State Layer**: 93 tests (100% coverage)

- shopping-list-state.ts: 100% coverage (35 tests)
- user-state.ts: 100% coverage (24 tests)
- store-state.ts: 100% coverage (34 tests including CRUD operations)

**UI Layer**: 87 tests (98%+ coverage)

- shopping-list-ui.ts: 97% coverage (29 tests including edit/delete-by-date/print features)
- user-menu.ts: 100% coverage (16 tests)
- button.ts: 100% coverage (17 tests)
- store-admin.ts: 100% coverage (27 tests)
- product-admin.ts: 100% coverage (15 tests)
- Tests updated for Toast notifications

**Pages Layer**: 20 tests (100% coverage)

- login.ts: 100% coverage

### Component Library

- **9 components**: Button, Modal, Card, Input, Loading, Dropdown, Tabs, Toast, DatePicker
- **New Components (Dropdown, Tabs, Toast, DatePicker)**: Fully implemented with TypeScript types and style injection
- **Toast Integration**: All alert() calls replaced with Toast notifications across product-admin, store-admin, and shopping-list-ui
- **DatePicker Integration**: Full calendar component with German localization used for shopping date selection
- **Test Coverage**: All tests updated to expect Toast notifications instead of alert() calls (17 test files updated)

---

## Performance Considerations

### Optimization Strategies

#### 1. Token Refresh

Optimized to prevent unnecessary refresh requests:

- **Singleton Pattern**: Only one refresh happens at a time, even with concurrent API calls
- **Cooldown Period**: 5-second cooldown prevents excessive refresh requests
- **Promise Caching**: Concurrent refresh requests wait for the same promise
- **Example**: If `fetchItems()`, `addItem()`, and `deleteItem()` are called simultaneously, only one token refresh occurs

#### 2. Event Delegation

Efficient delete button handling:

- **Single Listener**: One event listener on the parent `<ul>` handles all delete buttons
- **Memory Efficiency**: No individual listeners attached to each button element
- **Dynamic Content**: Works seamlessly with dynamically added/removed items
- **Double-Click Prevention**: Buttons are disabled during deletion to prevent multiple requests
- **Performance Impact**: With 100 items, this saves 99 event listeners (99% reduction)
- **Implementation**: Uses `data-item-id` attributes and class checking for event routing

#### 3. Template Loading

Intelligent caching system:

- **Memory Cache**: Templates stored in `Map<string, string>` after first fetch
- **Zero Network Cost**: Subsequent loads use cached HTML (no fetch)
- **Load Flag**: `isTemplateLoaded` prevents redundant DOM updates
- **Performance Impact**: First load ~50-100ms (fetch), subsequent loads <1ms (cache)
- **Example**: Refreshing page or navigating back uses cached template

#### 4. Minimal Reflows

DocumentFragment batching:

- **Batch Operations**: Uses `DocumentFragment` to build DOM tree in memory
- **Single Insertion**: One `appendChild()` call triggers one reflow
- **Performance Impact**: O(1) reflows instead of O(n) for n items
- **Real-World Gains**:
  - 10 items: ~0.5ms saved (marginal but cleaner code)
  - 100 items: ~5-10ms saved (noticeable improvement)
  - 1000 items: ~50-100ms saved (significant improvement)
- **Example**: Rendering 100-item shopping list triggers 1 reflow, not 100

### Bundle Size

- TypeScript compiled to ES2020 modules
- Native browser modules (no bundler)
- Tree-shakeable imports

---

## Troubleshooting

### Common Issues

**Import Errors**:

- Ensure `.js` extension in imports (required for ES modules)
- Check relative paths (`../data/` not `./data/`)

**Authentication Issues**:

- Check localStorage for token
- Verify token refresh in Network tab
- Confirm 401 handling redirects to login

**Build Errors**:

- Run `npm run build` after file moves
- Check TypeScript errors with `tsc --noEmit`

---

## Future Enhancements

### Potential Improvements

1. ~~**State Management**: Add centralized state (e.g., observables)~~ ✅ **IMPLEMENTED** - Observer pattern with shopping-list-state, user-state, and store-state
2. ~~**Store State**: Extend state management to stores, departments, and products~~ ✅ **IMPLEMENTED** - Full CRUD operations in store-state
3. ~~**Component Library**: Reusable UI components~~ ✅ **IMPLEMENTED** - 10 components: Button, Modal, Card, Input, Loading, Dropdown, Tabs, Toast, DatePicker, ConnectionStatus
4. ~~**Component Integration**: Use components across application~~ ✅ **IMPLEMENTED** - Modal, Button, and Toast components used throughout the application
5. ~~**Additional Components**: Extend component library~~ ✅ **IMPLEMENTED** - Dropdown (native & searchable), Tabs, Toast notifications, DatePicker
6. ~~**Replace alert() calls**: Convert to Toast notifications~~ ✅ **IMPLEMENTED** - All alert() calls replaced with Toast in product-admin, store-admin, and shopping-list-ui
7. ~~**Real-time Updates**: WebSocket integration for collaborative lists~~ ✅ **IMPLEMENTED** - Full WebSocket integration with auto-reconnection, heartbeat, and ConnectionStatus UI
8. **Offline Support**: Service worker for PWA capabilities with IndexedDB sync
9. **More UI Modules**: Advanced search, smart filters, category management
10. **Performance Monitoring**: Add analytics and performance tracking
11. **Accessibility Enhancements**: Full WCAG 2.1 AA compliance

### Architecture Evolution

- Previous: 3-layer architecture (Data → UI → Pages)
- Current: **4-layer architecture** (Data → State → UI → Pages)
- Added State Layer with Observer pattern for reactive updates
- Extended state management to all major data entities:
  - shopping-list-state: Shopping list items with CRUD
  - user-state: User management and authentication state
  - store-state: Stores, departments, and products with full CRUD operations
- Maintains separation of concerns principle
- Consistent API across all state managers

---

## References

- [TypeScript Configuration](../../tsconfig.json)
- [Jest Configuration](../../jest.config.js)
- [Complexity Report](../../complexity-report.md)
- [Main README](../../README.md)
- [Project Root README](../../../README.md)

---

📚 [Back to Main](../ARCHITECTURE.md) | [← Refactoring](07-refactoring.md)
