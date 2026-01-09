# Feature 008: Dashboard Stats from Hevy Workout History

## Problem
When importing an existing GZCLP program from Hevy, the Dashboard shows incorrect values for:
- **Current Week**: Shows 1 even for users who have completed many workouts
- **Total Workouts**: Shows 0 (progression.lastWorkoutId not populated during import)
- **Days Since Last**: Shows "-" (progression.lastWorkoutDate not populated during import)

## Solution
At import time, fetch workout history and store two pieces of data:
1. **totalWorkouts**: Count of workouts matching GZCLP routine IDs
2. **mostRecentWorkoutDate**: Date of most recent matching workout

**Current Week formula:**
```
currentWeek = floor(totalWorkouts / workoutsPerWeek) + 1
```
- 0-2 workouts (3/week) = Week 1
- 3-5 workouts = Week 2
- 6-8 workouts = Week 3
- etc.

## Scope
- **Display stats only** - no changes to progression logic
- **At import time** - stats populated from workout history
- **Direct localStorage write** - avoids React state race condition during navigation
- **Fallback support** - stats functions fall back to progression data if stored values not available
- **Configurable workouts per week** - user selects 2, 3, or 4 on welcome screen

---

## Implementation Summary

### Files Created
| File | Purpose |
|------|---------|
| `tests/helpers/workout-mocks.ts` | Test helpers for creating mock Workout objects |
| `tests/unit/weeks-calculator.test.ts` | Tests for weeks calculation logic (31 tests) |
| `tests/unit/hevy-client-getAllWorkouts.test.ts` | Tests for getAllWorkouts pagination |
| `src/lib/weeks-calculator.ts` | Core calculation logic |

### Files Modified
| File | Changes |
|------|---------|
| `src/types/state.ts` | Added `totalWorkouts`, `mostRecentWorkoutDate` to GZCLPState |
| `src/lib/state-factory.ts` | Initialize `totalWorkouts: 0`, `mostRecentWorkoutDate: null` |
| `src/lib/weeks-calculator.ts` | Added `mostRecentWorkoutDate` to result, new helper functions |
| `src/lib/hevy-client.ts` | Added `getAllWorkouts()` method |
| `src/hooks/useHevyApi.ts` | Exposed `getAllWorkouts()` |
| `src/hooks/useProgram.ts` | Added `setTotalWorkouts()`, `setMostRecentWorkoutDate()` |
| `src/utils/stats.ts` | Added `calculateCurrentWeek()`, accept optional stored values with fallback |
| `src/components/Dashboard/QuickStats.tsx` | Display "Current Week" instead of "Weeks on Program" |
| `src/components/SetupWizard/WelcomeStep.tsx` | Added workouts per week selector |
| `src/components/SetupWizard/index.tsx` | Write stats directly to localStorage during import |

---

## Key Implementation Details

### weeks-calculator.ts
```typescript
export interface WeeksCalculationResult {
  matchingWorkoutCount: number
  calculatedWeeks: number
  calculatedCreatedAt: string
  mostRecentWorkoutDate: string | null
}

export function calculateCreatedAtFromWorkouts(
  workouts: Workout[],
  routineIds: RoutineAssignment,
  options?: { now?: Date; workoutsPerWeek?: number }
): WeeksCalculationResult

export function getMatchingWorkouts(workouts: Workout[], routineIds: RoutineAssignment): Workout[]
export function getMostRecentWorkoutDate(workouts: Workout[]): string | null
```

### stats.ts
```typescript
// Calculate current week (1-indexed)
export function calculateCurrentWeek(totalWorkouts: number, workoutsPerWeek = 3): number

// Uses stored value if > 0, otherwise falls back to counting progression
export function calculateTotalWorkouts(
  progression: Record<string, ProgressionState>,
  storedTotal?: number
): number

// Uses stored date if provided, otherwise falls back to progression data
export function calculateDaysSinceLastWorkout(
  progression: Record<string, ProgressionState>,
  storedDate?: string | null
): number | null
```

### Integration Flow
1. User selects workoutsPerWeek (2, 3, or 4) on WelcomeStep
2. After routine assignment during import finalization:
   - Fetch all workouts from Hevy API (`hevy.getAllWorkouts()`)
   - Calculate result using `calculateCreatedAtFromWorkouts()`
   - **Write directly to localStorage** (avoids React state race condition)
   - Navigate to complete step

### Race Condition Fix
React state updates via `setRawState` don't complete before the component unmounts during navigation. Solution: write stats directly to localStorage before calling `setCurrentStep('complete')`.

---

## Test Coverage
- 31 tests for weeks-calculator (counting, calculation, workoutsPerWeek, mostRecentWorkoutDate)
- 29 tests for stats (with calculateCurrentWeek and stored value fallback tests)
- 7 tests for hevy-client getAllWorkouts (pagination, error handling)
- All 768 tests passing
