# Feature Specification: Routine Selection Wizard

**Feature Branch**: `002-routine-selection-wizard`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "When going through the setup wizard, after providing my API key, ask me if I want to create new A1/B1/A2/B2 routines or use existing ones. If using existing ones, we need to use the workouts from those routines for T1/T2/T3 exercises."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New GZCLP Routines (Priority: P1)

As a new GZCLP user, I want to create fresh A1/B1/A2/B2 routines after connecting my Hevy account so I can start tracking my program from scratch.

**Why this priority**: This is the most common path for new users who don't have existing GZCLP routines. It represents the current default behavior and must continue working.

**Independent Test**: Can be fully tested by entering a valid API key, selecting "Create New Routines", assigning exercises manually, and completing setup. Delivers a configured program with new routines.

**Acceptance Scenarios**:

1. **Given** a user has entered a valid API key, **When** they reach the routine selection step, **Then** they see options to "Create New Routines" or "Use Existing Routines".
2. **Given** a user selects "Create New Routines", **When** they proceed, **Then** they continue to the exercise selection step where they manually assign exercises to T1/T2/T3 slots.
3. **Given** a user has no routines in Hevy at all, **When** they view the routine selection step, **Then** only "Create New Routines" is available (existing option is disabled with explanation).

---

### User Story 2 - Use Existing Routines with Auto-Detection (Priority: P1)

As an existing GZCLP user with routines following standard naming, I want the app to automatically detect my A1/B1/A2/B2 routines so I can quickly link them without manual selection.

**Why this priority**: Provides the fastest path for users who followed the standard GZCLP naming convention.

**Independent Test**: Can be fully tested by entering a valid API key with routines named "GZCLP A1", etc., verifying they are auto-detected and pre-selected.

**Acceptance Scenarios**:

1. **Given** a user has routines named "GZCLP A1", "GZCLP B1", "GZCLP A2", "GZCLP B2" in Hevy, **When** they select "Use Existing Routines", **Then** these routines are automatically detected and pre-selected for each GZCLP day slot.
2. **Given** routines are auto-detected, **When** the user views the routine assignment screen, **Then** they see each detected routine pre-assigned to its corresponding day (A1, B1, A2, B2) with an option to change.
3. **Given** only some routines match the naming convention (e.g., "GZCLP A1" exists but not others), **When** auto-detection runs, **Then** matching routines are pre-selected and non-matching slots show a dropdown to manually select from available routines.

---

### User Story 3 - Manually Select Existing Routines (Priority: P1)

As a GZCLP user who started the program before using this app (with custom routine names), I want to manually select which of my Hevy routines correspond to A1/B1/A2/B2 so I can link my existing workout history.

**Why this priority**: Critical for users who have been doing GZCLP but named their routines differently (e.g., "Monday Squat", "Wednesday OHP", or "Day 1", "Day 2").

**Independent Test**: Can be fully tested by entering a valid API key with non-standard routine names, selecting "Use Existing Routines", manually assigning each routine to A1/B1/A2/B2, and completing setup.

**Acceptance Scenarios**:

1. **Given** a user has routines in Hevy that don't match the standard naming convention, **When** they select "Use Existing Routines", **Then** they see a routine assignment screen showing all their Hevy routines in a list.
2. **Given** a user is on the routine assignment screen, **When** they view each GZCLP day slot (A1, B1, A2, B2), **Then** they see a dropdown/selector populated with all their Hevy routines to choose from.
3. **Given** a user selects a routine for the A1 slot, **When** they view other day slots, **Then** that routine is still available for selection (same routine can be used for multiple days if desired, though not typical).
4. **Given** a user has assigned routines to all four day slots, **When** they proceed, **Then** the app extracts exercises from those routines for T1/T2/T3 mapping.

---

### User Story 4 - Review and Adjust Auto-Detected Exercises (Priority: P2)

As a user importing existing routines, I want to review and optionally adjust the auto-detected exercise mappings before finalizing setup so I can correct any misidentified exercises.

**Why this priority**: Auto-detection of T1/T2/T3 from exercise position may not be perfect; users need the ability to correct mistakes before committing.

**Independent Test**: Can be tested by importing routines with exercises, viewing the auto-detection summary, modifying an incorrect mapping, and verifying the change persists through setup completion.

**Acceptance Scenarios**:

