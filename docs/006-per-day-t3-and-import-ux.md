# Feature: Per-Day T3 Accessories & Tabbed Import Workflow

## Summary

Redesign both import and create workflows with T3 storage to support:
1. **Per-day T3 accessories** - Different T3 exercises on A1 vs B1 vs A2 vs B2
2. **Tabbed import review** - Review each day separately with T1/T2/T3 verification
3. **Per-day weight entry** - Show T1+T2 weights within each day's tab
4. **Tabbed create workflow** - Assign T3 exercises per-day during routine creation

## Schema Changes

### `src/types/state.ts`

**Add `t3Schedule` to GZCLPState:**
```typescript
export interface GZCLPState {
  // ... existing fields
  t3Schedule: Record<GZCLPDay, string[]>  // NEW: Maps day to T3 exercise IDs
}
```

**Add `DayImportData` type:**
```typescript
export interface DayImportData {
  day: GZCLPDay
  t1: ImportedExercise | null
  t2: ImportedExercise | null
  t3s: ImportedExercise[]
}
```

**Restructure `ImportResult`:**
```typescript
export interface ImportResult {
  byDay: Record<GZCLPDay, DayImportData>  // Changed from flat exercises[]
  warnings: ImportWarning[]
  routineIds: RoutineAssignment
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/types/state.ts` | Add `t3Schedule`, `DayImportData`, restructure `ImportResult` |
| `src/lib/constants.ts` | Add initial empty `t3Schedule` |
| `src/lib/routine-importer.ts` | Extract T3s from ALL routines (not just A1), return per-day structure |
| `src/lib/role-utils.ts` | Update `getExercisesForDay()` to accept `t3Schedule` param |
| `src/hooks/useRoutineImport.ts` | Handle per-day import result, add per-day update methods |
| `src/hooks/useProgram.ts` | Add `setT3Schedule()` method |
| `src/components/SetupWizard/ImportReviewStep.tsx` | Complete rewrite with tabbed interface |
| `src/components/SetupWizard/DayTabBar.tsx` | NEW: Tab navigation for A1/B1/A2/B2 |
| `src/components/SetupWizard/DayReviewPanel.tsx` | NEW: Single day T1/T2/T3 review |
| `src/components/SetupWizard/ExerciseAssignmentStep.tsx` | UPDATE: Add tabbed per-day T3 assignment for create path |
| `src/components/SetupWizard/index.tsx` | Fix MainLiftVerification bug (values not saved), update both flows |
| `src/components/Dashboard/index.tsx` | Use `t3Schedule` for day-specific T3s |

## Implementation Phases (TDD - Tests First)

### Phase 1: Schema & Types
**Tests:**
- [x] Test `t3Schedule` type definition compiles
- [x] Test `DayImportData` type structure
- [x] Test `ImportResult` new structure with `byDay`

**Implementation:**
- [x] Update `src/types/state.ts` with new types
- [x] Update `src/lib/constants.ts` with initial empty `t3Schedule`

### Phase 2: Core Logic - Routine Importer
**Tests:**
- [x] Test `extractFromRoutines()` returns `byDay` structure
- [x] Test T3 extraction from ALL 4 routines (not just A1)
- [x] Test T3 extraction from positions 2+ of each routine
- [x] Test deduplication of same exercise appearing in multiple days' T3s

**Implementation:**
- [x] Rewrite `extractFromRoutines()` in `src/lib/routine-importer.ts`
- [x] Extract T3s from ALL 4 routines (positions 2+)
- [x] Return `byDay: Record<GZCLPDay, DayImportData>` structure

### Phase 3: Core Logic - Role Utils
**Tests:**
- [x] Test `getExercisesForDay()` with `t3Schedule` parameter
- [x] Test T3 filtering returns only day-specific T3s
- [x] Test empty `t3Schedule` returns no T3s

**Implementation:**
- [x] Update `getExercisesForDay()` signature in `src/lib/role-utils.ts`
- [x] Add `t3Schedule` parameter
- [x] Filter T3s by day from `t3Schedule[day]`

### Phase 4: Hooks
**Tests:**
- [x] Test `useRoutineImport` stores per-day import data
- [x] Test `updateDayExercise(day, position, updates)` method
- [x] Test `useProgram.setT3Schedule()` method

