# Tasks: Exercise Classification System

**Input**: Design documents from `/specs/003-exercise-classification/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required per project constitution (TDD is NON-NEGOTIABLE)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Includes exact file paths

---

## Phase 1: Setup

**Purpose**: Types and configuration

- [X] T001 [P] Create src/types/classification.ts that re-exports types from specs/003-exercise-classification/contracts/classification-types.ts
- [X] T002 [P] Add ExerciseCategory re-export to src/types/state.ts

**Checkpoint**: Types available for all subsequent phases

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (TDD - write first, must fail)

- [X] T003 [P] Write unit tests for classification store CRUD in tests/unit/classification-store.test.ts
- [X] T004 [P] Write unit tests for sync queue operations in tests/unit/sync-queue.test.ts
- [X] T005 [P] Write unit tests for useExerciseClassifications hook in tests/unit/useExerciseClassifications.test.ts (include test: isGZCLPCategory returns false for Warmup/Cooldown/Supplemental)

### Implementation

- [X] T006 [P] Implement classification store with getClassifications, setClassification, getClassification, hasClassification in src/lib/classification-store.ts
- [X] T007 [P] Implement sync queue with addToQueue, removeFromQueue, getQueueItems, processQueue in src/lib/sync-queue.ts
- [X] T008 Implement useExerciseClassifications hook returning { classifications, classify, reclassify, checkConflict } in src/hooks/useExerciseClassifications.ts
- [X] T009 Run tests to verify foundational modules pass in tests/unit/

**Checkpoint**: Foundation ready - classification store, sync queue, and hook operational

---

## Phase 3: User Story 1 - Classify Exercises During Import (Priority: P1) 🎯 MVP

**Goal**: Users can classify each exercise into one of six categories during routine import

**Independent Test**: Import a Hevy routine, assign categories to all exercises, verify import completes and classifications persist

### Tests (TDD - write first, must fail)

- [X] T010 [US1] Write integration test for classification during import flow in tests/integration/exercise-classification-flow.test.tsx
- [X] T010a [US1] Add negative test case: verify no UI path exists to create exercises outside Hevy import in tests/integration/exercise-classification-flow.test.tsx

### Implementation

- [X] T011 [US1] Create CategoryDropdown component with six category options in src/components/common/CategoryDropdown.tsx
- [X] T012 [US1] Extend ImportReviewStep to display CategoryDropdown per exercise row in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T013 [US1] Add validation: block import completion if any exercise lacks category in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T014 [US1] Wire import confirmation to save classifications via classification store in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T015 [US1] Wire SetupWizard to track exerciseCategories state and pass props to ImportReviewStep in src/components/SetupWizard/index.tsx
- [X] T016 [US1] Run integration test to verify import classification flow in tests/integration/

**Checkpoint**: User Story 1 complete - full classification during import flow implemented and tested.

---

## Phase 4: User Story 2 - Reclassify Exercises After Import (Priority: P2)

**Goal**: Users can change an exercise's classification at any time after import

**Independent Test**: Access settings, change an exercise from T3 to Supplemental, verify change persists globally

### Implementation

- [X] T017 [P] [US2] Create ExerciseManager component listing all classified exercises with category dropdowns in src/components/Settings/ExerciseManager.tsx
- [X] T018 [US2] Add ExerciseManager to Settings page in src/components/Settings/index.tsx
- [X] T019 [US2] Wire reclassification to update classification store globally in src/components/Settings/ExerciseManager.tsx
- [X] T020 [US2] Verify historical workout entries retain original categoryAtTime and progression module only processes exercises where isGZCLPCategory returns true (no code changes expected - existing logic uses Tier type)

**Checkpoint**: User Story 2 complete - reclassification functional from settings

---

## Phase 5: User Story 3 - View Exercises by Category in Workout (Priority: P2)

**Goal**: Exercises organized by category with warmup/cooldown in collapsible sections

**Independent Test**: View workout containing all categories, verify warmup at top (collapsible), GZCLP in main, supplemental with badge, cooldown at bottom (collapsible)

### Implementation

- [X] T021 [P] [US3] Create CollapsibleSection component using native details/summary with Tailwind styling in src/components/common/CollapsibleSection.tsx
- [X] T022 [P] [US3] Create SupplementalBadge component for visual marker in src/components/common/SupplementalBadge.tsx
- [X] T023 [US3] Update Dashboard to group exercises by category in src/components/Dashboard/index.tsx
- [X] T024 [US3] Render warmup exercises in CollapsibleSection at top of Dashboard in src/components/Dashboard/index.tsx
- [X] T025 [US3] Render cooldown exercises in CollapsibleSection at bottom of Dashboard in src/components/Dashboard/index.tsx
- [X] T026 [US3] Render supplemental exercises inline with SupplementalBadge in src/components/Dashboard/index.tsx
- [X] T027 [US3] Update TierSection to support category display (title, color per CATEGORY_DISPLAY) in src/components/Dashboard/TierSection.tsx

**Checkpoint**: User Story 3 complete - workout view shows categorized layout

---

## Phase 6: User Story 4 - Resolve Classification Conflicts (Priority: P3)

**Goal**: When re-importing a routine with an already-classified exercise, prompt user to resolve conflict

**Independent Test**: Import routine A with Lat Pulldown as T3, import routine B with Lat Pulldown, verify conflict prompt appears with keep/update options

### Tests (TDD - write first, must fail)

- [X] T028 [US4] Write integration test for conflict detection and resolution in tests/integration/conflict-resolution.test.tsx

### Implementation

- [X] T029 [P] [US4] Create ConflictResolutionModal component in src/components/SetupWizard/ConflictResolutionModal.tsx
- [X] T030 [US4] Add conflict detection logic to import flow using checkConflict from hook in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T031 [US4] Display ConflictResolutionModal when conflicts detected during import in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T032 [US4] Implement keep existing option (skip reclassification) in src/components/SetupWizard/ConflictResolutionModal.tsx
- [X] T033 [US4] Implement update classification option (global reclassify) in src/components/SetupWizard/ConflictResolutionModal.tsx
- [X] T034 [US4] Run integration test to verify conflict resolution in tests/integration/

**Checkpoint**: User Story 4 complete - conflict resolution functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories

- [X] T035 [P] Update quickstart.md with final implementation details in specs/003-exercise-classification/quickstart.md
- [X] T036 [P] Add sync queue processing trigger on online status change in src/App.tsx
- [X] T037 Run full test suite: npm test (520 tests passing)
- [X] T038 Run typecheck: npm run typecheck (pre-existing errors in useRoutineImport.ts only)
- [X] T039 Run lint: npm run lint (pre-existing issues in other files, new code is clean)
- [X] T040 Manual validation: test all acceptance scenarios from spec.md including: non-GZCLP exercises appear in workout history, reclassification achievable in 3 taps or fewer

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3-6 (User Stories)**: All depend on Phase 2 completion
- **Phase 7 (Polish)**: Depends on all user stories complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (P1) | Phase 2 only | None (do first for MVP) |
| US2 (P2) | Phase 2 only | US3 (different components) |
| US3 (P2) | Phase 2 only | US2 (different components) |
| US4 (P3) | US1 (uses import flow) | None |

### Within Each Phase

1. TDD: Tests written and failing before implementation
2. Types → Store → Hook → Components
3. Core logic before UI integration
4. Verify tests pass after implementation

---

## Parallel Opportunities

### Phase 2 (Foundational)

```text
# All tests can be written in parallel:
T003, T004, T005 → parallel

