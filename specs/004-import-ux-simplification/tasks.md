# Tasks: Import UX Simplification

**Input**: Design documents from `/specs/004-import-ux-simplification/`
**Prerequisites**: plan.md, spec.md

**Tests**: Tests included per TDD workflow requirement from CLAUDE.md.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- TypeScript 5.9, React 18.3, Vite 5.4, Tailwind CSS 4.1

---

## Phase 1: Setup

**Purpose**: Establish new type system and core utilities without breaking existing code

- [X] T001 Add ExerciseRole type and MAIN_LIFT_ROLES/MULTI_ASSIGN_ROLES constants in src/types/state.ts
- [X] T002 [P] Add EXERCISE_ROLES array and ROLE_DISPLAY metadata in src/lib/constants.ts
- [X] T003 [P] Create role-utils.ts with getTierForDay(), getExercisesForDay(), isMainLiftRole() in src/lib/role-utils.ts
- [X] T004 [P] Create unit tests for role-utils in tests/unit/role-utils.test.ts

**Checkpoint**: New types and utilities ready - verify tests pass before proceeding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components that ALL user stories depend on

**CRITICAL**: User story implementation cannot begin until this phase is complete

- [X] T005 Create RoleDropdown component with value, onChange, disabled, excludeRoles props in src/components/common/RoleDropdown.tsx
- [X] T006 [P] Create unit tests for RoleDropdown in tests/unit/role-dropdown.test.tsx
- [X] T007 Add storage migration logic to clear old data on schema version mismatch in src/App.tsx
- [X] T008 Update CURRENT_STATE_VERSION to '2.0.0' in src/lib/constants.ts

**Checkpoint**: Foundation ready - RoleDropdown available, migration logic in place

---

## Phase 3: User Story 1 - Assign Roles During Import (Priority: P1) MVP

**Goal**: Replace 3-dropdown import system with single Role dropdown per exercise

**Independent Test**: Import a Hevy routine, verify each exercise shows single Role dropdown with 7 options, main lift exclusivity enforced, weight input only for main lifts

### Tests for User Story 1

> **NOTE**: Write tests FIRST, ensure they FAIL before implementation

- [X] T009 [P] [US1] Integration test for role assignment flow in tests/integration/import-role-assignment.test.tsx
- [X] T010 [P] [US1] Unit test for main lift exclusivity validation in tests/unit/import-review-step.test.tsx

### Implementation for User Story 1

- [X] T011 [US1] Update ImportedExercise type: replace slot with role, remove userSlot in src/types/state.ts
- [X] T012 [US1] Remove Category dropdown, add RoleDropdown in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T013 [US1] Add main lift exclusivity tracking (assignedMainLifts state) in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T014 [US1] Add conditional weight input (only for main lift roles) in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T015 [US1] Add validation: block Continue until all exercises have roles in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T016 [US1] Add Hevy API availability check (block import if unavailable) and stage auto-detection from workout history (query Hevy for each main lift, detect stage from set/rep patterns, default to Stage 1 if no history) in src/components/SetupWizard/ImportReviewStep.tsx
- [X] T017 [US1] Remove exerciseCategories state, remove onSaveClassifications callback in src/components/SetupWizard/index.tsx (VERIFIED: Already clean - no old category state exists)
- [X] T018 [US1] Update exercise save logic to use role field in src/components/SetupWizard/index.tsx

**Checkpoint**: Import flow works with single Role dropdown, main lift exclusivity enforced, tests pass

---

## Phase 4: User Story 2 - View Simplified Workout Structure (Priority: P2)

**Goal**: Display exercises grouped by role with tier derived from role + current day

**Independent Test**: View any workout day, verify Warmup section at top (collapsible), T1/T2 main lifts with correct tier labels, T3 section, Cooldown at bottom (collapsible)

### Tests for User Story 2

- [X] T019 [P] [US2] Integration test for dashboard role-based grouping (verify Warmup/T1/T2/T3/Cooldown sections render correctly AND Supplemental section does NOT exist) in tests/integration/dashboard-role-grouping.test.tsx
- [X] T020 [P] [US2] Unit test for tier derivation per day type in tests/unit/role-utils.test.ts (extend existing)

