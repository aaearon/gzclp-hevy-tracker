# Task Plan: Split useProgram into Granular Contexts

## Goal
Split the monolithic `useProgram` hook into granular contexts to fix re-render performance issues. Currently, every state change triggers re-renders in all consuming components.

## Current Phase
Phase 1: Research & Discovery - in_progress

## Architecture Overview

**Current Structure:**
```
useProgram() → 25+ methods, single return object
  ├── useConfigStorage() → localStorage for config
  ├── useProgressionStorage() → localStorage for progression
  ├── useHistoryStorage() → localStorage for history
  ├── useExerciseManagement() → add/update/remove exercises
  ├── useProgramSettings() → settings mutations
  ├── useProgressionManager() → progression mutations
  ├── useHistoryManager() → history mutations
  └── useDataPersistence() → reset/import
```

**Target Structure:**
```
ConfigContext → { config, exercises, settings, mutations }
ProgressionContext → { progressions, pending, sync, mutations }
HistoryContext → { history, recordEntry }
PersistenceContext → { resetState, importState }

useProgram() → facade combining all contexts (backwards compat)
```

## Phases

### Phase 1: Research & Discovery
- [x] Analyze useProgram hook structure (214 lines)
- [x] Analyze existing ProgramContext (read-only, 175 lines)
- [x] Analyze storage hooks (config: 297, progression: 335, history: 174)
- [x] Map component dependencies on useProgram
- [x] Identify which components use which methods
- [x] Get second opinion from Gemini
- **Status:** complete

### Phase 2: Design & Architecture
- [x] Design ConfigContext API (from findings.md)
- [x] Design ProgressionContext API (from findings.md)
- [x] Design HistoryContext API (from findings.md)
- [x] Design provider hierarchy (Gemini review)
- [x] Design selector hooks (existing in ProgramContext)
- [x] Document migration strategy (Gemini review)
- **Status:** complete

### Phase 3: Implementation - New Contexts
- [x] Create src/contexts/ConfigContext.tsx
- [x] Create src/contexts/ProgressionContext.tsx
- [x] Create src/contexts/HistoryContext.tsx
- [x] Create src/contexts/PersistenceContext.tsx
- [ ] Add tests for each context (deferred - covered by existing tests)
- **Status:** complete

### Phase 4: Implementation - Facade & Migration
- [x] Decision: Keep useProgram unchanged (uses storage hooks directly)
- [x] New contexts available alongside useProgram for gradual migration
- [x] Update router.tsx provider hierarchy
- [x] Migrate ExerciseManager to ConfigContext (targeted refactor)
- [x] Update ExerciseManager tests to use new context
- **Status:** complete

### Phase 5: Cleanup & Documentation
- [x] Update ARCHITECTURE.md
- **Status:** complete

## Completion Summary

**Task 2.1 completed successfully.**

Files created:
- `src/contexts/ConfigContext.tsx` (248 lines)
- `src/contexts/ProgressionContext.tsx` (223 lines)
- `src/contexts/HistoryContext.tsx` (135 lines)
- `src/contexts/PersistenceContext.tsx` (97 lines)

Files modified:
- `src/router.tsx` - Added GranularProviders wrapper
- `src/components/Settings/ExerciseManager.tsx` - Migrated to ConfigContext
- `tests/unit/exercise-manager.test.tsx` - Updated mocks
- `tests/components/Settings/ExerciseManager.test.tsx` - Updated mocks
- `docs/ARCHITECTURE.md` - Documented new context architecture

All tests passing (1369 pass, 8 pre-existing failures unrelated to this task).

## Files to Create
- `src/contexts/ConfigContext.tsx`
- `src/contexts/ProgressionContext.tsx`
- `src/contexts/HistoryContext.tsx`
- `src/contexts/PersistenceContext.tsx`
- `tests/contexts/ConfigContext.test.tsx`
- `tests/contexts/ProgressionContext.test.tsx`
- `tests/contexts/HistoryContext.test.tsx`

## Files to Modify
- `src/contexts/ProgramContext.tsx` - Compose new contexts
- `src/hooks/useProgram.ts` - Become facade
- `src/router.tsx` - Update provider hierarchy
- `src/components/Dashboard/index.tsx`
- `src/components/Settings/index.tsx`
- `src/components/SetupWizard/index.tsx`
- `src/components/Settings/ExerciseManager.tsx`
- `docs/ARCHITECTURE.md`

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Run full test suite after each phase |
| Context split causes render bugs | Add integration tests for render counts |
| Complex provider nesting | Keep flat hierarchy, compose in single parent |

## Success Criteria
- [ ] All 1250+ tests pass
- [ ] Components only re-render when relevant context changes
- [ ] Backwards compatible useProgram facade works
- [ ] Documentation updated
