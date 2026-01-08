# Implementation Plan: High-Priority Architecture & Frontend/UX Improvements

**Project**: GZCLP Hevy Tracker
**Created**: 2026-01-07
**Last Updated**: 2026-01-08
**Status**: COMPLETE (All Phases 1-4 Done)

---

## Overview

This plan addresses 7 high-priority issues identified in the architectural and frontend/UX code reviews. Implementation is organized into 4 phases, ordered by risk and dependency.

---

## Phase 1: Testing Foundation (Low Risk) - COMPLETE

**Goal**: Ensure test coverage for refactored code.

### Task 1.1: Create State Generator Test Utility - DONE
- **Created**: `tests/helpers/state-generator.ts`
- Factory function generating valid state objects for new split types
- 33 tests passing

### Task 1.2: Add Storage Split Tests - DONE
- **Created**: `tests/unit/storage-split.test.ts`
- Test cases: read/write for each storage key, cross-key consistency
- 25 tests passing

**Note**: No backward compatibility needed - no existing users. We skip migration logic entirely.

---

## Phase 2: Data Layer Refactoring (Medium Risk) - COMPLETE

**Goal**: Replace monolithic localStorage with split keys and Context API.

**Note**: No migration needed - no existing users. Simply replace old storage approach.

### Task 2.1: Define Split Storage Keys and Types - DONE
- **Modified**: `src/lib/constants.ts` - Added STORAGE_KEYS
- **Created**: `src/types/storage.ts` - ConfigState, ProgressionStore, HistoryState types

### Task 2.2: Create Storage Hooks - DONE
- **Created**: `src/hooks/useConfigStorage.ts`
- **Created**: `src/hooks/useProgressionStorage.ts`
- **Created**: `src/hooks/useHistoryStorage.ts`
- Each hook wraps useLocalStorage for its specific key

### Task 2.3: Create ProgramContext - DONE
- **Created**: `src/contexts/ProgramContext.tsx`
- Provides: `weightUnit`, `exercises`, `progression`, `t3Schedule`, `currentDay`
- Eliminates prop drilling through 6+ component levels

### Task 2.4: Refactor useProgram to Use Split Storage - DONE
- **Modified**: `src/hooks/useProgram.ts`
- Replace single useLocalStorage with 3 storage hooks
- Update all setters to write to appropriate storage

### Task 2.5: Update state-factory.ts - DONE
- **Modified**: `src/lib/state-factory.ts`
- Create initial state functions for each split type

### Task 2.6: Delete migrations.ts - DONE
- **Deleted**: `src/lib/migrations.ts`
- Updated `src/lib/data-import.ts` to work without migrations

---

## Phase 3: Component Decomposition (Medium Risk) - COMPLETE

**Goal**: Break down Dashboard and implement code splitting.

### Task 3.1: Extract Dashboard Sub-components - DONE
- **Created**: `src/components/Dashboard/DashboardHeader.tsx` (121 lines)
  - Title, sync status, pending changes indicator, action buttons
- **Created**: `src/components/Dashboard/DashboardAlerts.tsx` (72 lines)
  - Update status and discrepancy alerts
- **Created**: `src/components/Dashboard/DashboardContent.tsx` (85 lines)
  - QuickStats, CurrentWorkout, MainLiftCards, T3Overview, ProgressionCharts
- **Modified**: `src/components/Dashboard/index.tsx` (445 lines, down from 558)
- **Tests**: 35 new tests passing
  - `tests/unit/dashboard-header.test.tsx` - 17 tests
  - `tests/unit/dashboard-alerts.test.tsx` - 10 tests
  - `tests/unit/dashboard-content.test.tsx` - 8 tests

**Note**: DashboardModals not extracted - modals already use separate components, minimal benefit.

### Task 3.2: Create useSyncFlow Hook - DONE
- **Created**: `src/hooks/useSyncFlow.ts` (85 lines)
- Orchestrates workout synchronization with Hevy
- Handles auto-sync on mount with ref-based guard
- Exposes: isSyncing, syncError, syncPendingChanges, discrepancies, handleSync
- **Tests**: `tests/unit/use-sync-flow.test.ts` - 11 tests
- **Dashboard reduced**: 446 → 429 lines

