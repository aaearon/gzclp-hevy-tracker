# Feature Specification: Routine Selection Wizard

**Feature Branch**: `002-routine-selection-wizard`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "When going through the setup wizard, after providing my API key, ask me if I want to create new A1/B1/A2/B2 routines or use existing ones. If using existing ones, we need to use the workouts from those routines for T1/T2/T3 exercises."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New GZCLP Routines (Priority: P1)

As a new GZCLP user, I want to create fresh A1/B1/A2/B2 routines after connecting my Hevy account so I can start tracking my program from scratch.

**Why this priority**: This is the default path for new users who don't have existing GZCLP routines. It represents the current behavior and must continue working.

**Independent Test**: Can be fully tested by entering a valid API key, selecting "Create New Routines", assigning exercises manually, and completing setup. Delivers a configured program with new routines.

**Acceptance Scenarios**:

1. **Given** a user has entered a valid API key, **When** they reach the routine selection step, **Then** they see options to "Create New Routines" or "Use Existing Routines".
2. **Given** a user selects "Create New Routines", **When** they proceed, **Then** they continue to the exercise selection step where they manually assign exercises to T1/T2/T3 slots.
3. **Given** a user has no routines in Hevy at all, **When** they view the routine selection step, **Then** only "Create New Routines" is available (existing option is disabled with explanation).

---

### User Story 2 - Import Existing Routines (Priority: P1)

As a GZCLP user who started the program before using this app, I want to select which of my Hevy routines correspond to A1/B1/A2/B2 so I can link my existing workout configuration.

**Why this priority**: Critical for users who have been doing GZCLP and want to continue tracking with this app without re-entering their setup.

**Independent Test**: Can be fully tested by entering a valid API key, selecting "Use Existing Routines", assigning each routine to A1/B1/A2/B2, and completing setup.

**Acceptance Scenarios**:

1. **Given** a user selects "Use Existing Routines", **When** they view the routine assignment screen, **Then** they see four slots (A1, B1, A2, B2) each with a dropdown showing all their Hevy routines.
2. **Given** a user is assigning routines, **When** they select a routine for the A1 slot, **Then** the dropdown shows the routine name and exercise count to help identification.
3. **Given** a user has assigned routines to all four day slots, **When** they proceed, **Then** the app extracts exercises from those routines and maps them to GZCLP slots.
4. **Given** a user only wants to import some days, **When** they leave a slot unassigned, **Then** the system allows proceeding with partial assignment (those days will need manual exercise configuration).

---

### User Story 3 - Review Extracted Exercises and Stages (Priority: P1)

As a user importing existing routines, I want to review the extracted exercises and detected progression stages before finalizing so I can verify the import is correct.

**Why this priority**: Users need to confirm that their exercises were correctly identified and their progression state (5x3 vs 6x2 vs 10x1) was accurately detected.

**Independent Test**: Can be tested by importing a routine where T1 Squat is configured as 6x2 at 100kg, verifying the app detects "Stage 2" and displays it for confirmation.

**Acceptance Scenarios**:

1. **Given** exercises have been extracted from selected routines, **When** the user views the import summary, **Then** they see each exercise with its slot, weight, and detected stage (e.g., "T1 Squat: Stage 2 (6x2+) at 100kg").
2. **Given** a detected stage is incorrect, **When** the user selects a different stage, **Then** the change is saved for that exercise.
3. **Given** a routine has a non-standard rep scheme, **When** the system cannot detect the stage, **Then** it prompts the user to manually select Stage 1, 2, or 3.
4. **Given** exercises are extracted, **When** the user wants to change an exercise assignment, **Then** they can modify which exercise maps to which slot.

---

### User Story 4 - Set Next Workout in Rotation (Priority: P1)

As a user importing existing routines, I want to specify which GZCLP day I should do next so the app correctly tracks my workout rotation.

**Why this priority**: GZCLP follows a strict A1→B1→A2→B2 rotation. The user knows where they are in this cycle.

**Independent Test**: Can be tested by importing routines, selecting "B2" as the next workout, and verifying the dashboard shows B2 as the upcoming session.

**Acceptance Scenarios**:

1. **Given** a user has imported existing routines, **When** they reach the rotation setup step, **Then** they see "Which workout should you do next?" with options A1, B1, A2, B2.
2. **Given** the user selects "A2" as their next workout, **When** they complete setup, **Then** the dashboard shows A2 as the next scheduled workout.

---

### Edge Cases

