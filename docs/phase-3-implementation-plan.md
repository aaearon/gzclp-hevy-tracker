# Phase 3: Core Logic - Role Utils

## Overview

Update `getExercisesForDay()` in `src/lib/role-utils.ts` to accept a `t3Schedule` parameter and filter T3 exercises by day.

## Current State

- `getExercisesForDay(exercises, day)` returns ALL T3 exercises regardless of day (line 58 in NextWorkout, line 197 in Dashboard)
- `t3Schedule: Record<GZCLPDay, string[]>` already defined in state.ts and constants.ts (Phase 1)

## Implementation (TDD)

### Step 1: Write Tests First

**File:** `tests/unit/role-utils.test.ts`

1. Create `allT3Schedule` helper (maps all T3 IDs to all days for existing tests):
   ```typescript
   const allT3Schedule: Record<GZCLPDay, string[]> = {
     A1: ['curls', 'rows'], B1: ['curls', 'rows'],
     A2: ['curls', 'rows'], B2: ['curls', 'rows']
   }
   ```

2. Update ALL existing `getExercisesForDay()` calls (lines 133, 139, 144, 152, 160, 168, 179, 188) to pass `allT3Schedule`

3. Add new describe block after existing tests:
   ```typescript
   describe('per-day T3 filtering', () => {
     it('should return only T3s scheduled for the specified day')
     it('should return empty T3 array when day has no scheduled T3s')
     it('should return multiple T3s when day has multiple scheduled')
   })
   ```

### Step 2: Update Function Signature

**File:** `src/lib/role-utils.ts` (line 126)

```typescript
export function getExercisesForDay(
  exercises: Record<string, ExerciseConfig>,
  day: GZCLPDay,
  t3Schedule: Record<GZCLPDay, string[]>
): DayExercises
```

### Step 3: Update T3 Filtering Logic

**File:** `src/lib/role-utils.ts` (around line 146)

```typescript
} else if (role === 't3') {
  if (t3Schedule[day].includes(exercise.id)) {
    result.t3.push(exercise)
  }
}
```

### Step 4: Update NextWorkout Component

**File:** `src/components/Dashboard/NextWorkout.tsx`

1. Add to interface (line 12-17):
   ```typescript
   interface NextWorkoutProps {
     // ... existing
     t3Schedule: Record<GZCLPDay, string[]>  // NEW
   }
   ```

2. Update function signature (line 56):
   ```typescript
   export function NextWorkout({ day, exercises, progression, weightUnit, t3Schedule }: NextWorkoutProps)
   ```

3. Update call (line 58):
   ```typescript
   const dayExercises = getExercisesForDay(exercises, day, t3Schedule)
   ```

### Step 5: Update Dashboard Component

**File:** `src/components/Dashboard/index.tsx`

1. Add `t3Schedule` to state destructuring
2. Update `getExercisesForDay()` call to pass `t3Schedule`
3. Pass `t3Schedule` prop to `<NextWorkout>`

### Step 6: Update Integration Tests

**File:** `tests/integration/dashboard-role-grouping.test.tsx`

Update mock state to include `t3Schedule` with appropriate test values.

## Files to Modify

| File | Change |
|------|--------|
| `tests/unit/role-utils.test.ts` | Add new tests, update existing calls |
| `src/lib/role-utils.ts` | Add param, filter T3s by day |
| `src/components/Dashboard/NextWorkout.tsx` | Add t3Schedule prop, use in call |
| `src/components/Dashboard/index.tsx` | Pass t3Schedule to function and NextWorkout |
| `tests/integration/dashboard-role-grouping.test.tsx` | Update mock state |

## Verification

```bash
npm test
```

All tests should pass after implementation.

## Doc Update

Update `docs/006-per-day-t3-and-import-ux.md` Phase 3 checkboxes to `[x]`.
