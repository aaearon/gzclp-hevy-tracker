# Import & QuickStats Fixes Plan

## Issues to Fix

### Issue 0: WelcomeStep - Show Backup Timestamp
After backup is loaded, display the backup's timestamp (from `program.createdAt`) instead of the program name.

### Issue 1: Import Reactivity
After importing data in Settings or WelcomeStep, the UI doesn't update. User must refresh or navigate away. The state changes via `importState()` but React doesn't re-render.

**Root Cause Analysis:**
- `useDataPersistence.importState()` calls storage hooks' import functions
- Storage hooks write to localStorage and update React state
- The problem may be in how the state updates propagate or how the component observes changes

### Issue 2: QuickStats Enhancements

#### 2a: Current Week - Show Day of Week
Display which day of the training week the user is on (e.g., "Week 3 - Day 2 of 3").

#### 2b: Total Workouts - Show First Workout Date
Add subtitle showing date of first workout (similar to "Days Since Last Workout").

#### 2c: Label Fix
Change "Days Since Last" to "Days Since Last Workout".

---

## Implementation Plan

### Phase 1: Issue 0 - Backup Timestamp Display (COMPLETED)
- [x] Read `WelcomeStep.tsx`
- [x] Modify backup loaded message to show `_exportMeta.exportedAt` timestamp

### Phase 2: Issue 1 - Import Reactivity (COMPLETED)
- [x] Read `useDataPersistence.ts`
- [x] Read Settings import flow
- [x] Root cause: `useLocalStorage` hook instances don't sync within same tab
- [x] Fix: Added custom `localStorageSync` event for same-tab synchronization

### Phase 3: Issue 2 - QuickStats (COMPLETED)
- [x] Read `QuickStats.tsx`
- [x] Read `stats.ts`
- [x] Add `calculateDayOfWeek()` to stats.ts
- [x] Add `formatProgramStartDate()` to stats.ts
- [x] Update QuickStats component with new subtitles
- [x] Fix label from "Days Since Last" to "Days Since Last Workout"
- [x] Update test for new label

---

## Files to Modify
1. `src/components/SetupWizard/WelcomeStep.tsx` - backup timestamp
2. `src/components/Settings/index.tsx` - import reactivity
3. `src/utils/stats.ts` - new calculation functions
4. `src/components/Dashboard/QuickStats.tsx` - enhanced display
