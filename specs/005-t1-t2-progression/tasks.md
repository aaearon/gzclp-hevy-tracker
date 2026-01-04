# Tasks: Separate T1 and T2 Progression Tracking

**Input**: Design documents from `/specs/005-t1-t2-progression/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**TDD Required**: Per constitution, tests MUST be written before implementation (Red-Green-Refactor)

**Organization**: Tasks grouped by user story for independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add new types and infrastructure before modifying existing code

- [X] T001 Add ProgressionKey type alias to src/types/state.ts
- [X] T002 [P] Add MainLiftWeights interface to src/types/state.ts for T1/T2 weight storage and import detection (FR-001: 8 weights total)
- [X] T003 [P] Export T1_MAPPING and T2_MAPPING from src/lib/role-utils.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can begin

**⚠️ CRITICAL**: The getProgressionKey function is required by ALL user stories

### Tests First (TDD Red Phase)

- [X] T004 Write failing tests for getProgressionKey in tests/unit/progression-keys.test.ts
- [X] T005 [P] Write failing tests for weight validation in tests/unit/weight-validation.test.ts

### Implementation (TDD Green Phase)

- [X] T006 Implement getProgressionKey function in src/lib/role-utils.ts
- [X] T007 [P] Implement validateWeight function in src/utils/validation.ts
- [X] T008 Verify T004 and T005 tests now pass

**Checkpoint**: Foundation ready - `getProgressionKey` and `validateWeight` available for all stories

---

## Phase 3: User Story 1 - Independent Progression Tracking (Priority: P1) 🎯 MVP

**Goal**: T1 and T2 progressions are completely independent - failing T1 Squat does not affect T2 Squat

**Independent Test**: Simulate T1 failure and verify T2 state remains unchanged

### Tests First (TDD Red Phase)

- [X] T009 [P] [US1] Write failing tests for T1/T2 independence in tests/unit/progression-independence.test.ts
- [X] T010 [P] [US1] Write failing integration test for tier progression in tests/integration/tier-progression.test.ts

### Implementation (TDD Green Phase)

- [X] T011 [US1] Update analyzeWorkout to use getProgressionKey for progression lookup in src/lib/workout-analysis.ts
- [X] T012 [US1] Update progression calculations to use role+tier keys in src/lib/progression.ts
- [X] T013 [US1] Update useProgression hook to pass tier context in src/hooks/useProgression.ts
- [X] T014 [US1] Verify T009 and T010 tests now pass
- [X] T015 [US1] Run full test suite to ensure no regressions

**Checkpoint**: Core bug fix complete - T1/T2 progressions are independent. MVP deliverable.

---

## Phase 4: User Story 2 - Import Path Weight Detection (Priority: P2)

**Goal**: Auto-detect T1 and T2 weights from imported Hevy routines with user verification

**Independent Test**: Import routines and verify detection accuracy and correction flow

### Tests First (TDD Red Phase)

- [X] T016 [P] [US2] Write failing tests for T1/T2 weight detection in tests/unit/main-lift-weight-detection.test.ts

### Implementation (TDD Green Phase)

- [X] T018 [US2] Implement detectMainLiftWeights function in src/lib/routine-importer.ts (FR-002: day position, FR-006: stage detection)
- [X] T019 [US2] Implement estimation logic for missing tiers (FR-007: T2 = 70% of T1)
- [X] T020 [US2] Create T1/T2 verification UI section in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T021 [US2] Add swap functionality for T1/T2 values in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T022 [US2] Add manual edit functionality for detected weights in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T023 [US2] Add warning indicator for partial data (only T1 or T2 detected) in ImportReviewStep.tsx

**Checkpoint**: Import path complete - users can import routines with T1/T2 verification

---

## Phase 5: User Story 3 - Create Path Weight Setup (Priority: P2)

**Goal**: Collect 8 weights (T1+T2 per lift) with clear labels and T2 auto-suggestion

**Independent Test**: Complete create wizard and verify all 8 weights stored correctly

### Tests First (TDD Red Phase)

- [X] T026 [P] [US3] Write failing tests for WeightInput validation (FR-024) in tests/unit/weight-input.test.tsx
- [X] T027 [P] [US3] Write failing tests for 8-weight form submission in tests/unit/weight-setup-step.test.tsx

### Implementation (TDD Green Phase)

- [X] T028 [P] [US3] Create WeightInput component with inline validation in src/components/common/WeightInput.tsx
- [X] T029 [US3] Update WeightSetupStep to show 8 input fields (T1+T2 per lift) in src/components/SetupWizard/WeightSetupStep.tsx
- [X] T030 [US3] Add labels distinguishing T1 vs T2 (e.g., "T1 Squat (5x3)") in WeightSetupStep.tsx
- [X] T031 [US3] Implement T2 auto-suggestion (70% of T1) when T1 entered in WeightSetupStep.tsx
- [X] T032 [US3] Update form submission to create 8 progression entries in WeightSetupStep.tsx
- [X] T033 [US3] Add real-time validation feedback using WeightInput component in WeightSetupStep.tsx
- [X] T034 [US3] Verify T026 and T027 tests now pass

**Checkpoint**: Create path complete - new users can set up 8 weights with guidance

---

## Phase 6: User Story 4 - Dashboard Status Display (Priority: P3)

**Goal**: Display T1 and T2 status separately for each main lift with current weight, stage, and scheme

**Independent Test**: View dashboard and verify all 8 progression states display correctly

### Implementation

- [X] T035 [US4] Create MainLiftCard component showing T1 and T2 rows in src/components/Dashboard/MainLiftCard.tsx
- [X] T036 [US4] Update Dashboard to display T1/T2 rows per lift in src/components/Dashboard/index.tsx
- [X] T037 [US4] Add stage indicator and rep scheme display to each tier row in MainLiftCard.tsx
- [X] T038 [US4] Highlight current day's focus lifts (e.g., T1 Squat, T2 Bench on A1) in Dashboard

**Checkpoint**: Dashboard complete - users see all 8 progression states clearly

---

## Phase 7: User Story 5 - Tier-Specific Pending Changes (Priority: P3)

**Goal**: Pending changes show tier prefix (T1/T2) and only affect the correct tier when approved

**Independent Test**: Sync workout and verify pending changes show tier-specific labels

### Implementation

- [X] T039 [US5] Update createPendingChangesFromAnalysis to include tier prefix in exercise name in src/lib/progression.ts
- [X] T040 [US5] Update PendingChange type to include progressionKey field in src/types/state.ts
- [X] T041 [US5] Update applyPendingChange to use progressionKey for tier-aware updates in src/lib/apply-changes.ts
- [X] T042 [US5] Verify approving T1 change does NOT affect T2 state in apply-changes logic
- [X] T043 [US5] Update pending changes display to show "T1 Squat" not "Squat" in UI components

**Checkpoint**: Pending changes complete - tier-specific labels prevent confusion

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and documentation

- [X] T044 Run full test suite and verify all 584 tests pass
- [X] T045 Run npm run lint and fix any issues (fixed ProgressionKey type redundancy)
- [X] T046 [P] Update existing progression-related tests that may need new key format (check tests/unit/progression.test.ts, tests/unit/workout-analysis.test.ts)
- [X] T047 [P] Add JSDoc comments to new public functions (getProgressionKey, validateWeight, detectMainLiftWeights, createPendingChange, applyPendingChange)
- [ ] T048 Run quickstart.md verification checklist
- [ ] T049 Manual testing: create new program → verify 8 progression entries in localStorage
- [ ] T050 Manual testing: fail T1 Squat → verify T2 Squat unchanged

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3-7 (User Stories)**: All depend on Phase 2 completion
- **Phase 8 (Polish)**: Depends on all user stories

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|------------|----------------------|
| US1 (P1) | Phase 2 only | None (MVP, do first) |
| US2 (P2) | Phase 2 only | US3, US4, US5 |
| US3 (P2) | Phase 2 only | US2, US4, US5 |
| US4 (P3) | Phase 2 only | US2, US3, US5 |
| US5 (P3) | Phase 2 only | US2, US3, US4 |

### Within Each User Story (TDD Order)

1. Write failing tests (Red)
2. Implement minimum code to pass tests (Green)
3. Refactor if needed
4. Verify tests pass
5. Move to next task

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T001, T002, T003 can all run in parallel
```