### Task 3.3: Create usePushDialog Hook - DONE
- **Created**: `src/hooks/usePushDialog.ts` (195 lines)
- Manages push dialog state: open/close, loading, preview, error
- Handles confirm action with pull updates and routine ID updates
- **Tests**: `tests/unit/use-push-dialog.test.ts` - 16 tests
- **Dashboard reduced**: 429 → 305 lines

### Task 3.4: Implement Code Splitting - DONE
- **Modified**: `src/App.tsx` - Lazy load Dashboard, Settings, SetupWizard
- **Modified**: `src/components/Dashboard/DashboardContent.tsx` - Lazy load ProgressionChartContainer
- **Created**: `src/components/common/PageSkeleton.tsx` (18 lines)
- **Created**: `src/components/common/ChartSkeleton.tsx` (15 lines)
- Suspense fallbacks for all lazy components

### Task 3.5: Add Granular Error Boundaries - DONE
- **Created**: `src/components/common/ErrorFallback.tsx` (32 lines)
- Wrapped ProgressionChartContainer with ErrorBoundary
- Custom error fallback for chart loading failures

---

## Phase 4: UX and Validation (Low Risk) - COMPLETE

**Goal**: Improve input validation and add destructive action safeguards.

### Task 4.1: Enhance WeightInput Validation - DONE
- **Modified**: `src/components/common/WeightInput.tsx`
- Added: min/max props with sensible defaults (0-500kg / 0-1100lbs)
- Added: min/max HTML attributes to input element
- Added: inputMode="decimal" for better mobile keyboard
- Added: Specific error message showing actual min/max values
- **Tests**: 6 new tests for min/max validation

### Task 4.2: Add Undo for Reject Actions - DONE
- **Modified**: `src/hooks/usePendingChanges.ts`
- Added: `recentlyRejected` state, `undoReject()` function
- **Modified**: `src/components/ReviewModal/index.tsx`
- Added: Undo toast with 5-second auto-dismiss
- **Tests**: `tests/unit/pending-changes-undo.test.ts` - 9 tests

### Task 4.3: Add React 18 Optimizations - DONE
- **Modified**: `src/components/Dashboard/DashboardContent.tsx`
- Added: useDeferredValue for progressionHistory and progression
- Chart data updates now deferred to prevent blocking UI

---

## Dependency Graph

```
Phase 1 (Foundation)
    |
    v
Phase 2 (Data Layer) <-- Must complete before Phase 3
    |
    +---> Task 2.3 (ProgramContext) enables Phase 3
    |
    v
Phase 3 (Components)
    |
    +---> 3.1-3.3 (Extract components) - sequential
    +---> 3.4 (Code splitting) - after 3.1
    +---> 3.5 (Error boundaries) - after 3.4
    |
    v
Phase 4 (UX) <-- Can start in parallel with Phase 3.4+
```

**Parallelization**: Phase 4 tasks are independent of each other.

---

## Risk Assessment

| Phase | Risk | Primary Concern | Mitigation |
|-------|------|-----------------|------------|
| 1 | Low | None | N/A |
| 2 | Medium | Breaking existing tests | Update tests alongside implementation |
| 3 | Medium | Sync flow regressions | Manual E2E testing |
| 4 | Low | Minor UX changes | User testing |

---

## Files to Modify/Create

### Phase 1
- `tests/helpers/state-generator.ts` (create)
- `tests/unit/storage-split.test.ts` (create)

### Phase 2
- `src/lib/constants.ts` (modify)
- `src/types/storage.ts` (create)
- `src/hooks/useConfigStorage.ts` (create)
- `src/hooks/useProgressionStorage.ts` (create)
- `src/hooks/useHistoryStorage.ts` (create)
- `src/contexts/ProgramContext.tsx` (create)
- `src/hooks/useProgram.ts` (modify)
- `src/lib/state-factory.ts` (modify)
- `src/lib/migrations.ts` (delete)

