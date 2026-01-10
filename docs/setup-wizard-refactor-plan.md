# Implementation Plan: SetupWizard State Management Refactor

**Created:** 2026-01-10
**Status:** Ready for implementation

---

## Problem Statement

The SetupWizard component (`src/components/SetupWizard/index.tsx`, 713 lines) has a critical architectural issue in `handleNextWorkoutComplete` (lines 148-383):

1. **Direct localStorage writes** - Bypasses React state management using `STORAGE_KEYS.CONFIG`, `STORAGE_KEYS.PROGRESSION`, `STORAGE_KEYS.HISTORY`
2. **Forced page reload** - Uses `window.location.reload()` to ensure Dashboard reads fresh data
3. **Tight coupling** - Creates dependency on localStorage key names
4. **Race conditions** - React state updates may not complete before navigation

This bypasses the existing `importState()` function in `useProgram` hook, which atomically updates all three storage domains.

---

## Solution Overview

Replace direct localStorage writes with:
1. Pure functions in `src/lib/program-builder.ts` that build complete `GZCLPState` objects
2. Single `program.importState(state)` call to persist atomically
3. Let React Router's `CompletedGuard` handle navigation naturally

---

## Implementation Phases

### Phase 1: Create program-builder.ts (TDD)

Create `src/lib/program-builder.ts` with two main functions:

```typescript
import { generateId } from '@/utils/id'
import { createInitialState } from '@/lib/state-factory'
import { getProgressionKey, getT1RoleForDay, getT2RoleForDay } from '@/lib/role-utils'
import type { GZCLPState, ImportResult, GZCLPDay, WeightUnit, ExerciseHistory } from '@/types/state'
import type { ExerciseTemplate } from '@/types/hevy'

// For import path
interface ImportPathParams {
  importResult: ImportResult
  selectedDay: GZCLPDay
  apiKey: string
  unit: WeightUnit
  workoutsPerWeek: number
  workoutStats: {
    createdAt: string
    totalWorkouts: number
    mostRecentWorkoutDate: string | null
  }
  progressionHistory: Record<string, ExerciseHistory>
}

export function buildImportProgramState(params: ImportPathParams): GZCLPState

// For create path
interface CreatePathParams {
  assignments: {
    mainLifts: Record<MainLiftRole, string | null>
    t3Exercises: Record<GZCLPDay, string[]>
  }
  weights: Record<string, number>
  exerciseTemplates: ExerciseTemplate[]
  selectedDay: GZCLPDay
  apiKey: string
  unit: WeightUnit
  workoutsPerWeek: number
}

export function buildCreateProgramState(params: CreatePathParams): GZCLPState
```

**Key implementation details:**
- Use `generateId()` from `@/utils/id` for exercise IDs
- Use `createInitialState()` as base to ensure schema compliance
- Use `Map<string, string>` to deduplicate exercises (templateId → exerciseId)
- Generate progression keys using `getProgressionKey()` from role-utils

### Phase 2: Write Unit Tests

Create `tests/unit/program-builder.test.ts`:

```typescript
describe('buildImportProgramState', () => {
  it('should build valid GZCLPState from ImportResult')
  it('should deduplicate exercises across days')
  it('should generate correct progression keys for main lifts')
  it('should use exerciseId as key for T3 exercises')
  it('should set apiKey and exercises (satisfies isSetupRequired)')
  it('should include progression history')
})

describe('buildCreateProgramState', () => {
  it('should build valid GZCLPState from assignments')
  it('should set initial weights in progression')
  it('should build t3Schedule correctly')
})
```

### Phase 3: Refactor SetupWizard Import Path

Update `handleNextWorkoutComplete` (lines 148-383):

**Before:**
```typescript
// ~235 lines of iterative addExercise calls, localStorage writes, reload
```

