# Findings & Decisions: Visual Feedback Feature

## Requirements

### User Request
- Visual feedback when fetch completes and progression is applied
- Bug: B1 workout didn't progress to A2, weights didn't update

### Derived Requirements
- Show notification when new workout is detected from Hevy
- Show summary of what exercises will progress
- Show confirmation when changes are applied
- Ensure progression bug is investigated/fixed

## Research Findings

### Current Sync Flow Architecture

1. **useSyncFlow.ts** - Orchestrates auto-sync on mount
   - `isSyncing` state exists
   - `syncPendingChanges` returned for UI
   - Auto-syncs when: `isOnline && !isSyncing && apiKey`

2. **useProgression.ts** - Handles API fetch and analysis
   - Fetches 10 most recent workouts
   - Filters by `hevyRoutineIds` (A1, B1, A2, B2)
   - Filters out already-processed workouts (checks `lastWorkoutId`)
   - Returns `pendingChanges` and `discrepancies`

3. **usePendingChanges.ts** - Manages apply/reject
   - `applyAllChanges()` advances day via `DAY_CYCLE[currentDay]`
   - Sets `lastWorkoutId` in progression via `applyPendingChange()`

4. **Dashboard/index.tsx** - Wires everything together
   - DashboardHeader shows sync status, pending badge
   - ReviewModal for accepting changes
   - No success feedback after applying

### Existing Visual Components

| Component | Purpose | Gap |
|-----------|---------|-----|
| SyncButton | Shows syncing spinner | OK |
| PendingBadge | Shows pending count | OK |
| SyncStatus | Shows last sync time, errors | No "success" state |
| ReviewModal | Review/apply changes | No confirmation after apply |

### B1→A2 Progression Bug Analysis

**Flow that should happen:**
1. User completes B1 workout in Hevy
2. Dashboard auto-syncs
3. `useProgression.syncWorkouts()` finds the workout
4. `findDayByRoutineId()` matches `workout.routine_id` to `hevyRoutineIds.B1`
5. `analyzeWorkout()` creates `WorkoutAnalysisResult[]`
6. `createPendingChangesFromAnalysis()` generates `PendingChange[]`
7. User reviews and clicks "Apply All"
8. `applyAllChanges()` calls `onDayAdvance(DAY_CYCLE['B1'])` = `onDayAdvance('A2')`

**Potential failure points:**
1. **Routine ID mismatch** - `workout.routine_id` doesn't match stored `hevyRoutineIds.B1`
2. **Already processed** - `workout.id` matches some `prog.lastWorkoutId`
3. **No pending changes generated** - Analysis found nothing
4. **User didn't apply** - Changes exist but weren't accepted

**Debug approach:**
- Add logging to see if workout is found
- Check `hevyRoutineIds` in localStorage
- Verify `routine_id` in Hevy workout

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Toast notifications for feedback | Standard pattern, non-blocking, auto-dismiss |
| Add `onSyncComplete` callback to useSyncFlow | Clean separation of concerns |
| Track "sync result" state | Need to know: no workouts, new workouts, already processed |
| Show success toast with summary | User needs to see what changed |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Sync pending changes NOT persisted to localStorage | Need to add effect to persist sync changes |
| No visual feedback for sync results | Implement toast notifications |
| User doesn't know if workout was detected | Add "X exercises found" feedback |

## Root Cause Analysis: B1 Progression Bug

**Key Finding:** Sync-generated pending changes live only in memory (useState), not localStorage!

**Flow:**
1. Auto-sync runs → `useProgression` creates `pendingChanges` in useState
2. History is recorded immediately (to localStorage - that's why charts work)
3. `syncPendingChanges` are merged with `storedPendingChanges` in Dashboard
4. **BUT**: `syncPendingChanges` are NEVER persisted to localStorage
5. If user refreshes without applying: sync changes are lost

**Why charts show workout but no pending button:**
- History was recorded (persisted to localStorage in `gzclp_history`)
- Pending changes were NOT persisted (only in memory)
- On next page load, stored pending changes = empty, sync regenerates... unless workout is filtered

**Potential secondary issues:**
1. Workout `routine_id` might not match stored `hevyRoutineIds.B1`
2. Workout `id` might be in `processedWorkoutIds` from previous apply

## Resources

- `src/hooks/useSyncFlow.ts` - Sync orchestration
- `src/hooks/useProgression.ts` - API + analysis
- `src/hooks/usePendingChanges.ts` - Change application
- `src/components/Dashboard/index.tsx` - Main wiring
- `src/lib/constants.ts` - DAY_CYCLE mapping

## Visual/Browser Findings

(None yet - code analysis only)

---
*Update this file after every 2 view/browser/search operations*
