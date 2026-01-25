# Comprehensive Simplification Review

**Date:** 2026-01-18
**Reviewers:** Claude (Opus 4.5), Gemini (Code Reviewer)
**Philosophy:** Derive state from Hevy; eliminate redundant local tracking

---

## Executive Summary

Following the successful simplification of day progression ("base it on the last workout completed in Hevy"), this review identifies **6 major simplification opportunities** that could reduce codebase complexity by ~600-800 lines and eliminate ~10-70KB of localStorage overhead.

| Priority | Opportunity | LOC Saved | Storage Saved | Risk |
|----------|-------------|-----------|---------------|------|
| 1 | Remove `processedWorkoutIds` | ~100 | 5-50KB | Low |
| 2 | Auto-apply deloads | ~50 | - | Low |
| 3 | Remove dead code (SyncState) | ~30 | - | None |
| 4 | Consolidate pending changes flow | ~200 | - | Medium |
| 5 | Remove WeightEditor component | ~100 | - | Low |
| 6 | Derive stats from history | ~60 | ~100 bytes | Low |

**Total potential savings:** ~540 lines, 5-50KB storage

---

## 1. Remove `processedWorkoutIds` Array

### Current State
- `processedWorkoutIds: string[]` stored in `ProgressionStore`
- Capped at 200 entries globally
- Used to prevent re-processing workouts across syncs

### Problem
This is **less effective** than deriving from history:
- Global cap of 200 vs history's 200 *per exercise*
- Grows unbounded until pruning kicks in (5-50KB)
- Duplicates information already in `ProgressionHistoryEntry.workoutId`

### Solution
```typescript
// Derive processed IDs from history (O(n) but n is small)
function getProcessedWorkoutIds(
  progressionHistory: Record<string, ExerciseHistory>
): Set<string> {
  const processed = new Set<string>()
  for (const history of Object.values(progressionHistory)) {
    for (const entry of history.entries) {
      processed.add(entry.workoutId)
    }
  }
  return processed
}
```

### Files to Modify
- `src/types/storage.ts:73-77` - Remove from ProgressionStore
- `src/types/state.ts:353-354` - Remove from GZCLPState
- `src/hooks/useProgressionStorage.ts` - Remove pruning logic
- `src/hooks/useProgression.ts:105,176-182` - Use derived Set
- `src/hooks/useSyncFlow.ts:35,47,79-80,85` - Remove callback

### Gemini Confirmation
> "Yes, it is safe. In fact, it is *safer*. You currently lose deduplication for the 201st-oldest workout. With per-exercise history, you retain knowledge of that workout as long as the specific exercise hasn't been performed 200 times since."

---

## 2. Auto-Apply Deloads (Trust GZCLP Algorithm)

### Current State
- Deloads require user review via ReviewModal
- User must click "Apply" even though deload is deterministic
- ~60-70% of ReviewModal opens are for deloads

### Problem
Deloads are **standard program behavior**, not errors:
- GZCLP algorithm deterministically identifies when deload is needed
- User lifted the weight, Hevy recorded it, algorithm is correct
- Forcing review adds friction without value

### Solution
```typescript
// useSyncFlow.ts:142 - Remove deload from conflict check
const isConflict = hasDiscrepancy  // Remove: || isDeload
```

Show toast notification: "Deload applied: Squat T1 → 85kg (Undo)"

### Impact
- ReviewModal opens reduced by ~60-70%
- Workflow becomes: Sync → Toast → Push (vs Sync → Modal → Apply → Push)

### Files to Modify
- `src/hooks/useSyncFlow.ts:142` - Remove `isDeload` from conflict check
- `src/components/Dashboard/index.tsx` - Add deload to auto-apply toast

---

## 3. Remove Dead Code (SyncState Interface)

### Current State
```typescript
// src/lib/workout-analysis.ts:182-207
export interface SyncState {
  lastProcessedWorkoutId: string | null
  lastProcessedDate: string | null
}

export function filterNewWorkouts(...) { ... }
```

