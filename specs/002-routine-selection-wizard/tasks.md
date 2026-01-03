# Tasks: Routine Selection Wizard

**Input**: Design documents from `/specs/002-routine-selection-wizard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by constitution (TDD NON-NEGOTIABLE). Write tests FIRST, verify they FAIL before implementation.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3, US4)
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared type definitions

- [X] T001 Add slot mapping constants (SLOT_MAPPING, T3_SLOTS) to src/lib/constants.ts
- [X] T002 [P] Add import-related types (RoutineSourceMode, AvailableRoutine, RoutineAssignment, ImportedExercise, ImportResult, ImportWarning) to src/types/state.ts
- [X] T003 [P] Add stage detection constants (T1_STAGE_PATTERNS, T2_STAGE_PATTERNS, STAGE_DISPLAY mapping 0→"Stage 1"/1→"Stage 2"/2→"Stage 3", STAGE_SCHEMES) to src/lib/constants.ts
- [X] T004 Create test helper file with mock routine factories in tests/helpers/routine-mocks.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core extraction logic that ALL import-related user stories depend on

**CRITICAL**: No user story implementation can begin until these core modules exist

### Tests for Foundational

- [X] T005 [P] Unit tests for stage detection (all T1/T2 patterns, AMRAP, unknown schemes) in tests/unit/stage-detector.test.ts
- [X] T006 [P] Unit tests for routine importer (slot mapping, weight extraction, warnings) in tests/unit/routine-importer.test.ts

### Implementation for Foundational

- [X] T007 Implement detectStage function (modal reps algorithm) in src/lib/stage-detector.ts
- [X] T008 Implement extractWeight function (max weight from normal sets) in src/lib/stage-detector.ts
- [X] T008b Implement weight unit conversion (kg↔lbs) in extractWeight based on UserSettings.weightUnit in src/lib/stage-detector.ts
- [X] T009 Implement toAvailableRoutine function in src/lib/routine-importer.ts
- [X] T010 Implement extractFromRoutines function (full extraction with warnings) in src/lib/routine-importer.ts

**Checkpoint**: Core extraction logic complete - verify all unit tests pass

---

## Phase 3: User Story 1 - Create New GZCLP Routines (Priority: P1) - MVP

**Goal**: Add routine source step; users choosing "Create New" continue existing flow

**Independent Test**: Enter valid API key → see source selection → choose "Create New" → continue to exercise selection → complete setup with new routines

### Tests for User Story 1

- [X] T011 [P] [US1] Integration test: wizard shows routine-source step after API key in tests/integration/setup-wizard-source.test.tsx
- [X] T012 [P] [US1] Unit test: RoutineSourceStep renders both options, disables "Use Existing" when no routines in tests/unit/routine-source-step.test.tsx

### Implementation for User Story 1

- [X] T013 [P] [US1] Create RoutineSourceStep component with two options; disable "Use Existing" when no routines in src/components/SetupWizard/RoutineSourceStep.tsx
- [X] T014 [US1] Add 'routine-source' step to SetupWizard state machine in src/components/SetupWizard/index.tsx
- [X] T015 [US1] Implement step transition: api-key → routine-source → exercises (for create path) in src/components/SetupWizard/index.tsx
- [X] T016 [US1] Add routine fetching on entering routine-source step (useHevyApi.getAllRoutines) in src/components/SetupWizard/index.tsx

**Checkpoint**: Create-new path works identically to before, with new source selection step

---

## Phase 4: User Story 2 - Import Existing Routines (Priority: P1)

**Goal**: Users can select which Hevy routines correspond to A1/B1/A2/B2

**Independent Test**: Enter valid API key → choose "Use Existing" → assign routines to all 4 slots → see routines assigned

### Tests for User Story 2

- [X] T018 [P] [US2] Unit test: RoutineSelector filters, sorts, displays exercise preview, shows search only when >10 routines in tests/unit/routine-selector.test.tsx
- [X] T019 [P] [US2] Unit test: RoutineAssignmentStep shows 4 slots, enables Next when 1+ assigned in tests/unit/routine-assignment-step.test.tsx
- [X] T020 [P] [US2] Integration test: import path navigates routine-source → routine-assign in tests/integration/setup-wizard-import.test.tsx

### Implementation for User Story 2

- [X] T021 [P] [US2] Create RoutineSelector component (full-screen modal, search, sorted by date) in src/components/common/RoutineSelector.tsx
- [X] T022 [P] [US2] Create useRoutineImport hook (manages availableRoutines, assignment, loadError) in src/hooks/useRoutineImport.ts
- [X] T023 [US2] Create RoutineAssignmentStep component (4 slots with RoutineSelector) in src/components/SetupWizard/RoutineAssignmentStep.tsx
- [X] T024 [US2] Add duplicate routine detection with warning badge in src/components/SetupWizard/RoutineAssignmentStep.tsx
- [X] T025 [US2] Add 'routine-assign' step to SetupWizard state machine in src/components/SetupWizard/index.tsx
- [X] T026 [US2] Implement step transition: routine-source → routine-assign (for import path) in src/components/SetupWizard/index.tsx

**Checkpoint**: Users can assign routines to all 4 GZCLP days

---

## Phase 5: User Story 3 - Review Extracted Exercises and Stages (Priority: P1)

**Goal**: Display extracted exercises with detected stages; allow editing before confirm

**Independent Test**: After assigning routines → see table of exercises with slot/weight/stage → edit a stage → change saved

### Tests for User Story 3

- [X] T027 [P] [US3] Unit test: ImportReviewStep displays exercises with slot, weight, stage in tests/unit/import-review-step.test.tsx
- [X] T028 [P] [US3] Unit test: Stage can be overridden for 'manual' confidence items in tests/unit/import-review-step.test.tsx
- [X] T029 [P] [US3] Unit test: Warnings displayed prominently at top in tests/unit/import-review-step.test.tsx

### Implementation for User Story 3

- [X] T030 [P] [US3] Create ImportReviewStep component (table with slot, weight, stage columns) in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T031 [US3] Add stage selector dropdown for 'manual' confidence exercises in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T032 [US3] Add weight editing input for each exercise in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T032b [US3] Add slot reassignment dropdown allowing exercise to be moved to different slot in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T033 [US3] Add warnings section at top of review (no_t2, stage_unknown, duplicate, weight_null) in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T034 [US3] Add 'import-review' step to SetupWizard state machine in src/components/SetupWizard/index.tsx
- [X] T035 [US3] Wire extraction: call extractFromRoutines when entering import-review step in src/components/SetupWizard/index.tsx
- [X] T036 [US3] Add updateExercise method to useRoutineImport hook for user edits in src/hooks/useRoutineImport.ts

**Checkpoint**: Users can review and edit all extracted exercises before finalizing

---

## Phase 6: User Story 4 - Set Next Workout in Rotation (Priority: P1)

**Goal**: User specifies which GZCLP day (A1/B1/A2/B2) to do next

**Independent Test**: After review → see "Which workout next?" → select B2 → complete setup → dashboard shows B2 as next

### Tests for User Story 4

- [X] T037 [P] [US4] Unit test: NextWorkoutStep shows 4 day options, defaults to A1 in tests/unit/next-workout-step.test.tsx
- [X] T038 [P] [US4] Integration test: selected day persists to ProgramConfig.currentDay AND hevyRoutineIds contains assigned routine IDs in tests/integration/setup-wizard-e2e.test.tsx

### Implementation for User Story 4

- [X] T039 [P] [US4] Create NextWorkoutStep component (4 buttons for A1/B1/A2/B2) in src/components/SetupWizard/NextWorkoutStep.tsx
- [X] T040 [US4] Add 'next-workout' step to SetupWizard state machine in src/components/SetupWizard/index.tsx
- [X] T041 [US4] Wire both paths to include next-workout: import-review → next-workout → complete in src/components/SetupWizard/index.tsx
- [X] T042 [US4] Wire create path to include next-workout: weights → next-workout → complete in src/components/SetupWizard/index.tsx
- [X] T043 [US4] Implement commit: save exercises, progression, routine IDs, currentDay to state in src/components/SetupWizard/index.tsx

**Checkpoint**: Complete wizard flow works for both create and import paths

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, documentation, and cleanup

- [X] T044 [P] End-to-end integration test: full import flow from API key to dashboard in tests/integration/setup-wizard-e2e.test.tsx
- [X] T045 [P] End-to-end integration test: full create flow still works in tests/integration/setup-wizard-create-e2e.test.tsx
- [X] T046 Mobile UX validation: test routine selector with 50+ items (search, scroll, tap targets); verify full import flow completes in <2 minutes per SC-003
- [X] T047 Update progress indicator in SetupWizard to show correct step count for each path in src/components/SetupWizard/index.tsx
- [X] T048 Run npm test && npm run lint to verify all tests pass and no lint errors
- [X] T049 Update specs/002-routine-selection-wizard/checklists/requirements.md with completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3-6 (User Stories)**: All depend on Phase 2 completion
  - US1 can start immediately after Phase 2
  - US2 depends on US1 (needs routine-source step)
  - US3 depends on US2 (needs routine-assign step)
  - US4 depends on US3 (needs import-review step)
- **Phase 7 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL
    ↓
US1 (Create Path) ← MVP checkpoint
    ↓
US2 (Import Assignment)
    ↓
US3 (Import Review)
    ↓
US4 (Next Workout)
    ↓
Phase 7 (Polish)
```

