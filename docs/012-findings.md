# Findings - Task 2.1: Split useProgram into Granular Contexts

**Created:** 2026-01-14

---

## Current Architecture Analysis

### useProgram Hook (src/hooks/useProgram.ts)
- **Lines:** 214
- **Methods returned:** 25+
- **Composes:** 5 domain hooks + 3 storage hooks

**Return interface:**
```typescript
interface UseProgramResult {
  state: GZCLPState
  isSetupRequired: boolean

  // API Key (1)
  setApiKey: (apiKey: string) => void

  // Settings (1)
  setWeightUnit: (unit: WeightUnit) => void

  // Exercises (3)
  addExercise, updateExercise, removeExercise

  // Progression (4)
  setInitialWeight, setProgressionByKey, updateProgression, updateProgressionBatch

  // Program (6)
  setHevyRoutineId, setHevyRoutineIds, setRoutineIds,
  setCurrentDay, setProgramCreatedAt, setWorkoutsPerWeek, setT3Schedule

  // Workout Stats (2)
  setTotalWorkouts, setMostRecentWorkoutDate

  // Sync (2)
  setLastSync, setNeedsPush

  // History (2)
  setProgressionHistory, recordHistoryEntry

  // Discrepancy (2)
  acknowledgeDiscrepancy, clearAcknowledgedDiscrepancies

  // Pending Changes (3)
  addPendingChange, removePendingChange, clearPendingChanges

  // Processed Workouts (1)
  addProcessedWorkoutIds

  // Persistence (2)
  resetState, importState
}
```

### ProgramContext (src/contexts/ProgramContext.tsx)
- **Purpose:** Read-only access to commonly-used state
- **Lines:** 175
- **Already has selector hooks:** useWeightUnit, useCurrentDay, useExercise, useProgressionByKey, useCurrentDayT3s
- **Wired in:** router.tsx via AppProviders

### Storage Hooks (Already Split)
1. **useConfigStorage** (297 lines) - config, exercises, settings, t3Schedule
2. **useProgressionStorage** (335 lines) - progression, pendingChanges, sync metadata
3. **useHistoryStorage** (174 lines) - progressionHistory

### Components Using useProgram()
Found in 5 files:
1. `src/router.tsx` - AppProviders, SetupGuard, CompletedGuard, ChartsPage
2. `src/components/Dashboard/index.tsx`
3. `src/components/Settings/index.tsx`
4. `src/components/Settings/ExerciseManager.tsx`
5. `src/components/SetupWizard/index.tsx`

---

## Method Groupings for New Contexts

### ConfigContext
**Read:**
- apiKey, settings.weightUnit, settings.increments
- exercises, program.currentDay, t3Schedule
- program.hevyRoutineIds, program.workoutsPerWeek

**Write:**
- setApiKey, setWeightUnit
- addExercise, updateExercise, removeExercise
- setHevyRoutineId, setHevyRoutineIds, setRoutineIds
- setCurrentDay, setProgramCreatedAt, setWorkoutsPerWeek, setT3Schedule

### ProgressionContext
**Read:**
- progression, pendingChanges
- lastSync, totalWorkouts, mostRecentWorkoutDate
- needsPush, acknowledgedDiscrepancies, processedWorkoutIds

**Write:**
- setInitialWeight, setProgressionByKey, updateProgression, updateProgressionBatch
- setTotalWorkouts, setMostRecentWorkoutDate
- setLastSync, setNeedsPush
- acknowledgeDiscrepancy, clearAcknowledgedDiscrepancies
- addPendingChange, removePendingChange, clearPendingChanges
- addProcessedWorkoutIds

### HistoryContext
**Read:**
- progressionHistory

**Write:**
- setProgressionHistory, recordHistoryEntry

### PersistenceContext
- resetState, importState

---

## Component Dependencies (Detailed Analysis)

### Dashboard/index.tsx (HEAVY CONSUMER)
**Read:**
- state (full), exercises, progression, settings, program, lastSync, apiKey, pendingChanges, t3Schedule, processedWorkoutIds