### Implementation for User Story 2

- [X] T021 [US2] Replace exercisesByCategory with getExercisesForDay() grouping in src/components/Dashboard/index.tsx
- [X] T022 [US2] Remove SupplementalBadge import and usage in src/components/Dashboard/index.tsx
- [X] T023 [US2] Remove Supplemental section rendering in src/components/Dashboard/index.tsx
- [X] T024 [US2] Update main lifts section to show derived T1/T2 labels based on current day in src/components/Dashboard/index.tsx
- [X] T025 [US2] Update NextWorkout to use getTierForDay() for T1/T2 display in src/components/Dashboard/NextWorkout.tsx
- [X] T026 [US2] Configure Warmup/Cooldown CollapsibleSections with defaultOpen={false} and verify expand/collapse behavior in src/components/Dashboard/index.tsx

**Checkpoint**: Dashboard displays exercises correctly for all day types (A1, B1, A2, B2), tests pass

---

## Phase 5: User Story 3 - Manage Exercise Roles After Import (Priority: P3)

**Goal**: Allow role changes in Settings with conflict detection and swap option

**Independent Test**: Navigate to Settings, change an exercise role, verify persistence and Dashboard updates; test main lift conflict shows swap option

### Tests for User Story 3

- [X] T027 [P] [US3] Unit test for role change with conflict detection in tests/unit/exercise-manager.test.tsx
- [X] T028 [P] [US3] Unit test for role swap functionality in tests/unit/exercise-manager.test.tsx

### Implementation for User Story 3

- [X] T029 [US3] Replace CategoryDropdown with RoleDropdown in src/components/Settings/ExerciseManager.tsx
- [X] T030 [US3] Add main lift conflict detection logic in src/components/Settings/ExerciseManager.tsx
- [X] T031 [US3] Add role swap confirmation modal/dialog in src/components/Settings/ExerciseManager.tsx
- [X] T032 [US3] Implement role swap logic (update both exercises) in src/components/Settings/ExerciseManager.tsx
- [X] T033 [US3] Update section title to "Exercise Roles" in src/components/Settings/index.tsx

**Checkpoint**: Role management works with conflict handling, tests pass

---

## Phase 6: Cleanup & Deletion

**Purpose**: Remove obsolete files and code after all user stories complete

### Delete Obsolete Source Files

- [X] T034 [P] Delete src/types/classification.ts
- [X] T035 [P] Delete src/lib/classification-store.ts
- [X] T036 [P] Delete src/lib/sync-queue.ts
- [X] T037 [P] Delete src/hooks/useExerciseClassifications.ts
- [X] T038 [P] Delete src/components/common/CategoryDropdown.tsx
- [X] T039 [P] Delete src/components/common/SupplementalBadge.tsx
- [X] T040 [P] Delete src/components/SetupWizard/ConflictResolutionModal.tsx

### Delete Obsolete Test Files

- [X] T041 [P] Delete tests/unit/classification-store.test.ts
- [X] T042 [P] Delete tests/unit/sync-queue.test.ts
- [X] T043 [P] Delete tests/unit/useExerciseClassifications.test.ts
- [X] T044 [P] Delete tests/unit/supplemental-badge.test.tsx
- [X] T045 [P] Delete tests/integration/conflict-resolution.test.tsx
- [X] T046 [P] Delete tests/integration/dashboard-category-grouping.test.tsx
- [X] T047 [P] Delete tests/integration/exercise-classification-flow.test.tsx

### Remove Obsolete Code from Remaining Files

- [X] T048 Remove GZCLPSlot type and old ExerciseConfig fields (slot, category, tier, muscleGroup) from src/types/state.ts
- [X] T049 Remove T1_SLOTS, T2_SLOTS, T3_SLOTS, ALL_SLOTS, SLOT_NAMES, SLOT_MAPPING, SLOT_DEFAULT_MUSCLE_GROUP from src/lib/constants.ts (COMPLETED: Slot-to-role migration complete)
- [X] T050 Remove sync queue processing from src/App.tsx
- [X] T051 Update progression.ts to use role-based lookups instead of slot-based in src/lib/progression.ts (VERIFIED: Already role-based)
- [X] T052 Remove ExerciseCategory import from src/types/state.ts