**Note**: Unlike typical user stories, these are sequential because each wizard step depends on the previous step existing.

### Within Each User Story

1. Tests MUST be written and FAIL before implementation (TDD mandate)
2. Components can be created in parallel [P]
3. State machine updates depend on components existing
4. Verify tests pass before marking story complete

### Parallel Opportunities

**Phase 1 (parallel)**:
- T002 (types) || T003 (constants)

**Phase 2 (parallel tests, then sequential impl)**:
- T005 || T006 (unit tests)
- T007 → T008 → T009 → T010 (sequential implementation)

**Each User Story (parallel tests, then impl)**:
- All [P] tests can run together
- [P] components can be created together
- State machine updates are sequential

---

## Parallel Example: Phase 2

```bash
# Launch unit tests in parallel (both should fail initially):
Task: "Unit tests for stage detection in tests/unit/stage-detector.test.ts"
Task: "Unit tests for routine importer in tests/unit/routine-importer.test.ts"

# After tests written, implement sequentially:
Task: "Implement detectStage in src/lib/stage-detector.ts"
Task: "Implement extractWeight in src/lib/stage-detector.ts"
# Verify stage-detector.test.ts passes before continuing
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types, constants)
2. Complete Phase 2: Foundational (stage-detector, routine-importer)
3. Complete Phase 3: User Story 1 (create path with source step)
4. **STOP and VALIDATE**: Test create path end-to-end
5. Existing functionality still works with new source selection step

### Incremental Delivery

1. Setup + Foundational → Core extraction logic ready
2. Add US1 → Create path works → **MVP checkpoint**
3. Add US2 → Routine assignment works → Import path partially functional
4. Add US3 → Review/edit works → Import path feature-complete
5. Add US4 → Next workout works → Both paths complete
6. Polish → Full test coverage, documentation

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Phase 1: Setup | 4 | 2 groups |
| Phase 2: Foundational | 7 | 2 test tasks |
| Phase 3: US1 | 6 | 3 test/component tasks |
| Phase 4: US2 | 9 | 5 test/component tasks |
| Phase 5: US3 | 11 | 4 test/component tasks |
| Phase 6: US4 | 7 | 3 test/component tasks |
| Phase 7: Polish | 6 | 2 test tasks |
| **Total** | **50** | Multiple per phase |

---

## Notes

- Constitution mandates TDD: ALL tests must be written and fail before implementation
- Stage numbering: Internal 0/1/2, display as "Stage 1/2/3"
- Partial import: Unassigned days use existing SlotAssignment flow after setup completes; no additional task required
- Weight extraction: Max from normal sets (excludes warmup, dropset, failure)
- Mobile UX: 44x44px touch targets, full-screen modals for selectors
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