**Implementation:**
- [x] Update `src/hooks/useRoutineImport.ts` for per-day state
- [x] Update `src/hooks/useProgram.ts` with `setT3Schedule()`

### Phase 5: UI Components - Tab Navigation
**Tests:**
- [x] Test `DayTabBar` renders 4 day tabs (A1, B1, A2, B2)
- [x] Test active tab highlighting
- [x] Test checkmark indicator for validated days
- [x] Test tab click calls `onDayChange` callback

**Implementation:**
- [x] Create `src/components/SetupWizard/DayTabBar.tsx`

### Phase 6: UI Components - Day Review Panel
**Tests:**
- [x] Test `DayReviewPanel` renders T1 exercise card
- [x] Test `DayReviewPanel` renders T2 exercise card
- [x] Test `DayReviewPanel` renders T3 list
- [x] Test weight input for T1/T2 exercises
- [x] Test T3 removal callback

**Implementation:**
- [x] Create `src/components/SetupWizard/DayReviewPanel.tsx`

### Phase 7: Import Review Step Rewrite
**Tests:**
- [x] Test `ImportReviewStep` renders tabbed interface
- [x] Test tab navigation switches displayed day content
- [x] Test validation requires all days to have T1/T2 confirmed
- [x] Test continue button disabled until all days validated

**Implementation:**
- [x] Rewrite `src/components/SetupWizard/ImportReviewStep.tsx`
- [x] Use `DayTabBar` for navigation
- [x] Use `DayReviewPanel` for each day's content

### Phase 8: Bug Fix - MainLiftVerification Weights
**Tests:**
- [x] Test `handleNextWorkoutComplete()` uses `mainLiftWeights` values
- [x] Test weights from `MainLiftVerification` are saved correctly

**Implementation:**
- [x] Fix `src/components/SetupWizard/index.tsx`
- [x] Use `mainLiftWeights` when saving (currently ignored)
- [x] Save `t3Schedule` when import completes

### Phase 9: Create Workflow
**Tests:**
- [x] Test create flow exercise assignment step has tabs
- [x] Test per-day T3 selection works
- [x] Test main lifts remain global
- [x] Test `t3Schedule` saved when create completes

**Implementation:**
- [x] Update `src/components/SetupWizard/SlotAssignment.tsx` (renamed from ExerciseAssignmentStep)
- [x] Add tabbed interface using `DayTabBar`
- [x] Update create flow in `index.tsx`

### Phase 10: Dashboard Integration
**Tests:**
- [x] Test Dashboard uses `t3Schedule` for day-specific T3s
- [x] Test correct T3s shown for each day

**Implementation:**
- [x] Update `src/components/Dashboard/index.tsx`
- [x] Pass `t3Schedule` to `getExercisesForDay()`

### Phase 11: Cleanup
**Tasks:**
- [x] Remove legacy global T3 handling code
- [x] Update any remaining callers of old signatures

**Changes made:**
- Removed `updateExercise` legacy method from `useRoutineImport` hook
- Replaced with per-day methods: `updateDayExercise`, `updateDayT3`, `removeDayT3`
- Removed deprecated `exercises` field from `ImportResult` type
- Updated `routine-importer.ts` to no longer populate flat exercises array
- Fixed SetupWizard to use new `onDayExerciseUpdate` and `onDayT3Remove` callbacks
- Updated test mocks and added `getAllExercises()` helper for test compatibility

## Key Design Decisions

1. **T3 Storage**: `t3Schedule: Record<GZCLPDay, string[]>` mapping
   - Exercises stored once in `exercises` catalog
   - Day scheduling is explicit in `t3Schedule`
   - Same T3 on multiple days = same entry in `exercises`, IDs in multiple day arrays

2. **T3 Progression**: Shared across days
   - If lat pulldown on A1 and B2, both use same progression state
   - User strength is universal, not day-dependent

3. **UI Structure**: Single ImportReviewStep with internal tabs
   - Not 4 separate wizard steps
   - Easier validation state management
   - Natural grouping of related work

## Bug Fix (Critical)

`handleNextWorkoutComplete()` in `SetupWizard/index.tsx` currently uses weights from `importResult.exercises[].userWeight || detectedWeight` but **ignores** the `mainLiftWeights` state that `MainLiftVerification` component updates. This must be fixed to use the correct weight source.