**After:**
```typescript
const handleNextWorkoutComplete = useCallback(async () => {
  if (routineSourceMode === 'import' && routineImport.importResult) {
    // Fetch async data
    const allWorkouts = await hevy.getAllWorkouts()
    const weeksResult = calculateCreatedAtFromWorkouts(...)
    const historyResult = await importProgressionHistory(...)

    // Build complete state
    const state = buildImportProgramState({
      importResult: routineImport.importResult,
      selectedDay,
      apiKey: program.state.apiKey,
      unit,
      workoutsPerWeek: program.state.program.workoutsPerWeek,
      workoutStats: {
        createdAt: weeksResult.calculatedCreatedAt,
        totalWorkouts: weeksResult.matchingWorkoutCount,
        mostRecentWorkoutDate: weeksResult.mostRecentWorkoutDate,
      },
      progressionHistory: historyResult.history,
    })

    // Atomic import - CompletedGuard handles navigation
    program.importState(state)
    return
  }

  // Create path fallback (Phase 4)
  program.setCurrentDay(selectedDay)
  setCurrentStep('complete')
}, [/* deps */])
```

### Phase 4: Refactor SetupWizard Create Path

The create path has two stages:
1. `handleWeightsNext` - builds exercises and t3Schedule
2. `handleNextWorkoutComplete` - sets currentDay

Refactor to build complete state at `handleWeightsNext`:

```typescript
const handleWeightsNext = useCallback(() => {
  const state = buildCreateProgramState({
    assignments,
    weights,
    exerciseTemplates: hevy.exerciseTemplates,
    selectedDay,
    apiKey: program.state.apiKey,
    unit,
    workoutsPerWeek: program.state.program.workoutsPerWeek,
  })

  program.importState(state)
  // CompletedGuard redirects to /
}, [/* deps */])
```

### Phase 5: Update Router

Remove the reload workaround in `src/router.tsx`:

**Before (lines 90-98):**
```typescript
function SetupPage() {
  return <SetupWizard onComplete={() => {
    window.location.href = '/'
  }} />
}
```

**After:**
```typescript
function SetupPage() {
  return <SetupWizard onComplete={() => {
    // No-op: CompletedGuard handles navigation when isSetupRequired becomes false
  }} />
}
```

### Phase 6: Cleanup

- Remove `STORAGE_KEYS` import from SetupWizard (no longer needed)
- Remove console.log debug statements
- Update SetupWizard props if `onComplete` is no longer needed

---

## Critical Success Criteria

1. **isSetupRequired becomes false** - Builder must set:
   - `state.apiKey` (non-empty string)
   - `state.exercises` (at least one exercise)

2. **Progression keys match existing format:**
   - Main lifts: `{role}-T1`, `{role}-T2` (e.g., "squat-T1")
   - T3 exercises: `{exerciseId}` (UUID)

3. **All 1178 tests pass** - Run `npm test` after each phase

4. **Both paths work:**
   - Import from Hevy: Dashboard shows imported exercises and weights
   - Create new: Dashboard shows selected exercises with initial weights

5. **No page reload** - Navigation happens via React Router guards

---

## Files to Create/Modify

| File | Action | Phase |
|------|--------|-------|
| `src/lib/program-builder.ts` | Create | 1 |
| `tests/unit/program-builder.test.ts` | Create | 2 |
| `src/components/SetupWizard/index.tsx` | Modify | 3-4 |
| `src/router.tsx` | Modify | 5 |

---

## Gemini Code Review Summary

Gemini confirmed the approach with these key recommendations:
- Use `generateId()` from `@/utils/id` for UUID generation in pure functions
- Use `createInitialState()` from `@/lib/state-factory` as base to ensure schema compliance
- Ensure `apiKey` and `exercises` are populated (required for `isSetupRequired === false`)
- The pure function approach improves testability and decouples logic from React lifecycle

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Guard doesn't redirect | Test that isSetupRequired becomes false after importState |
| Missing state fields | Use createInitialState() as base |
| Async operations fail | Keep existing try/catch, add error handling |
| Tests break | Run tests after each phase, fix incrementally |