### Problem
- `SyncState` interface is **exported but never imported**
- `filterNewWorkouts()` is **never called** anywhere
- Actual filtering happens in `useProgression.ts` using different logic

### Solution
Delete lines 182-207 from `workout-analysis.ts`

### Files to Modify
- `src/lib/workout-analysis.ts:182-207` - Delete

---

## 4. Consolidate Pending Changes Flow

### Current State (4 Layers)
```
useProgression (generates)
    ↓
useSyncFlow (categorizes: auto-apply vs conflict)
    ↓
Dashboard (deduplicates, merges stored + sync)
    ↓
usePendingChanges (manages UI state, undo)
    ↓
ReviewModal (displays)
```

### Problems
1. **Data transformed at every layer** - each re-processes/filters
2. **Race conditions** - if sync runs while user applies changes
3. **Complex ref management** in useSyncFlow (4 refs for tracking)
4. **Deduplication needed** because data flows through multiple paths

### Solution
Consolidate into single `useSyncManager` hook:
```typescript
function useSyncManager() {
  // Single source of truth for pending changes
  // Linear flow: Fetch → Analyze → Apply/Queue → Update State
  // No refs needed - use useReducer for consolidated state
}
```

### Files Affected
- CREATE: `src/hooks/useSyncManager.ts` (~350 lines)
- DELETE: `src/hooks/useSyncFlow.ts` (251 lines)
- MODIFY: `src/hooks/useProgression.ts` - Simplify to pure sync
- MODIFY: `src/hooks/usePendingChanges.ts` - May be absorbed
- MODIFY: `src/components/Dashboard/index.tsx` - Use new hook

### Note
This is the **deferred Task 5** from the original simplification plan. Both Claude and Gemini recommend it but acknowledge it's medium effort with some risk.

---

## 5. Remove WeightEditor Component

### Current State
- `ReviewModal/WeightEditor.tsx` (104 lines)
- Allows per-change weight editing before applying
- Adds state management complexity to ReviewModal

### Problem
- **Rarely used** - users trust the algorithm
- Discrepancies are already detected and shown
- User can reject change if calculation is wrong
- Weight can be fixed in Settings → Exercise Manager

### Solution
Remove WeightEditor, simplify ReviewModal to pure presentation:
- Show change details (read-only)
- Apply / Reject buttons only
- Discrepancy warning (informational)

### Files to Modify
- `src/components/ReviewModal/WeightEditor.tsx` - DELETE
- `src/components/ReviewModal/index.tsx` - Remove edit functionality
- Related test files

---

## 6. Derive Stats from History

### Current State
Three stats tracked in `ProgressionStore`:
- `totalWorkouts: number` - manually incremented
- `mostRecentWorkoutDate: string | null` - manually updated
- `amrapRecordWorkoutId: string | null` - per-exercise metadata

### Problems
1. **totalWorkouts** can drift from Hevy's true count
2. **mostRecentWorkoutDate** gets stale if sync doesn't complete
3. **amrapRecordWorkoutId** is never actually queried

### Solution
```typescript
// Derive totalWorkouts from Hevy API response
const response = await client.getWorkouts({ page: 1, pageSize: 1 })
const totalWorkouts = response.total_workouts  // Authoritative

// Derive mostRecentWorkoutDate from history
function getMostRecentDate(history: Record<string, ExerciseHistory>): string | null {
  let latest: string | null = null
  for (const h of Object.values(history)) {
    for (const entry of h.entries) {
      if (!latest || entry.date > latest) latest = entry.date
    }
  }
  return latest
}

// Remove amrapRecordWorkoutId - derive when needed
function findAmrapRecordWorkout(history: ExerciseHistory, targetReps: number) {
  return history.entries.find(e => e.amrapReps === targetReps)
}
```

### Files to Modify
- `src/types/storage.ts` - Remove fields from ProgressionStore
- `src/types/state.ts` - Remove amrapRecordWorkoutId from ProgressionState
- `src/hooks/useProgression.ts` - Use Hevy API for totalWorkouts
- `src/utils/stats.ts` - Derive from history
- `src/lib/apply-changes.ts` - Stop setting amrapRecordWorkoutId

