# Critical Fixes Implementation Plan

**Date:** 2026-01-11
**Goal:** Implement 3 critical fixes before release

## Phases

### Phase 1: Add zod as explicit dependency [complete]
- **Files:** `package.json`
- **Action:** `npm install zod`
- **Effort:** 5 min
- **Status:** complete

### Phase 2: Add runtime localStorage validation [complete]
- **Files:**
  - `src/hooks/useLocalStorage.ts` - Add validation callback support
  - `src/hooks/useConfigStorage.ts` - Use isConfigState validator
  - `src/hooks/useProgressionStorage.ts` - Use isProgressionStore validator
  - `src/hooks/useHistoryStorage.ts` - Use isHistoryState validator
  - `src/types/storage.ts` - Already has type guards
- **Approach:**
  - Extend useLocalStorage to accept optional validator function
  - Domain hooks pass their type guards to useLocalStorage
  - On validation failure: return initial value + console.warn
- **Effort:** 1.5h
- **Status:** complete

### Phase 3: Add localStorage size monitoring & history pruning [complete]
- **Files:**
  - `src/lib/constants.ts` - Add MAX_HISTORY_ENTRIES_PER_EXERCISE
  - `src/lib/storage-monitor.ts` - New file for storage utilities
  - `src/hooks/useHistoryStorage.ts` - Add pruning logic
  - `src/hooks/useStorageMonitor.ts` - New hook for monitoring
- **Approach:**
  - Create storage size calculation utility
  - Warn at 80% capacity via console + toast if available
  - Prune history to 200 entries per exercise on write
- **Effort:** 2h
- **Status:** complete

### Phase 4: Run tests and verify [complete]
- **Action:** `npm test && npm run lint`
- **Status:** complete (1248 tests pass, modified files lint-clean)

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Extend useLocalStorage with validator | Keeps validation at lowest level, DRY |
| 200 entries per exercise limit | ~2 years of history at 2x/week |
| 80% warning threshold | Gives buffer before quota exceeded |