**Phase 2 (Foundational)**:
```
T004 and T005 in parallel (tests)
T006 and T007 in parallel (implementation)
```

**User Stories (after Phase 2)**:
```
US1 should complete first (MVP)
Then US2, US3, US4, US5 can all run in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T015)
4. **STOP and VALIDATE**:
   - `npm test` passes
   - T1 failure does not affect T2
5. Deploy if ready - core bug is fixed!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test → **MVP deployed** (core bug fixed)
3. Add US2 + US3 → Test → Import and Create paths complete
4. Add US4 + US5 → Test → Dashboard and Pending Changes complete
5. Polish → Full feature complete

### File Summary

| File | Action | Stories |
|------|--------|---------|
| src/types/state.ts | MODIFY | Setup, US2, US5 |
| src/lib/role-utils.ts | MODIFY | Phase 2 |
| src/lib/workout-analysis.ts | MODIFY | US1 |
| src/lib/progression.ts | MODIFY | US1, US5 |
| src/lib/routine-importer.ts | MODIFY | US2 |
| src/hooks/useProgression.ts | MODIFY | US1 |
| src/hooks/usePendingChanges.ts | MODIFY | US5 |
| src/utils/validation.ts | MODIFY | Phase 2 |
| src/components/common/WeightInput.tsx | NEW | US3 |
| src/components/SetupWizard/WeightSetupStep.tsx | MODIFY | US3 |
| src/components/SetupWizard/ImportReviewStep.tsx | MODIFY | US2 |
| src/components/Dashboard/MainLiftCard.tsx | NEW | US4 |
| src/components/Dashboard/index.tsx | MODIFY | US4 |
| tests/unit/progression-keys.test.ts | NEW | Phase 2 |
| tests/unit/progression-independence.test.ts | NEW | US1 |
| tests/unit/weight-validation.test.ts | NEW | Phase 2 |
| tests/unit/weight-input.test.ts | NEW | US3 |
| tests/unit/weight-setup-step.test.ts | NEW | US3 |
| tests/unit/t1-t2-detection.test.ts | NEW | US2 |
| tests/integration/tier-progression.test.ts | NEW | US1 |
| tests/integration/import-verification-flow.test.ts | NEW | US2 |

---

## Notes

- Constitution requires TDD - write tests FIRST, verify they FAIL, then implement
- No backward compatibility/migration per spec - users must re-setup
- T3 exercises are unaffected - they continue to use exerciseId as key
- Weight validation is inline (real-time) per clarification session
