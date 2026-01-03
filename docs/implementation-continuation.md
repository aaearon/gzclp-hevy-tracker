# GZCLP Hevy Tracker - Implementation Continuation

**Date**: 2026-01-02
**Context**: Paused mid-implementation to continue with parallelized agents

## Current State Summary

### Completed (Phases 1-3 + Partial Phase 4)

| Phase | Status | Key Files |
|-------|--------|-----------|
| Phase 1: Setup | COMPLETE | `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js` |
| Phase 2: Foundational | COMPLETE | `src/types/`, `src/lib/constants.ts`, `src/utils/`, `src/hooks/useLocalStorage.ts`, `src/lib/hevy-client.ts` |
| Phase 3: US1 Setup Wizard | COMPLETE | `src/components/SetupWizard/`, `src/hooks/useHevyApi.ts`, `src/hooks/useProgram.ts` |
| Phase 4: US2 Progression (Core) | COMPLETE | `src/lib/progression.ts`, `src/lib/workout-analysis.ts`, tests |

### Test Status
- **121 tests passing**
- All progression logic tested (T1/T2/T3, deload, workout analysis)
- Run `npm test` to verify

### Key Architecture Decisions
- **State**: localStorage with `gzclp_state` key, version migrations in `src/lib/migrations.ts`
- **Hevy API**: Client in `src/lib/hevy-client.ts` with all endpoints implemented
- **Progression**: Pure functions in `src/lib/progression.ts` - calculateT1/T2/T3Progression
- **Types**: `src/types/state.ts` (GZCLPState, PendingChange, etc.), `src/types/hevy.ts` (re-exports)

---

## Remaining Work

### Phase 4 Remainder (US2 - Sync UI)
- T051: PendingChange generator function
- T053: `useProgression` hook
- T054-T057: Dashboard sync components

### Phase 5 (US3 - Review Modal)
- T059-T067: Review/confirm pending changes UI

### Phase 6 (US4 - Update Hevy)
- T068-T077: Push changes to Hevy routines

### Phase 7 (US5 - Dashboard)
- T078-T085: Dashboard overview components

### Phase 8 (US6 - Export/Import)
- T086-T098: Data export/import functionality

### Phase 9 (Polish)
- T099-T110: Error handling, accessibility, bundle optimization

---

## Parallel Agent Prompts

### AGENT 1: Complete Phase 4 (Sync UI) + Phase 5 (Review Modal)

```
Continue implementing the GZCLP Hevy Tracker. Focus on completing User Story 2 (sync UI) and User Story 3 (review modal).

CONTEXT:
- Project: /home/tim/gzclp-hevy-tracker
- Tasks file: /specs/001-gzclp-hevy-tracker/tasks.md
- Core progression logic COMPLETE in src/lib/progression.ts
- Workout analysis COMPLETE in src/lib/workout-analysis.ts

YOUR TASKS (in order):
1. Read src/lib/progression.ts and src/lib/workout-analysis.ts to understand the API
2. Create src/hooks/useProgression.ts - hook that:
   - Fetches workouts from Hevy (use useHevyApi)
   - Analyzes them with analyzeWorkout()
   - Generates PendingChange objects using calculateProgression()
   - Returns pending changes and sync status

3. Create Dashboard sync components:
   - src/components/Dashboard/SyncButton.tsx (trigger sync, loading state)
   - src/components/Dashboard/SyncStatus.tsx (last sync time, errors)
   - src/components/Dashboard/DiscrepancyAlert.tsx (weight mismatch warning)

4. Create Review Modal components (Phase 5):
   - src/components/ReviewModal/PendingChangeCard.tsx (display current vs proposed)
   - src/components/ReviewModal/WeightEditor.tsx (modify proposed weight)
   - src/components/ReviewModal/index.tsx (list changes, confirm/reject)
   - src/hooks/usePendingChanges.ts (manage pending changes state)
   - src/lib/apply-changes.ts (apply confirmed changes to state)

5. Write tests for each component in tests/integration/

IMPORTANT:
- Follow TDD: write tests first, then implement
- Use existing types from src/types/state.ts (PendingChange, ProgressionState)
- Use Tailwind CSS, 44px min tap targets for mobile
- Mark completed tasks in tasks.md with [x]
- Run npm test && npm run typecheck before finishing
```

### AGENT 2: Phase 6 (Update Hevy Routines) + Phase 7 (Dashboard)