- What happens when only some GZCLP day slots have routines assigned? (System allows partial assignment; unassigned days will need exercises configured manually)
- What happens when a selected routine has non-standard exercise counts? (System extracts what's available; user can fill gaps manually)
- What happens when routine weights are in different units than user preference? (System converts weights to user's selected unit during import)
- What happens when the same routine is selected for multiple days? (System allows this but shows a warning that this is unusual)
- What happens when user has many routines (50+)? (System provides search/filter capability in the routine selector)
- What happens when the rep scheme doesn't match any standard GZCLP stage? (System prompts user to select stage manually)
- What happens when routine contains warmup sets? (System filters to 'normal' set types when detecting stage)
- What happens when T3 exercises differ across routines? (System extracts T3s from A1 routine as canonical; user can modify)

## Requirements *(mandatory)*

### Functional Requirements

**Routine Selection & Assignment**

- **FR-001**: System MUST add a routine selection step after API key validation and before exercise assignment
- **FR-002**: System MUST fetch all user routines from Hevy when entering the routine selection step
- **FR-003**: System MUST display two options: "Create New Routines" and "Use Existing Routines"
- **FR-004**: System MUST disable "Use Existing Routines" option when user has no routines in Hevy, with explanatory text
- **FR-005**: System MUST display a routine assignment screen with four slots (A1, B1, A2, B2), each with a dropdown showing all available Hevy routines
- **FR-006**: System MUST show routine details (name, exercise count) in the selector to help users identify the correct routine
- **FR-007**: System MUST provide search or filter functionality when user has more than 10 routines

**Exercise Extraction & Slot Mapping**

- **FR-008**: System MUST map imported exercises to specific GZCLP slots based on the day assignment and exercise position:
  - A1: position 1 → t1_squat, position 2 → t2_bench
  - B1: position 1 → t1_ohp, position 2 → t2_deadlift
  - A2: position 1 → t1_bench, position 2 → t2_squat
  - B2: position 1 → t1_deadlift, position 2 → t2_ohp
  - Positions 3+ → T3 exercises (t3_1, t3_2, t3_3)
- **FR-009**: System MUST extract T3 exercises from the A1 routine as the canonical T3 configuration (shared across all days)
- **FR-010**: System MUST extract the working weight for each exercise from the routine's normal (non-warmup) sets
- **FR-011**: System MUST treat extracted routine weights as the authoritative current working weights for each slot
- **FR-012**: System MUST allow users to modify any exercise slot assignments or weights before finalizing
- **FR-013**: System MUST store selected routine IDs to enable direct updates without creating duplicates

**Progression State Detection**

- **FR-014**: System MUST filter to 'normal' set types when detecting progression stage (exclude warmup, dropset, failure sets)
- **FR-015**: System MUST detect the current progression stage for each T1/T2 exercise based on the normal sets in the routine:
  - T1: 5 sets × 3 reps = Stage 1, 6 sets × 2 reps = Stage 2, 10 sets × 1 rep = Stage 3
  - T2: 3 sets × 10 reps = Stage 1, 3 sets × 8 reps = Stage 2, 3 sets × 6 reps = Stage 3
  - T3: Always Stage 1 (3 sets × 15+ reps)
- **FR-016**: System MUST display detected stages for user confirmation (e.g., "Squat: Stage 2 (6x2+) at 100kg")
- **FR-017**: System MUST allow users to manually override detected stage if incorrect
- **FR-018**: System MUST prompt for manual stage selection when a routine's rep scheme doesn't match standard GZCLP patterns

**Workout Rotation**

- **FR-019**: System MUST ask users which GZCLP day (A1, B1, A2, B2) they should perform next
- **FR-020**: System MUST pre-select A1 as the default; user MUST explicitly confirm selection before proceeding

### Key Entities

- **Available Routine**: A Hevy routine from the user's account, containing routine ID, title, exercise count, and exercise list with set/rep configurations
- **Routine Assignment**: User's explicit selection of which Hevy routine corresponds to each GZCLP day (A1, B1, A2, B2)
- **Slot Mapping**: Fixed association between day + position and GZCLP slot (e.g., A1 position 1 = t1_squat)
- **Progression State**: The current stage for each exercise (Stage 1/2/3), detected from routine set/rep configuration or manually specified
- **Workout Rotation Position**: Which GZCLP day (A1, B1, A2, B2) the user should perform next

## Assumptions

- Users know which of their Hevy routines correspond to which GZCLP day (A1/B1/A2/B2)
- Exercise order in routines follows GZCLP convention: T1 first, T2 second, T3 exercises follow
- Users with existing routines want to preserve their exercise selections, weights, and progression state
- The Hevy API provides set type information to distinguish warmup from working sets
- Standard GZCLP has 2 main lifts (T1+T2) and 3 T3 accessories per workout day
- Routine weights in Hevy represent the user's current working weights
- Each T1/T2 slot has independent progression state (t1_squat and t2_squat are tracked separately)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Imported routine weights match Hevy routine values exactly (within unit conversion rounding to nearest 0.5kg/1lb)
- **SC-002**: Progression stage detection correctly identifies all standard GZCLP rep schemes (5x3, 6x2, 10x1, 3x10, 3x8, 3x6, 3x15) from normal sets 100% of the time (verified via unit tests)
- **SC-003**: Users can complete routine import (assign 4 routines, confirm exercises, set next workout) in under 2 minutes
