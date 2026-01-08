# Architecture Refactoring Continuation Prompt

Use this prompt to continue the architecture refactoring work.

---

## Context

I'm implementing an architecture refactoring plan for a React/TypeScript fitness tracking app (GZCLP Hevy Tracker). The implementation plan is in `docs/architecture-refactoring-plan.md`.

## Completed Work (Phases 1-2)

### Phase 1: Test Infrastructure (DONE)
- Created `tests/helpers/state-generator.ts` - comprehensive state generators
- Created `tests/unit/state-generator.test.ts` - 33 tests passing
- Created `tests/unit/storage-split.test.ts` - 25 tests passing

### Phase 2: Data Layer (DONE)
- Added `STORAGE_KEYS` constants in `src/lib/constants.ts`
- Created `src/types/storage.ts` with ConfigState, ProgressionStore, HistoryState types
- Created three storage hooks:
  - `src/hooks/useConfigStorage.ts` - config, settings, exercises
  - `src/hooks/useProgressionStorage.ts` - progression, pendingChanges, sync
  - `src/hooks/useHistoryStorage.ts` - progressionHistory
- Created `src/contexts/ProgramContext.tsx` with provider and selector hooks
- Refactored `src/hooks/useProgram.ts` to use split storage
- Updated `src/lib/state-factory.ts` with split state factories
- Deleted `src/lib/migrations.ts` (no backward compatibility needed)
- Updated `src/lib/data-import.ts` to work without migrations

## Next Steps (Phases 3-4)

### Phase 3: Component Decomposition (NOT STARTED)

**Task 3.1: Extract Dashboard Sub-components**
- Extract from `src/components/Dashboard/index.tsx` (558 lines):
  - `DashboardHeader.tsx` - title, stats, week counter
  - `DashboardAlerts.tsx` - discrepancy alerts, pending changes summary
  - `DashboardContent.tsx` - main lift cards, T3 overview
  - Modal components (already partially extracted)

**Task 3.2: Create useSyncFlow Hook**
- Extract sync logic from Dashboard into `src/hooks/useSyncFlow.ts`
- Handle: sync state machine, error handling, retry logic

**Task 3.3: Create usePushDialog Hook**
- Extract push dialog logic into `src/hooks/usePushDialog.ts`
- Handle: selection state, accept/reject/skip, batch operations

**Task 3.4: Implement Code Splitting**
- Use React.lazy() for heavy components
- Wrap lazy components in Suspense with skeleton fallbacks
- Target: ProgressionChart, SetupWizard, Import components

**Task 3.5: Add Granular Error Boundaries**
- Add ErrorBoundary around each lazy-loaded section
- Create reusable ErrorFallback component

### Phase 4: UX Improvements (NOT STARTED)

**Task 4.1: Enhance WeightInput Validation**
- Add min=0, max based on unit (500kg or 1100lbs)
- Add increment validation (+/- buttons respect configured increments)

**Task 4.2: Add Undo for Reject Actions**
- Use toast with action button for undo
- Store rejected change temporarily for undo window

**Task 4.3: Add React 18 Optimizations**
- Use useTransition for non-urgent state updates
- Optimize re-renders in Dashboard

## Current State

- Branch: `feature/architecture-refactoring`
- Tests: Some localStorage-related tests are flaky (pre-existing threading issue with jsdom)
- Build: Pre-existing TypeScript errors in SetupWizard components (unrelated to refactoring)

## Key Files to Understand

- `src/components/Dashboard/index.tsx` - Main component to decompose (558 lines)
- `src/hooks/useProgram.ts` - Refactored to use split storage
- `src/contexts/ProgramContext.tsx` - New context for prop drilling elimination
- `docs/architecture-refactoring-plan.md` - Full implementation plan

## Commands

```bash
npm test                    # Run all tests
npm run build               # Build (will show pre-existing errors)
npm run lint                # Lint
```

## Instructions

1. Start with Phase 3, Task 3.1: Extract Dashboard sub-components
2. Follow TDD - write tests first when creating new files
3. Run `npm test` after each task
4. Keep components under 200 lines
5. Use existing utilities in `src/lib/` and `src/utils/`
6. Commit after completing each major task