```
Continue implementing the GZCLP Hevy Tracker. Focus on User Story 4 (update Hevy) and User Story 5 (dashboard).

CONTEXT:
- Project: /home/tim/gzclp-hevy-tracker
- Tasks file: /specs/001-gzclp-hevy-tracker/tasks.md
- Hevy API client COMPLETE in src/lib/hevy-client.ts (has createRoutine, updateRoutine)
- State types in src/types/state.ts
- Constants in src/lib/constants.ts (DAY_EXERCISES, SLOT_NAMES, etc.)

YOUR TASKS (in order):
1. Read src/lib/hevy-client.ts and src/types/hevy.ts (RoutineExerciseWrite, etc.)
2. Read src/lib/constants.ts for GZCLP structure (days, slots, schemes)

3. Create routine builder (Phase 6):
   - src/lib/routine-builder.ts - build RoutineExerciseWrite payloads with:
     - Correct weights from progression state
     - Correct sets/reps from stage scheme
     - Rest timers from settings
   - src/lib/routine-manager.ts:
     - findGZCLPRoutines() - find routines named "GZCLP A1/B1/A2/B2"
     - createGZCLPRoutines() - create A1/B1/A2/B2 if missing
     - updateGZCLPRoutine() - update routine with new weights

4. Create Hevy update UI:
   - src/components/Dashboard/UpdateHevyButton.tsx
   - src/components/Dashboard/UpdateStatus.tsx

5. Create Dashboard components (Phase 7):
   - src/components/Dashboard/ExerciseCard.tsx (weight, scheme, tier badge)
   - src/components/Dashboard/TierSection.tsx (group by T1/T2/T3)
   - src/components/Dashboard/NextWorkout.tsx (upcoming day exercises)
   - src/components/Dashboard/PendingBadge.tsx (pending changes indicator)
   - src/components/Dashboard/index.tsx (orchestrate all)

6. Update src/App.tsx to show Dashboard after setup complete

IMPORTANT:
- Follow TDD: write tests in tests/unit/ first
- Use existing Hevy client methods (createRoutine, updateRoutine)
- Dashboard should show ALL exercises grouped by tier
- Mark completed tasks in tasks.md with [x]
- Run npm test && npm run typecheck before finishing
```

### AGENT 3: Phase 8 (Export/Import) + Phase 9 (Polish)

```
Continue implementing the GZCLP Hevy Tracker. Focus on User Story 6 (export/import) and Phase 9 (polish).

CONTEXT:
- Project: /home/tim/gzclp-hevy-tracker
- Tasks file: /specs/001-gzclp-hevy-tracker/tasks.md
- State stored in localStorage under 'gzclp_state' key
- State type: GZCLPState in src/types/state.ts
- Migration system in src/lib/migrations.ts
- useProgram hook in src/hooks/useProgram.ts has resetState(), importState()

YOUR TASKS (in order):
1. Read src/types/state.ts (GZCLPState structure)
2. Read src/lib/migrations.ts (understand version migrations)

3. Create export/import logic (Phase 8):
   - src/lib/data-export.ts:
     - exportState() - serialize state, generate timestamped filename, trigger download
     - Include version in export
   - src/lib/data-import.ts:
     - validateImport() - parse JSON, validate structure, check version
     - importWithMigration() - apply migrations if needed

4. Create Settings components:
   - src/components/Settings/ExportButton.tsx
   - src/components/Settings/ImportButton.tsx (file input)
   - src/components/Settings/ImportConfirmDialog.tsx (warn about overwrite)
   - src/components/Settings/DeleteDataButton.tsx (clear with confirmation)
   - src/components/Settings/index.tsx (unit toggle, export/import, delete)

5. Add Settings navigation to App.tsx

6. Polish (Phase 9):
   - src/components/ErrorBoundary.tsx (catch React errors)
   - src/components/common/ErrorState.tsx (retry button, help link)
   - Add loading skeletons to Dashboard components
   - Audit all buttons for 44x44px minimum tap targets
   - Run npm run build and verify bundle < 200KB gzipped

7. Update quickstart.md with final commands

IMPORTANT:
- Export should warn user that API key is included
- Import must validate JSON structure before applying
- Use Tailwind CSS for all styling
- Mark completed tasks in tasks.md with [x]
- Run npm test && npm run typecheck before finishing
- Final: npm run build to verify production build works
```

---

## Verification Commands

After all agents complete:

```bash
# Verify all tests pass
npm test

# Verify types
npm run typecheck

# Verify lint
npm run lint

# Verify production build
npm run build

# Check bundle size
ls -la dist/assets/*.js | awk '{print $5}'
```

## Key Files Reference

| Purpose | File |
|---------|------|
| State types | `src/types/state.ts` |
| Hevy types | `src/types/hevy.ts` |
| Constants | `src/lib/constants.ts` |
| Hevy client | `src/lib/hevy-client.ts` |
| Progression logic | `src/lib/progression.ts` |
| Workout analysis | `src/lib/workout-analysis.ts` |
| State management | `src/hooks/useProgram.ts` |
| API connection | `src/hooks/useHevyApi.ts` |
| Tasks checklist | `specs/001-gzclp-hevy-tracker/tasks.md` |
