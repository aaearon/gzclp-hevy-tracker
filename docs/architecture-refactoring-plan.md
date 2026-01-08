# Implementation Plan: High-Priority Architecture & Frontend/UX Improvements

**Project**: GZCLP Hevy Tracker
**Created**: 2026-01-07
**Status**: Ready for Implementation

---

## Overview

This plan addresses 7 high-priority issues identified in the architectural and frontend/UX code reviews. Implementation is organized into 4 phases, ordered by risk and dependency.

---

## Phase 1: Testing Foundation (Low Risk)

**Goal**: Ensure test coverage for refactored code.

### Task 1.1: Create State Generator Test Utility
- **Create**: `tests/helpers/state-generator.ts`
- Factory function generating valid state objects for new split types

### Task 1.2: Add Storage Split Tests
- **Create**: `tests/unit/storage-split.test.ts`
- Test cases: read/write for each storage key, cross-key consistency

**Note**: No backward compatibility needed - no existing users. We skip migration logic entirely.

**Validation**: All 477+ tests pass before proceeding

---

## Phase 2: Data Layer Refactoring (Medium Risk)

**Goal**: Replace monolithic localStorage with split keys and Context API.

**Note**: No migration needed - no existing users. Simply replace old storage approach.

### Task 2.1: Define Split Storage Keys and Types
- **Modify**: `src/lib/constants.ts`
```typescript
export const STORAGE_KEYS = {
  CONFIG: 'gzclp_config',       // program, settings, exercises, apiKey
  PROGRESSION: 'gzclp_progression', // progression states, pendingChanges
  HISTORY: 'gzclp_history',     // progressionHistory (unbounded)
} as const
```

- **Create**: `src/types/storage.ts`
- Split types: `ConfigState`, `ProgressionStateStore`, `HistoryState`

### Task 2.2: Create Storage Hooks
- **Create**: `src/hooks/useConfigStorage.ts`
- **Create**: `src/hooks/useProgressionStorage.ts`
- **Create**: `src/hooks/useHistoryStorage.ts`
- Each hook wraps useLocalStorage for its specific key

### Task 2.3: Create ProgramContext
- **Create**: `src/contexts/ProgramContext.tsx`
- Provides: `weightUnit`, `exercises`, `progression`, `t3Schedule`, `currentDay`
- Eliminates prop drilling through 6+ component levels

### Task 2.4: Refactor useProgram to Use Split Storage
- **Modify**: `src/hooks/useProgram.ts`
- Replace single useLocalStorage with 3 storage hooks
- Update all setters to write to appropriate storage
- Remove old `gzclp_state` key usage entirely

### Task 2.5: Update state-factory.ts
- **Modify**: `src/lib/state-factory.ts`
- Create initial state functions for each split type
- Remove old monolithic createInitialState

### Task 2.6: Delete migrations.ts
- **Delete**: `src/lib/migrations.ts`
- No longer needed - no backward compatibility required

---

## Phase 3: Component Decomposition (Medium Risk)

**Goal**: Break down Dashboard and implement code splitting.

### Task 3.1: Extract Dashboard Sub-components
- **Create**: `src/components/Dashboard/DashboardHeader.tsx` (~80 lines)
- **Create**: `src/components/Dashboard/DashboardAlerts.tsx` (~40 lines)
- **Create**: `src/components/Dashboard/DashboardContent.tsx` (~100 lines)
- **Create**: `src/components/Dashboard/DashboardModals.tsx` (~60 lines)

### Task 3.2: Create useSyncFlow Hook with useReducer
- **Create**: `src/hooks/useSyncFlow.ts`
- States: idle, checking_connection, syncing, resolving_conflicts, reviewing, pushing, error, success

### Task 3.3: Create usePushDialog Hook
- **Create**: `src/hooks/usePushDialog.ts`
- Extracts: isPushDialogOpen, pushPreview, handleOpenPushDialog, handleConfirmPush

### Task 3.4: Implement Code Splitting
- **Modify**: `src/App.tsx`
```typescript
const Dashboard = lazy(() => import('@/components/Dashboard'))
const Settings = lazy(() => import('@/components/Settings'))
const SetupWizard = lazy(() => import('@/components/SetupWizard'))
```

- **Modify**: `src/components/Dashboard/index.tsx`
```typescript
const ProgressionChartContainer = lazy(() => import('@/components/ProgressionChart'))
const ReviewModal = lazy(() => import('@/components/ReviewModal'))
const PushConfirmDialog = lazy(() => import('./PushConfirmDialog'))
```

- **Create**: `src/components/common/ChartSkeleton.tsx`
- **Create**: `src/components/common/ModalSkeleton.tsx`

### Task 3.5: Add Granular Error Boundaries
- **Modify**: `src/App.tsx` - wrap lazy components
- **Modify**: `src/components/Dashboard/index.tsx` - wrap ProgressionChart
- **Modify**: `src/components/SetupWizard/index.tsx` - wrap each step

---

## Phase 4: UX and Validation (Low Risk)

**Goal**: Improve input validation and add destructive action safeguards.

### Task 4.1: Enhance WeightInput Validation
- **Modify**: `src/components/common/WeightInput.tsx`
- **Modify**: `src/components/ReviewModal/index.tsx` (lines 69-77)
- Add: min/max constraints, inputMode="decimal", aria-invalid, error messages

### Task 4.2: Add Undo for Reject Actions
- **Modify**: `src/hooks/usePendingChanges.ts`
- **Modify**: `src/components/ReviewModal/index.tsx`
- Implementation: `recentlyRejected` state, `undoReject()` function
- Toast notification with "Undo" action button, 5s timeout

### Task 4.3: Add React 18 Optimizations
- **Modify**: `src/components/ProgressionChart/index.tsx` - useTransition for chart filtering
- **Modify**: `src/components/SetupWizard/ExerciseSelector.tsx` - useDeferredValue for search

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

- [ ] All existing tests pass (update as needed)
- [ ] Split localStorage keys working correctly
- [ ] Bundle size reduced (Chart.js not in initial load)
- [ ] Dashboard component < 200 lines
- [ ] No prop drilling for weightUnit/exercises/progression
- [ ] Input validation prevents invalid weight values
- [ ] Destructive actions have undo capability

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
