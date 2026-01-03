# Tasks: GZCLP Hevy Progression Tracker

**Input**: Design documents from `/specs/001-gzclp-hevy-tracker/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD approach - tests are included per CLAUDE.md workflow requirements.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project structure and configure development environment

- [x] T001 Initialize Vite project with React 18 and TypeScript 5.x (strict mode) in repository root
- [x] T002 [P] Configure Tailwind CSS 4.x with mobile-first defaults (using @tailwindcss/vite plugin)
- [x] T003 [P] Configure Vitest for unit and integration testing in vitest.config.ts
- [x] T004 [P] Configure ESLint and Prettier for code quality in eslint.config.js and .prettierrc
- [x] T005 [P] Create project directory structure per plan.md (src/components/, src/hooks/, src/lib/, src/types/, src/utils/, tests/)
- [x] T006 [P] Configure TypeScript paths in tsconfig.json for clean imports (@/components, @/lib, etc.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, utilities, and infrastructure that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Core Types

- [x] T007 [P] Re-export Hevy API types in src/types/hevy.ts from contracts/hevy-api.ts (re-export, do not duplicate)
- [x] T008 [P] Create application state types in src/types/state.ts (GZCLPState, ProgramConfig, ExerciseConfig, ProgressionState, PendingChange, UserSettings)
- [x] T009 [P] Create GZCLP constants in src/lib/constants.ts (slots, tiers, stages, rep schemes, weight increments, rest timers)

### Core Utilities

- [x] T010 [P] Implement weight rounding utility in src/utils/formatting.ts (round to 2.5kg or 5lb increments)
- [x] T011 [P] Implement validation utilities in src/utils/validation.ts (API key format, weight ranges)
- [x] T012 [P] Implement UUID generator utility in src/utils/id.ts

### localStorage Infrastructure

- [x] T013 Implement useLocalStorage hook in src/hooks/useLocalStorage.ts (lazy init, JSON safety, cross-tab sync)
- [x] T014 Implement state migration system in src/lib/migrations.ts (version-based schema migrations)
- [x] T015 Create initial state factory in src/lib/state-factory.ts (default GZCLPState creation)

### Hevy API Client

- [x] T016 Implement Hevy API client base in src/lib/hevy-client.ts (config, fetch wrapper, error handling, rate limiting)
- [x] T017 Add exercise templates endpoint to src/lib/hevy-client.ts (GET /v1/exercise_templates with pagination)
- [x] T018 Add workouts endpoint to src/lib/hevy-client.ts (GET /v1/workouts with pagination)
- [x] T019 Add routines read endpoint to src/lib/hevy-client.ts (GET /v1/routines)
- [x] T020 Add routines write endpoints to src/lib/hevy-client.ts (POST, PUT /v1/routines)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Initial Program Setup (Priority: P1) - MVP

**Goal**: Users can configure their GZCLP program with API key, exercises, and starting weights

**Independent Test**: Enter API key, select exercises for each slot, set starting weights, verify configuration saved

### Tests for User Story 1

> **RED PHASE**: Write these tests FIRST. Run `npm test` and verify ALL tests in this section FAIL before proceeding to implementation.

- [x] T021 [P] [US1] Unit tests for API key validation in tests/unit/validation.test.ts
- [x] T022 [P] [US1] Unit tests for exercise config creation in tests/unit/exercise-config.test.ts
- [x] T023 [P] [US1] Integration tests for setup wizard flow in tests/integration/setup-wizard.test.tsx
- [x] T024 [US1] **CHECKPOINT**: Run `npm test -- --grep US1` and confirm all tests GREEN (passing)

### Implementation for User Story 1

> **GREEN PHASE**: Implement minimal code to make tests pass. Do not proceed until T024 checkpoint completed.

- [x] T025 [P] [US1] Create useHevyApi hook in src/hooks/useHevyApi.ts (API connection state, exercise templates fetching)
- [x] T026 [P] [US1] Create useProgram hook in src/hooks/useProgram.ts (program configuration management)
- [x] T027 [US1] Create ApiKeyStep component in src/components/SetupWizard/ApiKeyStep.tsx (key input, validation, connection test)
- [x] T028 [US1] Create ExerciseSelector component in src/components/SetupWizard/ExerciseSelector.tsx (searchable exercise list from Hevy)
- [x] T029 [US1] Create SlotAssignment component in src/components/SetupWizard/SlotAssignment.tsx (assign exercises to T1/T2/T3 slots)
- [x] T030 [US1] Create WeightInput component in src/components/SetupWizard/WeightInput.tsx (starting weight entry with unit toggle)
- [x] T031 [US1] Create UnitSelector component in src/components/SetupWizard/UnitSelector.tsx (kg/lbs preference)
- [x] T032 [US1] Create SetupWizard container in src/components/SetupWizard/index.tsx (multi-step wizard orchestration)
- [x] T033 [US1] Create SetupComplete component in src/components/SetupWizard/SetupComplete.tsx (confirmation and dashboard redirect)
- [x] T034 [US1] Integrate SetupWizard into App.tsx with conditional rendering based on setup status

**Checkpoint**: User Story 1 complete - users can configure their GZCLP program

---

## Phase 4: User Story 2 - Sync Workouts and Calculate Progression (Priority: P2)

**Goal**: Users sync completed workouts from Hevy and see progression recommendations

**Independent Test**: Complete workout in Hevy, sync, verify correct progression recommendation appears

### Tests for User Story 2

> **RED PHASE**: Write these tests FIRST. Run `npm test` and verify ALL tests in this section FAIL before proceeding to implementation.

- [x] T035 [P] [US2] Unit tests for T1 progression logic (5x3 -> 6x2 -> 10x1 -> deload) in tests/unit/progression-t1.test.ts
- [x] T036 [P] [US2] Unit tests for T2 progression logic (3x10 -> 3x8 -> 3x6 -> deload) in tests/unit/progression-t2.test.ts
- [x] T037 [P] [US2] Unit tests for T3 progression logic (25+ reps to advance) in tests/unit/progression-t3.test.ts
- [x] T038 [P] [US2] Unit tests for deload calculation (85% rounded to 2.5kg or 5lb based on unit preference) in tests/unit/progression-deload.test.ts
- [x] T039 [P] [US2] Unit tests for workout analysis (extract reps, detect success/failure) in tests/unit/workout-analysis.test.ts
- [x] T040 [P] [US2] Unit test for extra sets beyond prescribed scheme in tests/unit/workout-analysis.test.ts (verify only prescribed sets used)
- [x] T041 [P] [US2] Unit test for skipped workout days in tests/unit/workout-analysis.test.ts (verify chronological processing)
- [x] T042 [P] [US2] Unit test for no matching exercises in tests/unit/workout-analysis.test.ts (verify graceful empty result)
- [x] T043 [P] [US2] Unit test for partial workout (some exercises missing) in tests/unit/workout-analysis.test.ts
- [x] T044 [US2] Integration tests for sync flow in tests/integration/sync-flow.test.tsx
- [x] T045 [US2] **CHECKPOINT**: Run `npm test -- --grep US2` and confirm all tests GREEN (passing)

### Implementation for User Story 2

> **GREEN PHASE**: Implement minimal code to make tests pass. Do not proceed until T045 checkpoint completed.

- [x] T046 [US2] Implement workout analysis logic in src/lib/workout-analysis.ts (match workouts to exercises, extract sets/reps, determine success/failure)
- [x] T047 [US2] Implement T1 progression rules in src/lib/progression.ts (5x3+ success/failure, stage transitions)
- [x] T048 [US2] Implement T2 progression rules in src/lib/progression.ts (3x10 success/failure, stage transitions)
- [x] T049 [US2] Implement T3 progression rules in src/lib/progression.ts (25+ rep threshold)
- [x] T050 [US2] Implement deload calculation in src/lib/progression.ts (85% with rounding to 2.5kg or 5lb)
- [x] T051 [US2] Implement PendingChange generator in src/lib/progression.ts (create change objects with reasons)
- [x] T052 [US2] Implement discrepancy detection in src/lib/workout-analysis.ts (compare synced weight vs stored weight)
- [x] T053 [US2] Create useProgression hook in src/hooks/useProgression.ts (analyze workouts, generate pending changes)
- [x] T054 [US2] Create SyncButton component in src/components/Dashboard/SyncButton.tsx (trigger sync, show loading state)
- [x] T055 [US2] Create SyncStatus component in src/components/Dashboard/SyncStatus.tsx (last sync timestamp, sync errors)
- [x] T056 [P] [US2] Create DiscrepancyAlert component in src/components/Dashboard/DiscrepancyAlert.tsx (show mismatch, offer resolution options)
- [x] T057 [US2] Integrate sync functionality and discrepancy handling into Dashboard
- [x] T058 [US2] Implement partial sync recovery in src/lib/workout-analysis.ts (track lastProcessedWorkoutId, resume on retry)

**Checkpoint**: User Story 2 complete - users can sync and see progression recommendations

---

## Phase 5: User Story 3 - Review and Confirm Progression Changes (Priority: P3)

**Goal**: Users review pending changes and confirm/reject/modify before application

**Independent Test**: Generate recommendations, verify user can accept, reject, or modify each

### Tests for User Story 3

> **RED PHASE**: Write these tests FIRST. Run `npm test` and verify ALL tests in this section FAIL before proceeding to implementation.

- [x] T059 [P] [US3] Unit tests for pending change application in tests/unit/pending-changes.test.ts
- [x] T060 [US3] Integration tests for review modal flow in tests/integration/review-modal.test.tsx
- [x] T061 [US3] **CHECKPOINT**: Run `npm test -- --grep US3` and confirm all tests GREEN (passing)

### Implementation for User Story 3

> **GREEN PHASE**: Implement minimal code to make tests pass. Do not proceed until T061 checkpoint completed.

- [x] T062 [P] [US3] Create PendingChangeCard component in src/components/ReviewModal/PendingChangeCard.tsx (display current vs proposed values)
- [x] T063 [P] [US3] Create WeightEditor component in src/components/ReviewModal/WeightEditor.tsx (modify proposed weight)
- [x] T064 [US3] Create ReviewModal container in src/components/ReviewModal/index.tsx (list changes, confirm/reject actions)
- [x] T065 [US3] Implement change application logic in src/lib/apply-changes.ts (update progression state from confirmed changes)
- [x] T066 [US3] Create usePendingChanges hook in src/hooks/usePendingChanges.ts (manage pending changes state, apply/reject)
- [x] T067 [US3] Integrate ReviewModal into Dashboard with pending changes indicator

**Checkpoint**: User Story 3 complete - users can review and manage progression changes

---

## Phase 6: User Story 4 - Update Hevy Routines (Priority: P4)

**Goal**: Confirmed changes are pushed to Hevy routines

**Independent Test**: Confirm progression change, verify Hevy routine reflects new weight/rep scheme

### Tests for User Story 4

> **RED PHASE**: Write these tests FIRST. Run `npm test` and verify ALL tests in this section FAIL before proceeding to implementation.

- [x] T068 [P] [US4] Unit tests for routine builder in tests/unit/routine-builder.test.ts
- [x] T069 [US4] Integration tests for Hevy update flow in tests/integration/hevy-update.test.tsx
- [x] T070 [US4] **CHECKPOINT**: Run `npm test -- --grep US4` and confirm all tests RED (failing)

### Implementation for User Story 4

> **GREEN PHASE**: Implement minimal code to make tests pass. Do not proceed until T070 checkpoint completed.

- [x] T071 [US4] Implement routine builder in src/lib/routine-builder.ts (build RoutineExerciseWrite payloads with weights, sets, rest timers)
- [x] T072 [US4] Implement routine detection in src/lib/routine-manager.ts (find existing GZCLP routines by naming convention: "GZCLP A1", "GZCLP B1", etc.)
- [x] T073 [US4] Implement routine creation in src/lib/routine-manager.ts (create A1/B1/A2/B2 routines if none exist)
- [x] T074 [US4] Implement routine update in src/lib/routine-manager.ts (update existing routines with new weights/schemes)
- [x] T075 [US4] Create UpdateHevyButton component in src/components/Dashboard/UpdateHevyButton.tsx (push changes, show status)
- [x] T076 [US4] Create UpdateStatus component in src/components/Dashboard/UpdateStatus.tsx (success/failure feedback)
- [x] T077 [US4] Integrate Hevy update functionality into Dashboard after change confirmation

**Checkpoint**: User Story 4 complete - users can push changes to Hevy

---

## Phase 7: User Story 5 - Dashboard Overview (Priority: P5)

**Goal**: Users see all exercises with current status at a glance

**Independent Test**: View dashboard after setup, verify all exercises appear with weight, stage, status

### Tests for User Story 5

> **RED PHASE**: Write these tests FIRST. Run `npm test` and verify ALL tests in this section FAIL before proceeding to implementation.

- [x] T078 [US5] Integration tests for dashboard display in tests/integration/dashboard.test.tsx
- [x] T079 [US5] **CHECKPOINT**: Run `npm test -- --grep US5` and confirm all tests RED (failing)

### Implementation for User Story 5

> **GREEN PHASE**: Implement minimal code to make tests pass. Do not proceed until T079 checkpoint completed.

- [x] T080 [P] [US5] Create ExerciseCard component in src/components/Dashboard/ExerciseCard.tsx (weight, rep scheme, tier badge)
- [x] T081 [P] [US5] Create TierSection component in src/components/Dashboard/TierSection.tsx (group exercises by T1/T2/T3)
- [x] T082 [P] [US5] Create NextWorkout component in src/components/Dashboard/NextWorkout.tsx (show upcoming day's exercises)
- [x] T083 [P] [US5] Create PendingBadge component in src/components/Dashboard/PendingBadge.tsx (visual indicator for pending changes)
- [x] T084 [US5] Create Dashboard container in src/components/Dashboard/index.tsx (orchestrate all dashboard components)
- [x] T085 [US5] Add dashboard header with sync timestamp and action buttons

**Checkpoint**: User Story 5 complete - users have full dashboard overview

---

## Phase 8: User Story 6 - Data Export and Import (Priority: P6)

**Goal**: Users can export/import progression data for backup or device transfer

**Independent Test**: Export data, clear localStorage, import data, verify program state restored

### Tests for User Story 6

> **RED PHASE**: Write these tests FIRST. Run `npm test` and verify ALL tests in this section FAIL before proceeding to implementation.

- [x] T086 [P] [US6] Unit tests for export serialization in tests/unit/export.test.ts
- [x] T087 [P] [US6] Unit tests for import validation in tests/unit/import.test.ts
- [x] T088 [US6] Integration tests for export/import flow in tests/integration/data-transfer.test.tsx
- [x] T089 [US6] **CHECKPOINT**: Run `npm test -- --grep US6` and confirm all tests RED (failing)

### Implementation for User Story 6

> **GREEN PHASE**: Implement minimal code to make tests pass. Do not proceed until T089 checkpoint completed.

- [x] T090 [US6] Implement data export in src/lib/data-export.ts (serialize state, generate timestamped filename, trigger download)
- [x] T091 [US6] Implement data import validation in src/lib/data-import.ts (parse JSON, validate structure, check version)
- [x] T092 [US6] Implement data import with migration in src/lib/data-import.ts (apply migrations, merge state)
- [x] T093 [P] [US6] Create ExportButton component in src/components/Settings/ExportButton.tsx (trigger export)
- [x] T094 [P] [US6] Create ImportButton component in src/components/Settings/ImportButton.tsx (file input, trigger import)
- [x] T095 [US6] Create ImportConfirmDialog component in src/components/Settings/ImportConfirmDialog.tsx (warn about overwrite)
- [x] T096 [US6] Create DeleteDataButton component in src/components/Settings/DeleteDataButton.tsx (clear all local data with confirmation)
- [x] T097 [US6] Create Settings page in src/components/Settings/index.tsx (unit toggle, export/import, delete data)
- [x] T098 [US6] Add Settings navigation to App.tsx

**Checkpoint**: User Story 6 complete - users can manage their data

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T099 [P] Add loading states and skeleton components across all views
- [x] T100 [P] Add error boundary component in src/components/ErrorBoundary.tsx
- [x] T101 Integrate ErrorBoundary into App.tsx wrapping Dashboard, SetupWizard, and Settings
- [x] T102 [P] Implement offline detection and cached data viewing for graceful Hevy unavailability
- [x] T103 [P] Create ErrorState component in src/components/common/ErrorState.tsx (retry button, cached data indicator, help link)
- [x] T104 [P] Add keyboard navigation support for accessibility
- [x] T105 [P] Verify 44x44px minimum tap targets for mobile (audit all buttons)
- [x] T106 [P] Add input sanitization audit for XSS prevention (review all user inputs displayed in UI)
- [x] T107 Verify bundle size < 200KB gzipped
- [x] T108 Run full test suite and fix any failures
- [x] T109 Update quickstart.md with final commands and troubleshooting
- [x] T110 Final code review and cleanup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational completion
  - User stories can proceed sequentially (P1 -> P2 -> P3 -> P4 -> P5 -> P6)
  - Or in parallel if team capacity allows (after Foundational)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Can Start After | May Integrate With |
|-------|-----------------|-------------------|
| US1 (Setup) | Foundational | None |
| US2 (Sync) | Foundational | US1 (uses exercise configs) |
| US3 (Review) | Foundational | US2 (displays pending changes) |
| US4 (Update Hevy) | Foundational | US3 (uses confirmed changes) |
| US5 (Dashboard) | Foundational | US1, US2, US3 (displays all data) |
| US6 (Export/Import) | Foundational | US1 (exports state) |

### Recommended Order

For solo developer (sequential):
1. Phase 1 + 2 (Setup + Foundational)
2. US1 -> US2 -> US3 -> US4 -> US5 -> US6
3. Phase 9 (Polish)

For team (parallel after foundation):
- Dev A: US1 -> US4
- Dev B: US2 -> US3
- Dev C: US5 -> US6

---

## Parallel Opportunities

### Phase 1: Setup
```
Parallel group 1: T002, T003, T004, T005, T006
```

### Phase 2: Foundational
```
Parallel group 1: T007, T008, T009
Parallel group 2: T010, T011, T012
Then sequential: T013 -> T014 -> T015
Then sequential: T016 -> T017, T018, T019, T020
```

### User Story 1
```
Parallel tests: T021, T022, T023
Parallel hooks: T024, T025
Parallel components: T026, T027, T028, T029, T030
Then: T031 -> T032 -> T033
```

### User Story 2
```
Parallel tests: T034, T035, T036, T037, T038
Then: T039
Sequential implementation: T040 -> T041 -> T042 -> T043 -> T044 -> T045 -> T046
Parallel components: T047, T048
Then: T049
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1: Program Setup)
3. **VALIDATE**: Can configure program with exercises and weights
4. Complete Phase 4 (US2: Sync and Calculate)
5. **VALIDATE**: Can sync workouts and see recommendations
6. Deploy/demo basic functionality

### Incremental Delivery

Each phase adds independent value:
- After US1: App is configured, ready for tracking
- After US2: Core progression logic works
- After US3: Users have full control over changes
- After US4: Full loop complete (Hevy -> App -> Hevy)
- After US5: Polished user experience
- After US6: Data sovereignty complete

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Setup | 6 | 5 tasks in parallel |
| Foundational | 14 | 9 tasks in parallel groups |
| US1 (Setup) | 14 | 8 tasks in parallel groups |
| US2 (Sync) | 24 | 12 tasks in parallel groups |
| US3 (Review) | 9 | 3 tasks in parallel |
| US4 (Update) | 10 | 2 tasks in parallel |
| US5 (Dashboard) | 8 | 4 tasks in parallel |
| US6 (Export) | 13 | 4 tasks in parallel |
| Polish | 12 | 7 tasks in parallel |
| **Total** | **110** | ~54 parallelizable |

**Suggested MVP Scope**: Phases 1-4 (US1 + US2) = 58 tasks
