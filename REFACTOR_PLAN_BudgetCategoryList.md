# BudgetCategoryList Component Refactoring Plan

**Objective**: Break down the 979-line BudgetCategoryList.vue component into smaller, more maintainable components without breaking existing logic
**Priority**: High
**Estimated Time**: 12-16 hours

## Current Analysis

### Issues Identified
- [x] **Size**: 979 lines - way too large for maintainability
- [x] **Console Logs**: 20 console.log/console.error statements that need removal
- [x] **Multiple Responsibilities**: Handles rendering, drag & drop, modals, money movement, filtering
- [x] **Complex Template**: Multiple nested draggable sections with similar structure
- [x] **Heavy Script Section**: 640+ lines of JavaScript logic
- [x] **Unused Functions**: `getReactiveCategoriesForGroup` function (line 379) is defined but never used

### Console Logs to Remove
- Lines 534, 540, 544, 557, 559, 571, 578, 584, 588, 601, 603 (drag & drop logging)
- Lines 780, 860, 874, 889, 905 (error logging - keep console.error for debugging)

### Unused Code to Remove
- `getReactiveCategoriesForGroup` function (lines 379-384) - not referenced anywhere in template or script

## Progress

### Phase 1: Extract Reusable Components
- [ ] Create `CategoryGroupHeader.vue` component
- [ ] Create `CategoryItem.vue` component  
- [ ] Create `HiddenCategoriesSection.vue` component
- [ ] Create `EmptyState.vue` component
- [ ] Create `CategoryListHeader.vue` component

### Phase 2: Extract Business Logic
- [ ] Create `useCategoryListState.ts` composable
- [ ] Create `useCategoryDragAndDrop.ts` composable
- [ ] Create `useCategoryModals.ts` composable
- [ ] Create `useMoneyMovement.ts` composable

### Phase 3: Refactor Main Component
- [ ] Update main component to use extracted components
- [ ] Remove console logs (keep console.error for production debugging)
- [ ] Simplify template structure
- [ ] Test all functionality works correctly

### Phase 4: Testing & Validation
- [ ] Test drag & drop functionality
- [ ] Test modal operations (create, edit, delete)
- [ ] Test money movement operations
- [ ] Test filtering functionality
- [ ] Test expansion/collapse state persistence

## Implementation Details

### Create CategoryGroupHeader.vue
- **Code Location**: `BFB-Frontend/src/components/budget/CategoryGroupHeader.vue`
- **Change Description**: Extract group header rendering logic (lines 47-84)
- **Technical Approach**: Accept group data as props, emit events for actions
- **Dependencies**: Icons, formatCurrency utility, drag handle logic
- **Props**: `group`, `expandedGroups`, `getGroupTotals` function
- **Events**: `toggle-group`, `edit-group`, `create-category`

### Create CategoryItem.vue  
- **Code Location**: `BFB-Frontend/src/components/budget/CategoryItem.vue`
- **Change Description**: Extract individual category rendering (lines 99-134)
- **Technical Approach**: Accept category data as props, emit events for interactions
- **Dependencies**: Badge, CalculationInput, Edit icon, drag handle
- **Props**: `category`, `isCreditCardPayment`, `getBadgeVariant` function
- **Events**: `edit-category`, `update-assigned`, `available-click`

### Create HiddenCategoriesSection.vue
- **Code Location**: `BFB-Frontend/src/components/budget/HiddenCategoriesSection.vue` 
- **Change Description**: Extract hidden categories section (lines 142-214)
- **Technical Approach**: Separate component for hidden categories with own draggable
- **Dependencies**: Draggable, CategoryItem (modified for hidden state)
- **Props**: `hiddenCategoriesGroup`, `expandedGroups`, `categoryLists`
- **Events**: `toggle-group`, `unhide-category`, `reorder-categories`

### Create useCategoryListState.ts
- **Code Location**: `BFB-Frontend/src/composables/categories/useCategoryListState.ts`
- **Change Description**: Extract state management logic (lines 311-514)
- **Technical Approach**: Manage expanded groups, category lists, filtering
- **Dependencies**: Category store, budget store, local storage utilities
- **Exports**: `expandedGroups`, `categoryLists`, `toggleGroup`, filtering functions

### Create useCategoryDragAndDrop.ts
- **Code Location**: `BFB-Frontend/src/composables/categories/useCategoryDragAndDrop.ts`
- **Change Description**: Extract drag & drop logic (lines 530-609)
- **Technical Approach**: Handle reordering for both groups and categories
- **Dependencies**: Reorder composables, category validation
- **Exports**: `onGroupChange`, `onChange`, validation functions

### Create useCategoryModals.ts
- **Code Location**: `BFB-Frontend/src/composables/categories/useCategoryModals.ts`
- **Change Description**: Extract modal state and handlers (lines 630-774)
- **Technical Approach**: Manage all modal states and their event handlers
- **Dependencies**: Modal components, category/group types
- **Exports**: Modal states, open/close functions, event handlers

### Create useMoneyMovement.ts
- **Code Location**: `BFB-Frontend/src/composables/categories/useMoneyMovement.ts`
- **Change Description**: Extract money movement logic (lines 784-909)
- **Technical Approach**: Handle move/pull money operations and available click logic
- **Dependencies**: Money movement composables, category filtering
- **Exports**: `handleAvailableClick`, money movement handlers, available categories

## Success Criteria

### Manual Testing Steps
- [ ] Verify all category groups render correctly
- [ ] Test drag & drop reordering for both groups and categories
- [ ] Confirm modal operations (create, edit, delete) work properly
- [ ] Test money movement (move/pull) functionality
- [ ] Verify filtering works (all, overspent, money available)
- [ ] Check expansion/collapse state persists across page refreshes
- [ ] Ensure hidden categories section functions correctly
- [ ] Test optimistic updates and error handling

### Expected Behavior
- [ ] Component loads faster due to smaller bundle size
- [ ] Code is more maintainable with clear separation of concerns
- [ ] No console logs in production (except console.error for debugging)
- [ ] All existing functionality preserved
- [ ] Improved developer experience with smaller, focused files

### Edge Cases to Test
- [ ] Empty state when no categories exist
- [ ] Credit card payment categories (non-draggable, non-editable)
- [ ] System groups vs regular groups behavior
- [ ] Filter changes with expanded/collapsed states
- [ ] Error scenarios during drag & drop operations
- [ ] Modal positioning and responsive behavior

### Performance Considerations
- [ ] Verify no performance regression in rendering
- [ ] Check that reactivity still works correctly
- [ ] Ensure drag & drop remains smooth
- [ ] Validate memory usage hasn't increased

### Rollback Plan
- [ ] Keep original component as backup until testing complete
- [ ] Document any breaking changes discovered
- [ ] Have migration path ready if issues found
- [ ] Ensure all imports/exports are properly updated

## Notes
- **Priority Order**: Start with extracting components (Phase 1), then composables (Phase 2)
- **Testing**: Test each extracted component individually before integration
- **Console Logs**: Remove debug logs but keep error logging for production debugging
- **Backward Compatibility**: Ensure parent components don't need changes
- **Performance**: Monitor bundle size and runtime performance during refactoring