# All store implementations can be written in parallel:
T006, T007 → parallel
```

### User Stories 2 & 3 (Same Priority)

```text
# Can be developed simultaneously by different developers:
US2: T017-T020 (Settings/ExerciseManager)
US3: T021-T027 (Dashboard/CollapsibleSection)
```

### Phase 6 (US4)

```text
# Test and modal component can be parallel:
T028, T029 → parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T009)
3. Complete Phase 3: User Story 1 (T010-T016)
4. **STOP and VALIDATE**: Import routine, classify exercises, verify persistence
5. Deploy/demo as MVP

### Incremental Delivery

1. MVP: Setup + Foundational + US1 → Core classification working
2. Add US2 + US3 (parallel) → Reclassification + workout view
3. Add US4 → Conflict resolution for power users
4. Polish → Full validation, documentation

### Single Developer Path

```text
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 →
T010 → T010a → T011 → T012 → T013 → T014 → T015 → T016 → (MVP checkpoint) →
T017 → T018 → T019 → T020 →
T021 → T022 → T023 → T024 → T025 → T026 → T027 →
T028 → T029 → T030 → T031 → T032 → T033 → T034 →
T035 → T036 → T037 → T038 → T039 → T040
```

---

## Notes

- Constitution mandates TDD: all tests must fail before implementation
- [P] tasks = different files, no dependencies within same phase
- [US#] label maps task to specific user story
- Each user story independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate functionality