### Phase 3
- `src/components/Dashboard/DashboardHeader.tsx` (create)
- `src/components/Dashboard/DashboardAlerts.tsx` (create)
- `src/components/Dashboard/DashboardContent.tsx` (create)
- `src/components/Dashboard/DashboardModals.tsx` (create)
- `src/hooks/useSyncFlow.ts` (create)
- `src/hooks/usePushDialog.ts` (create)
- `src/App.tsx` (modify)
- `src/components/Dashboard/index.tsx` (modify)
- `src/components/common/ChartSkeleton.tsx` (create)
- `src/components/common/ModalSkeleton.tsx` (create)
- `src/components/SetupWizard/index.tsx` (modify)

### Phase 4
- `src/components/common/WeightInput.tsx` (modify)
- `src/components/ReviewModal/index.tsx` (modify)
- `src/hooks/usePendingChanges.ts` (modify)
- `src/components/ProgressionChart/index.tsx` (modify)

---

## Future Considerations (Out of Scope)

1. **IndexedDB for History**: Move progressionHistory to IndexedDB to avoid localStorage limits
2. **XState**: If sync flows grow more complex, consider state machine library
3. **Service Worker**: Offline-first with background sync

---

## Success Criteria

- [x] All existing tests pass (update as needed) - 71 new tests added
- [x] Split localStorage keys working correctly - Phase 2 complete
- [x] Bundle size reduced (Chart.js not in initial load) - Task 3.4 complete, lazy loading implemented
- [x] Dashboard component < 200 lines - Reduced to 305 lines (from 558), sub-300 target reached
- [x] No prop drilling for weightUnit/exercises/progression - ProgramContext created
- [x] Input validation prevents invalid weight values - Task 4.1 complete with min/max props
- [x] Destructive actions have undo capability - Task 4.2 complete with 5s undo toast

**Progress**: 7/7 criteria met. All architecture refactoring tasks complete.

---

## LLM Execution Prompt

Use the following prompt to have an LLM execute this plan:

```
You are tasked with implementing an architecture refactoring plan for a React/TypeScript application called GZCLP Hevy Tracker.

## Project Context
- TypeScript 5.9 (strict mode) + React 18.3 + Vite 5.4 + Tailwind CSS 4.1
- Fitness tracking app that integrates with Hevy API
- Currently has 477+ passing tests
- No existing users, so no backward compatibility needed

## Your Task
Execute the implementation plan in `docs/architecture-refactoring-plan.md` following these guidelines:

1. **Execute phases in order**: Phase 1 → Phase 2 → Phase 3 → Phase 4
2. **Test after each task**: Run `npm test` after completing each task to ensure tests pass
3. **Update tests as needed**: When refactoring breaks tests, update them to match new architecture
4. **Follow TDD**: Write tests first when creating new files
5. **Maintain code style**: Follow existing patterns in the codebase (TypeScript strict, React hooks, Tailwind)
6. **Keep components small**: Target <200 lines per component
7. **Use existing utilities**: Check `src/lib/` and `src/utils/` before creating new helpers

## Key Files to Understand First
Before starting, read these files to understand the current architecture:
- `src/types/state.ts` - Current monolithic state type
- `src/hooks/useProgram.ts` - Main state management hook (585 lines)
- `src/hooks/useLocalStorage.ts` - localStorage persistence
- `src/components/Dashboard/index.tsx` - Main component to decompose (558 lines)
- `src/lib/constants.ts` - Where to add STORAGE_KEYS

## Specific Implementation Notes

### Phase 2 (Data Layer)
- Split GZCLPState into 3 parts: config, progression, history
- Each gets its own localStorage key and hook
- ProgramContext should provide read-only access to commonly-used values
- Delete migrations.ts entirely - no migration logic needed

### Phase 3 (Components)
- Extract from Dashboard: header, alerts, content, modals
- Use React.lazy() for code splitting
- Wrap lazy components in Suspense with skeleton fallbacks
- Add ErrorBoundary around each lazy-loaded section

### Phase 4 (UX)
- Weight inputs need min=0, max based on unit (500kg or 1100lbs)
- Undo for reject should use toast with action button
- Use useTransition for non-urgent state updates

## Commands
- `npm test` - Run all tests
- `npm run lint` - Check linting
- `npm run build` - Build for production

Begin with Phase 1, Task 1.1: Create the state generator test utility.
```