**Checkpoint**: All obsolete code removed, no dead imports

---

## Phase 7: Polish & Validation

**Purpose**: Final verification and cleanup

- [X] T053 Run full test suite: npm test (477 tests pass, 6 todo)
- [X] T054 Run linter: npm run lint (pre-existing non-null assertion warnings in tests)
- [X] T055 Run build: npm run build (passes)
- [X] T056 Manual test: Import flow with single Role dropdown (FIXED: deduplication in routine-importer.ts)
- [X] T057 Manual test: Dashboard shows correct T1/T2 for A1, B1, A2, B2 days (FIXED: requires clear localStorage after fix)
- [ ] T058 Manual test: Settings role change with conflict swap
- [ ] T059 Manual test: Old data cleared on upgrade with re-setup prompt

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 - can start after foundation
- **User Story 2 (Phase 4)**: Depends on Phase 2, can run parallel with US1 (different files)
- **User Story 3 (Phase 5)**: Depends on Phase 2, can run parallel with US1/US2 (different files)
- **Cleanup (Phase 6)**: Depends on ALL user stories complete
- **Polish (Phase 7)**: Depends on Phase 6

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational - no cross-story dependencies
- **User Story 2 (P2)**: Depends only on Foundational - uses role-utils from Phase 1
- **User Story 3 (P3)**: Depends only on Foundational - uses RoleDropdown from Phase 2

### Within Each Phase

- Tests MUST be written and FAIL before implementation
- Type changes before component changes
- Core logic before UI integration
- Commit after each task or logical group

### Parallel Opportunities

**Phase 1** (all parallelizable):
- T002, T003, T004 can run in parallel after T001

**Phase 2** (partial parallel):
- T005 and T006 can run in parallel
- T007 and T008 are independent

**User Stories** (full parallel after Phase 2):
- US1 (T009-T018), US2 (T019-T026), US3 (T027-T033) can all run in parallel
- Different files, no dependencies between stories

**Phase 6** (all parallelizable):
- All delete tasks (T034-T047) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Integration test for role assignment flow in tests/integration/import-role-assignment.test.tsx"
Task: "Unit test for main lift exclusivity validation in tests/unit/import-review-step.test.tsx"
```

---

## Parallel Example: All User Stories (after Phase 2)

```bash
# Developer A: User Story 1 (Import Flow)
Tasks: T009-T018 in src/components/SetupWizard/

# Developer B: User Story 2 (Dashboard)
Tasks: T019-T026 in src/components/Dashboard/

# Developer C: User Story 3 (Settings)
Tasks: T027-T033 in src/components/Settings/
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008)
3. Complete Phase 3: User Story 1 (T009-T018)
4. **STOP and VALIDATE**: Test import flow independently
5. Skip Phases 4-5 for MVP if needed

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test import → Deploy/Demo (MVP!)
3. Add User Story 2 → Test dashboard → Deploy/Demo
4. Add User Story 3 → Test settings → Deploy/Demo
5. Cleanup + Polish → Final release

### Full Implementation

1. Complete all phases sequentially
2. Or parallelize user stories with multiple developers
3. Cleanup only after all user stories verified

---

## Notes

- Total: 59 tasks
- Phase 1: 4 tasks (Setup)
- Phase 2: 4 tasks (Foundational)
- Phase 3/US1: 10 tasks (Import Flow)
- Phase 4/US2: 8 tasks (Dashboard)
- Phase 5/US3: 7 tasks (Settings)
- Phase 6: 19 tasks (Cleanup)
- Phase 7: 7 tasks (Validation)
- [P] = parallelizable
- [US1/US2/US3] = user story mapping
- Commit after each task
- Stop at any checkpoint to validate independently
