# Implementation Plan: T3 Custom Increments & Chart Weight Bug Fix

**Created:** 2026-01-13
**Status:** Ready for Implementation

## Overview

Two related tasks:
1. **Bug Fix:** Chart displays wrong weight (stored vs. actual) for T3 exercises
2. **Feature:** Custom weight increments for T3 exercises (per-exercise configuration)

## Bug Fix: Chart Weight Discrepancy

### Root Cause
`src/lib/history-recorder.ts:22` uses `change.currentWeight` (stored progression weight) instead of actual workout weight when recording history entries.

### Fix
```typescript
// BEFORE (line 22)
weight: change.currentWeight,

// AFTER
weight: change.discrepancy?.actualWeight ?? change.currentWeight,
```

### Files to Modify
- `src/lib/history-recorder.ts` - Fix weight assignment

### Tests to Add
- `tests/unit/history-recorder.test.ts` - Test that history uses actual weight when discrepancy exists

---

## Feature: Custom T3 Exercise Increments

### Data Model Changes

#### 1. Update ExerciseConfig (`src/types/state.ts`)
```typescript
export interface ExerciseConfig {
  id: string
  hevyTemplateId: string
  name: string
  role?: ExerciseRole
  customIncrementKg?: number  // NEW: Per-exercise increment override (stored in kg)
}
```

#### 2. No changes to UserSettings
- Global increments remain as fallback
- Per-exercise config takes precedence

### Progression Logic Changes

#### 1. Update `src/lib/progression.ts`

Modify `getIncrementKg()` to accept optional exercise config:

```typescript
// NEW: Export for use in T3 progression
export function getIncrementKg(
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit,
  customIncrementKg?: number  // NEW PARAM
): number {
  // Use custom increment if provided
  if (customIncrementKg !== undefined && customIncrementKg > 0) {
    return customIncrementKg
  }
  // Fall back to global increment
  const userIncrement = WEIGHT_INCREMENTS[unit][muscleGroup]
  return toKg(userIncrement, unit)
}
```

Modify `calculateT3Progression()` signature:

```typescript
export function calculateT3Progression(
  current: ProgressionState,
  reps: number[],
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit,
  customIncrementKg?: number  // NEW PARAM
): ProgressionResult {
  // ...
  const increment = getIncrementKg(muscleGroup, unit, customIncrementKg)
  // ...
}
```

#### 2. Update callers of `calculateT3Progression()`

In `createPendingChangesFromAnalysis()`:
- Look up exercise config for T3 exercises
- Pass `exercise.customIncrementKg` to progression calculation

### UI Changes

#### 1. Import Wizard (`src/components/SetupWizard/`)

**Location:** `ImportReviewStep.tsx` or `ExerciseAnalysisCard.tsx`

For T3 exercises, add an increment input field:

```tsx
{exercise.role === 't3' && (
  <div className="flex items-center gap-2">
    <label>Increment:</label>
    <input
      type="number"
      step="0.5"
      min="0.5"
      max="10"
      value={exercise.customIncrementKg ?? 2.5}
      onChange={(e) => onIncrementChange(Number(e.target.value))}
      className="w-20 ..."
    />
    <span>kg</span>
  </div>
)}
```

#### 2. Settings Page (`src/components/Settings/`)

**Location:** `ExerciseManager.tsx` or new `T3IncrementManager.tsx`

Add UI to view/edit T3 exercise increments:
- List T3 exercises with current increment
- Allow editing increment per exercise
- Show default (2.5kg) if not customized

### Storage Migration

No migration needed - `customIncrementKg` is optional field:
- Existing exercises work unchanged (use global increment)
- New imports can set custom increment
- Zod schema already handles optional fields gracefully

---

## Implementation Order

### Phase 3: Bug Fix (Priority 1)
1. Fix `history-recorder.ts`
2. Add unit test for fix
3. Run existing tests to verify no regression

### Phase 4: Feature Implementation
1. Update `ExerciseConfig` type with `customIncrementKg`
2. Update `getIncrementKg()` and `calculateT3Progression()`
3. Update callers in `createPendingChangesFromAnalysis()`
4. Add UI in Import wizard for T3 increment input
5. Add UI in Settings for managing T3 increments
6. Write unit tests for custom increment logic

### Phase 5: Testing & Documentation
1. Integration tests for import flow with custom increments
2. Update ARCHITECTURE.md with new field
3. Verify full sync/push cycle works

---

## Test Cases

### Bug Fix Tests
| Test | Expected |
|------|----------|
| History entry with discrepancy | Uses actualWeight |
| History entry without discrepancy | Uses currentWeight |

### Feature Tests
| Test | Expected |
|------|----------|
| T3 progression with custom 5kg increment | Weight increases by 5kg |
| T3 progression with custom 1kg increment | Weight increases by 1kg |
| T3 progression without custom increment | Falls back to 2.5kg |
| Import T3 with custom increment saves to config | ExerciseConfig.customIncrementKg set |

---

## Notes

- All weights stored in kg internally (per ARCHITECTURE.md convention)
- Edge case: `roundWeightKg()` uses hardcoded 2.5kg rounding for deloads (acceptable for T3 since T3 never deloads)
- UI should convert kg to user's display unit (lbs) when showing