1. **Given** exercises have been extracted from selected routines, **When** the user views the exercise mapping screen, **Then** they see exercises auto-assigned to T1/T2/T3 slots based on position and rep schemes.
2. **Given** the auto-mapping incorrectly assigned an exercise, **When** the user reassigns the slot to a different exercise, **Then** the change is saved and reflected in subsequent steps.
3. **Given** a selected routine has fewer exercises than expected (e.g., no T3 exercises), **When** exercises are extracted, **Then** the missing slots are left empty for the user to fill manually.
4. **Given** exercises are extracted from routines, **When** the user proceeds to the weights step, **Then** the weights are pre-filled from the routine exercise configurations.

---

### Edge Cases

- What happens when only some GZCLP day slots have routines assigned? (System allows partial assignment; unassigned days will need exercises configured manually)
- What happens when a selected routine has non-standard exercise counts? (System uses best-effort mapping based on exercise position and displays warnings for unexpected configurations)
- What happens when an exercise in a routine doesn't match any exercise template in the user's Hevy library? (System displays the exercise name but marks the slot as needing manual confirmation)
- What happens when routine weights are in different units than user preference? (System converts weights to user's selected unit during import)
- What happens when the same routine is selected for multiple days? (System allows this but shows a warning that this is unusual)
- What happens when user has many routines (50+)? (System provides search/filter capability in the routine selector)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a routine selection step after API key validation and before exercise assignment
- **FR-002**: System MUST fetch all user routines from Hevy when entering the routine selection step
- **FR-003**: System MUST display two options: "Create New Routines" and "Use Existing Routines"
- **FR-004**: System MUST disable "Use Existing Routines" option when user has no routines in Hevy, with explanatory text
- **FR-005**: System MUST attempt auto-detection of GZCLP routines by searching for routines named "GZCLP A1", "GZCLP B1", "GZCLP A2", "GZCLP B2"
- **FR-006**: System MUST pre-select auto-detected routines in their corresponding day slots when matches are found
- **FR-007**: System MUST display a routine assignment screen with four slots (A1, B1, A2, B2), each with a dropdown/selector showing all available Hevy routines
- **FR-008**: System MUST allow users to manually select any routine from their Hevy account for each GZCLP day slot
- **FR-009**: System MUST show routine details (name, exercise count) in the selector to help users identify the correct routine
- **FR-010**: When routines are selected, system MUST extract exercises and auto-map to T1/T2/T3 slots based on:
  - Exercise position within routine (1st exercise = T1, 2nd = T2, remaining = T3)
  - Rep scheme hints from set configuration (5x3 pattern = T1, 3x10 pattern = T2, 3x15 pattern = T3)
- **FR-011**: System MUST pre-populate weights from selected routine exercise configurations
- **FR-012**: System MUST allow users to modify any auto-populated exercise assignments before finalizing
- **FR-013**: System MUST display a mapping summary showing which exercises were assigned to which slots
- **FR-014**: System MUST store selected routine IDs to enable direct updates without creating duplicates
- **FR-015**: System MUST provide search or filter functionality when user has more than 10 routines

### Key Entities

- **Available Routine**: A Hevy routine from the user's account, containing routine ID, title, exercise count, and exercise list
- **Routine Assignment**: User's selection of which Hevy routine corresponds to each GZCLP day (A1, B1, A2, B2)
- **Exercise Mapping**: Association between a Hevy exercise template and a GZCLP slot (T1/T2/T3), including source (auto-detected vs. manual)
- **Import Summary**: Summary of the routine import results, showing mapped exercises, warnings, and any missing slots

## Assumptions

- Exercise order in routines generally follows GZCLP convention: T1 first, T2 second, T3 exercises follow (but may vary)
- Users with existing routines want to preserve their exercise selections and weights
- The Hevy API provides sufficient exercise details in routine responses for auto-mapping
- Standard GZCLP has 2 main lifts (T1+T2) and 3 T3 accessories per workout day
- Users may have named their routines anything (no dependency on naming convention)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users with existing routines (any naming) can complete setup in 50% fewer interactions compared to manual configuration
- **SC-002**: Auto-detection correctly identifies routines following standard naming convention 100% of the time
- **SC-003**: 100% of users can manually select routines regardless of naming convention
- **SC-004**: 100% of users can modify auto-detected exercise mappings before finalizing
- **SC-005**: Users can complete routine selection (including manual assignment) in under 60 seconds
- **SC-006**: Users importing existing routines see their current weights accurately reflected (within unit conversion tolerance)
