# Simplification Implementation Plan: 5 Priority Tasks

**Created:** 2026-01-18
**Goal:** Reduce complexity by deriving state from Hevy and eliminating redundant code

---

## Overview

| # | Task | Impact | Effort | LOC Saved |
|---|------|--------|--------|-----------|
| 1 | Auto-apply non-conflicting changes | High (UX) | Medium | ~50 |
| 2 | Remove `lastWorkoutId` | Medium | Low | ~80 |
| 3 | Remove ProgramContext | Medium | Low | ~175 |
| 4 | Derive `totalWorkouts` from Hevy | Low | Low | ~40 |
| 5 | Merge useSyncFlow + useProgression | Medium | Medium | ~100 |

**Total estimated savings:** ~445 LOC

---

## Implementation Order

```
Week 1:
├── Task 2: Remove lastWorkoutId (LOW effort, enables others)
├── Task 4: Derive totalWorkouts (LOW effort, quick win)
└── Task 3: Remove ProgramContext (LOW effort, cleanup)

Week 2:
├── Task 1: Auto-apply changes (MEDIUM effort, high UX value)
└── Task 5: Merge hooks (MEDIUM effort, builds on Task 1)
```

---

## Task 2: Remove `lastWorkoutId` (Keep Only `processedWorkoutIds`)

### Problem
Dual tracking: `lastWorkoutId` per progression AND `processedWorkoutIds` array. Redundant and can desync.

### Solution
Remove `lastWorkoutId` entirely. Use only `processedWorkoutIds` for deduplication.

### Files to Modify
- `src/types/state.ts` - Remove `lastWorkoutId` and `lastWorkoutDate`
- `src/lib/apply-changes.ts` - Remove setting these fields
- `src/hooks/useProgression.ts` - Remove backwards-compat merge
- `src/hooks/usePendingChanges.ts` - Simplify logic
- `src/hooks/useProgressionStorage.ts` - Remove migration code
- `src/lib/state-factory.ts` - Remove from default state
- `src/utils/stats.ts` - Remove fallback logic
- `src/hooks/useExerciseManagement.ts` - Remove clearing
- `src/hooks/useDataMaintenance.ts` - Remove clearing

---

## Task 3: Remove ProgramContext

### Problem
ProgramContext (175 LOC) is a read-only duplicate of state already in ConfigContext + ProgressionContext.

### Solution
Remove ProgramContext entirely. Components use granular contexts directly.

### Files to Modify
- `src/contexts/ProgramContext.tsx` - DELETE
- `src/router.tsx` - Remove ProgramProvider
- `src/hooks/useProgram.ts` - Clean up exports

---

## Task 4: Derive `totalWorkouts` from Hevy API

### Problem
Manual `totalWorkouts` counter incremented on each sync. Can drift from actual count.

### Solution
Use sync-derived value. Remove manual increment.

### Files to Modify
- `src/hooks/useProgression.ts` - Count relevant workouts during sync
- `src/hooks/useSyncFlow.ts` - Update totalWorkouts from sync result
- `src/components/Dashboard/index.tsx` - Remove manual increment

---

## Task 1: Auto-Apply Non-Conflicting Changes

### Problem
Current flow requires 7+ clicks: Sync → Review Modal → Apply each → Close → Push → Confirm

### Solution
Auto-apply changes where `actualWeight === storedWeight`. Only show ReviewModal for discrepancies.

### Classification Logic
```typescript
// AUTO-APPLY (no user review needed):
- actualWeight === storedWeight (user lifted expected weight)
- Standard progressions: weight increase, stage advance

// REQUIRE REVIEW (show in ReviewModal):
- Discrepancies: actualWeight !== storedWeight
- Weight decreases (unexpected)
- Stage rollbacks
- Deloads (user should confirm)
```

### Files to Modify
- `src/hooks/useSyncFlow.ts` - Add categorization logic
- `src/hooks/useProgression.ts` - Add hasDiscrepancy flag
- `src/components/Dashboard/index.tsx` - Auto-apply flow + toast
- `src/components/ReviewModal/index.tsx` - Update header

---

## Task 5: Merge useSyncFlow + useProgression

### Problem
Two hooks with overlapping responsibilities and possible state tearing.

### Solution
Merge into single `useSyncWorkouts` hook (~350 lines total).

### Files
- CREATE: `src/hooks/useSyncWorkouts.ts`
- DELETE: `src/hooks/useProgression.ts` and `src/hooks/useSyncFlow.ts`
- MODIFY: `src/components/Dashboard/index.tsx`

---

## Status

- [x] Task 2: Remove lastWorkoutId (2026-01-18)
- [x] Task 4: Derive totalWorkouts from sync (2026-01-18)
- [x] Task 3: Remove ProgramContext (2026-01-18)
- [x] Task 1: Auto-apply non-conflicting changes (2026-01-18)
- [ ] Task 5: Merge useSyncFlow + useProgression (Deferred to separate PR - see notes below)

### Task 5 Deferral Notes
Task 5 (merging useSyncFlow + useProgression) has been deferred to a separate PR for the following reasons:
1. Tasks 1-4 are complete and working, reducing complexity significantly
2. The auto-apply feature (Task 1) already reduces the reactive chain issues
3. The merge is a significant refactoring with risk of introducing bugs
4. Gemini code review recommends the merge but suggests a linear pipeline pattern which requires careful implementation

When implementing Task 5, follow these recommendations from Gemini:
- Use a single async sync function with linear flow: Fetch → Analyze → Apply → Update State
- Remove reactive useEffect chains
- Consider useReducer for consolidated state
- Keep pure analysis functions in lib/