---

## Additional Findings

### Duplicate Deduplication Functions
`src/lib/discrepancy-utils.ts` has two nearly identical functions:
- `deduplicateDiscrepancies()` (lines 31-59)
- `deduplicatePendingChanges()` (lines 61-99)

**Opportunity:** Extract generic deduplication utility (~30 lines saved)

### acknowledgedDiscrepancies - Keep As-Is
This tracks user's "Keep" decisions on weight discrepancies. Unlike other state, this **cannot be derived from Hevy** - it represents user preferences. Keep it.

### Unused _unit Parameter
`src/lib/progression.ts:98` - `calculateDeload()` takes `_unit` parameter but never uses it. Minor cleanup.

---

## Implementation Roadmap

### Phase 1: Quick Wins (Low Risk, High Impact)
1. Remove dead code (SyncState) - 30 lines
2. Auto-apply deloads - 50 lines behavior change
3. Remove `processedWorkoutIds` - 100 lines, 5-50KB storage

**Estimated effort:** 1-2 days
**Risk:** Low

### Phase 2: UI Simplification (Low Risk, Medium Impact)
4. Remove WeightEditor - 100 lines
5. Derive stats from history - 60 lines

**Estimated effort:** 1 day
**Risk:** Low

### Phase 3: Architecture Consolidation (Medium Risk, High Impact)
6. Consolidate pending changes flow - 200 lines net reduction

**Estimated effort:** 3-5 days
**Risk:** Medium (significant refactoring)

---

## Metrics Summary

| Metric | Current | After Phase 1 | After Phase 3 |
|--------|---------|---------------|---------------|
| Sync-related hooks | 4 | 4 | 2-3 |
| localStorage overhead | 10-70KB | 5-20KB | 5-20KB |
| ReviewModal opens | ~30% of syncs | ~10% of syncs | ~10% of syncs |
| useEffect chains in sync | 4 | 4 | 1 |
| Refs for tracking state | 4 | 4 | 0 |

---

## Conclusion

The day progression simplification ("base it on Hevy") was a success. This review identifies similar opportunities throughout the codebase where local state tracking duplicates what Hevy already provides.

**Key principle:** If Hevy recorded it, trust it. Don't maintain shadow state.

---

## Phase 1 Implementation - COMPLETED (2026-01-18)

### Changes Made

**1. Remove `processedWorkoutIds` Array** - DONE
- Removed `processedWorkoutIds` from `ProgressionStore` and `GZCLPState` interfaces
- Removed `addProcessedWorkoutIds` function and related pruning logic
- Added `getProcessedWorkoutIds()` utility that derives workout IDs from `progressionHistory`
- Updated `useSyncFlow` and `usePendingChanges` to remove the callback
- Files modified: `types/storage.ts`, `types/state.ts`, `hooks/useProgressionStorage.ts`, `hooks/useProgression.ts`, `hooks/useSyncFlow.ts`, `hooks/usePendingChanges.ts`, `contexts/ProgressionContext.tsx`, `lib/state-factory.ts`

**2. Auto-Apply Deloads** - DONE
- Changed conflict check from `hasDiscrepancy || isDeload` to just `hasDiscrepancy`
- Deloads now auto-apply like other progression changes
- Toast now shows detailed deload info (e.g., "Squat T1 deloaded")
- Only discrepancies require user review via ReviewModal
- Files modified: `hooks/useSyncFlow.ts`, `components/Dashboard/index.tsx`

**3. Remove Dead Code (SyncState)** - DONE
- Removed unused `SyncState` interface and `filterNewWorkouts()` function
- Files modified: `lib/workout-analysis.ts`

### Results

| Metric | Before | After |
|--------|--------|-------|
| Lines removed | - | ~130 |
| localStorage fields | processedWorkoutIds (5-50KB) | Derived from history |
| ReviewModal opens | ~30% of syncs | ~10% of syncs (discrepancies only) |
| Tests | 1369 passing | 1369 passing |

**Recommended next step:** Phase 2 (Remove WeightEditor, Derive stats from history).
