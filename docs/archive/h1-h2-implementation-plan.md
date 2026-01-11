# H1 & H2 Implementation Plan

## H1: Extract Data Migration from Dashboard

### Problem
Dashboard component (374+ lines) contains data migration useEffects that should run at app startup, not on every Dashboard mount:
- Auto-import progression history (lines 149-177)
- Auto-backfill AMRAP records (lines 180-215)

### Solution
Create `useDataMaintenance.ts` hook that:
1. Accepts required state and setters via props
2. Runs migrations once using refs to prevent re-execution
3. Is called from router level (runs at app startup)

### Implementation Steps
1. Create `src/hooks/useDataMaintenance.ts`:
   - Extract the two useEffects from Dashboard
   - Accept props: `apiKey`, `exercises`, `progressionHistory`, `hevyRoutineIds`, `progression`, `setProgressionHistory`, `updateProgressionBatch`
2. Create wrapper component in `router.tsx` that:
   - Calls `useProgram()` to get state
   - Calls `useDataMaintenance()` with required props
3. Remove the migration useEffects from `Dashboard/index.tsx`

---

## H2: Wire Up ProgramContext

### Problem
`ProgramContext` is defined but unused. It should provide read-only program state to all components.

### Solution
Wire `ProgramProvider` at router level to provide state from `useProgram()`.

### Implementation Steps
1. Create a `ProgramContextWrapper` component in `router.tsx` that:
   - Calls `useProgram()`
   - Passes state to `ProgramProvider`
   - Also calls `useDataMaintenance()` for H1
2. Update `RootLayout` to include `ProgramContextWrapper`

---

## Combined Approach

Create a single `AppProviders` component in router.tsx that:
1. Calls `useProgram()`
2. Calls `useDataMaintenance()` with required props from program state
3. Wraps children with `ProgramProvider`

This consolidates both fixes and keeps the router clean.