**Write:**
- updateProgressionBatch, setLastSync, setNeedsPush, setHevyRoutineIds
- setCurrentDay, recordHistoryEntry, setTotalWorkouts, setMostRecentWorkoutDate
- addPendingChange, removePendingChange, clearPendingChanges, addProcessedWorkoutIds

**Verdict:** Needs facade (useProgram) - touches all domains

---

### Settings/index.tsx (LIGHT CONSUMER)
**Read:** state (for display only)
**Write:** setWeightUnit, resetState, importState

**Verdict:** Could use ConfigContext + PersistenceContext

---

### ExerciseManager.tsx (FOCUSED)
**Read:** state.exercises
**Write:** updateExercise

**Verdict:** Perfect candidate for ConfigContext only!

---

### SetupWizard/index.tsx (SETUP ONLY)
**Read:** state.apiKey, state.program.workoutsPerWeek
**Write:** setApiKey, setWeightUnit, setWorkoutsPerWeek, importState, setCurrentDay

**Verdict:** Needs ConfigContext + PersistenceContext

---

### router.tsx (ORCHESTRATION)
**Read:** state, isSetupRequired
**Write:** updateProgressionBatch, setProgressionHistory

**Verdict:** Wires providers - needs all contexts at top level

---

## Design Decision: Provider Hierarchy

**Option A: Flat composition in single provider**
```tsx
function GZCLPProviders({ children }) {
  return (
    <ConfigProvider>
      <ProgressionProvider>
        <HistoryProvider>
          <PersistenceProvider>
            {children}
          </PersistenceProvider>
        </HistoryProvider>
      </ProgressionProvider>
    </ConfigProvider>
  )
}
```

**Option B: Compose in existing ProgramContext**
Update ProgramProvider to internally manage all contexts and expose them.

**Recommendation:** Option A for clarity, but keep useProgram as facade.

---

## Gemini Code Review (2026-01-14)

**Verdict:** "Excellent and highly recommended"

### Key Feedback:
1. **Split is sound** - mirrors storage architecture perfectly
2. **Static vs Dynamic separation** - ConfigContext (rarely changes) vs ProgressionContext (changes after every set)
3. **Cross-context dependency** - HistoryProvider must consume ConfigContext internally (needs `exercises`)

### Recommended Migration Strategy:
1. Create providers using existing logic from useProgram
2. Refactor useProgram as facade (100% backward compatible)
3. Swap root in router.tsx with nested providers
4. Targeted refactor: ExerciseManager to use ConfigContext directly
5. Long-tail: migrate other components gradually

### Provider Nesting Order:
```tsx
<ConfigProvider>      {/* Provides: exercises, settings, weightUnit */}
  <ProgressionProvider> {/* Depends on: exercises (to validate keys/ids) */}
    <HistoryProvider>     {/* Depends on: exercises (to map history to names) */}
      <PersistenceProvider> {/* Depends on: ALL setMethods (to reset/import) */}
        {children}
      </PersistenceProvider>
    </HistoryProvider>
  </ProgressionProvider>
</ConfigProvider>
```

### Risk Mitigation:
- Keep useProgram as facade → no breaking changes to Dashboard
- Incremental migration reduces regression risk

---

## Code Review Findings (2026-01-14)

### Issues Addressed:
1. **Fixed:** Misleading ProgressionContext comment claiming ConfigContext dependency

### Known Limitations (Documented):
1. **Selector hooks don't prevent re-renders** - `useApiKey()`, `useExercises()` etc. still re-render on any config change. This is acceptable for now; use `use-context-selector` library if fine-grained subscriptions needed later.

2. **Strict provider nesting required** - Config → Progression → History → Persistence. Will be enforced by AppProviders composite.

### Pre-existing Issues (Not in Scope):
- Silent failure in setInitialWeight (useProgressionManager.ts)
- Shallow copy in import rollback (useDataPersistence.ts)
