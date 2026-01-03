# Feature Specification: GZCLP Hevy Progression Tracker

**Feature Branch**: `001-gzclp-hevy-tracker`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "Build a GZCLP workout progression tracker that integrates with Hevy"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Program Setup (Priority: P1)

As a lifter starting GZCLP, I want to configure my program with my exercises and starting weights so the app can track my progression from day one.

**Why this priority**: Without initial setup, no other feature can function. This is the entry point for all users and must work correctly before any progression tracking is possible.

**Independent Test**: Can be fully tested by entering an API key, selecting exercises for each GZCLP slot, and setting starting weights. Delivers a configured program ready for tracking.

**Acceptance Scenarios**:

1. **Given** a new user opens the app, **When** they enter a valid Hevy API key, **Then** the app confirms successful connection and proceeds to exercise setup.
2. **Given** a user is in exercise setup, **When** they select an exercise for the T1 Squat slot, **Then** the exercise is saved and displayed with that assignment.
3. **Given** a user has selected all required exercises, **When** they enter starting weights for each, **Then** the program configuration is saved and the dashboard becomes accessible.
4. **Given** a user enters an invalid API key, **When** they attempt to connect, **Then** the app displays a clear error message explaining how to obtain a valid key.

---

### User Story 2 - Sync Workouts and Calculate Progression (Priority: P2)

As a lifter who completed a workout in Hevy, I want to sync my data and see what progression changes are recommended so I know whether to increase weight or change rep schemes.

**Why this priority**: This is the core value proposition - automated progression calculation. Without this, users would still need to manually track their progress.

**Independent Test**: Can be tested by completing a workout in Hevy with known rep counts, syncing, and verifying the correct progression recommendation appears.

**Acceptance Scenarios**:

1. **Given** a user completed a T1 exercise meeting the rep target (3+ reps on final set of 5x3), **When** they sync, **Then** the app recommends adding the appropriate weight increment.
2. **Given** a user failed a T1 exercise (fewer than 3 reps on final set), **When** they sync, **Then** the app recommends advancing to the next stage (6x2).
3. **Given** a user failed the final T1 stage (10x1), **When** they sync, **Then** the app recommends a deload to 85% of the failed weight.
4. **Given** a user's T3 exercise total reps across all sets is 25 or more, **When** they sync, **Then** the app recommends adding weight for that exercise.
5. **Given** the Hevy service is temporarily unavailable, **When** the user attempts to sync, **Then** the app displays a clear error and retains previously synced data.
6. **Given** the user's weight in Hevy differs from the app's tracked weight for an exercise, **When** they sync, **Then** the app displays a discrepancy alert with options to: (a) accept Hevy's value as current, (b) keep app's value and flag for Hevy update, or (c) enter a custom reconciled value.

---

### User Story 3 - Review and Confirm Progression Changes (Priority: P3)

As a lifter, I want to review all pending progression changes before they are applied so I can verify correctness and maintain control over my program.

**Why this priority**: User confirmation prevents unwanted changes and builds trust. Users should never feel the app is making decisions without their consent.

**Independent Test**: Can be tested by generating progression recommendations and verifying the user can accept, reject, or modify each before application.

**Acceptance Scenarios**:

1. **Given** pending progression changes exist, **When** the user views the dashboard, **Then** all pending changes are clearly visible with current and proposed values.
2. **Given** a user reviews a pending weight increase, **When** they confirm the change, **Then** the new weight is saved and the pending change is cleared.
3. **Given** a user disagrees with a recommendation, **When** they reject the change, **Then** the recommendation is discarded and the current values remain.
4. **Given** a user wants to adjust a recommendation, **When** they modify the proposed value before confirming, **Then** the modified value is applied instead of the calculated one.

---

### User Story 4 - Update Hevy Routines (Priority: P4)

As a lifter who confirmed progression changes, I want those changes pushed to my Hevy routines so my next workout shows the correct weights and rep schemes.

**Why this priority**: Syncing back to Hevy completes the loop. Without this, users would need to manually update Hevy, reducing the app's value.

**Independent Test**: Can be tested by confirming a progression change and verifying the Hevy routine reflects the new weight/rep scheme.

**Acceptance Scenarios**:

1. **Given** a user confirms a weight increase, **When** the app updates Hevy, **Then** the routine shows the new weight for that exercise.
2. **Given** a user confirms a stage change (e.g., 5x3 to 6x2), **When** the app updates Hevy, **Then** the routine shows the new set/rep scheme with appropriate rest timers.
3. **Given** the Hevy update fails, **When** the user is notified, **Then** the pending change remains and the user can retry later.
4. **Given** a user has multiple confirmed changes, **When** they push updates to Hevy, **Then** all changes are applied in a single batch operation.

---

### User Story 5 - Dashboard Overview (Priority: P5)

As a lifter, I want to see all my exercises with their current status at a glance so I can quickly understand my program state before heading to the gym.

**Why this priority**: The dashboard provides ongoing value for daily use, but requires other features to populate it with meaningful data.

**Independent Test**: Can be tested by viewing the dashboard after setup and verifying all configured exercises appear with their current weight, stage, and status.

**Acceptance Scenarios**:

1. **Given** a user has configured their program, **When** they view the dashboard, **Then** all exercises are displayed with current weight, rep scheme, and tier.
2. **Given** pending changes exist, **When** the user views the dashboard, **Then** pending changes are visually distinguished from confirmed values.
3. **Given** a user wants to see their next workout, **When** they access quick workout info, **Then** they see the exercises and weights for their upcoming session.
4. **Given** data was last synced at a specific time, **When** the user views the dashboard, **Then** the last sync timestamp is displayed.

---

### User Story 6 - Data Export and Import (Priority: P6)

As a lifter, I want to export and import my progression data so I can back up my information or transfer it to another device.

**Why this priority**: Data portability is important for user trust but is not required for core functionality.

**Independent Test**: Can be tested by exporting data, clearing local storage, importing the data, and verifying the program state is restored.

**Acceptance Scenarios**:

1. **Given** a user has progression data, **When** they export, **Then** a file is downloaded containing all program configuration and history.
2. **Given** a user has an export file, **When** they import it, **Then** the program state is restored exactly as it was when exported.
3. **Given** a user imports data while existing data is present, **When** they confirm the import, **Then** they are warned about data replacement and must confirm.

---

### Edge Cases

- What happens when a user skips a workout day and syncs later? (System processes all unprocessed workouts in chronological order)
- What happens when a user manually changes weights in Hevy outside the app? (System detects discrepancies and prompts user to reconcile)
- What happens when connection is lost mid-sync? (System tracks last successfully processed workout ID; on retry, resumes from that point rather than re-processing all workouts)
- What happens when a user has no Hevy workouts matching their configured exercises? (System displays helpful message, not error)
- What happens when a user does extra sets beyond the prescribed scheme? (System uses the prescribed sets for progression logic, noting extras)
- What happens when deload weight doesn't round to available plates? (System rounds to nearest 2.5kg increment)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept and validate a Hevy API key for authentication
- **FR-002**: System MUST allow users to assign exercises to GZCLP slots (T1 Squat, T1 Bench, T1 OHP, T1 Deadlift, T2 variants, T3 accessories)
- **FR-002a**: System MUST implement standard 4-day GZCLP rotation: A1 (T1 Squat, T2 Bench), B1 (T1 OHP, T2 Deadlift), A2 (T1 Bench, T2 Squat), B2 (T1 Deadlift, T2 OHP)
- **FR-002b**: System MUST support 3 T3 exercises shared across all workout days (same T3s for A1/B1/A2/B2)
- **FR-003**: System MUST allow users to set initial working weights for each configured exercise
- **FR-004**: System MUST fetch completed workout data from Hevy upon user request
- **FR-005**: System MUST determine success or failure of each exercise based on reps performed vs. required
- **FR-006**: System MUST calculate progression recommendations following exact GZCLP rules:
  - T1: 5x3+ → 6x2+ → 10x1+ → Deload (85%)
  - T2: 3x10 → 3x8 → 3x6 → Deload (85%)
  - T3: 3x15+, advance when total reps >= 25
- **FR-007**: System MUST support user-selectable weight units with correct increments:
  - User selects preferred unit (kg or lbs) during setup
  - Kilograms (default): 5kg lower body, 2.5kg upper body; deloads round to nearest 2.5kg
  - Pounds: 10lb lower body, 5lb upper body; deloads round to nearest 5lb
- **FR-008**: System MUST display pending changes for user review before application
- **FR-009**: System MUST allow users to confirm, reject, or modify pending changes
- **FR-010**: System MUST update Hevy routines with confirmed changes upon user request
- **FR-010a**: System MUST detect existing GZCLP routines in Hevy by naming convention ("GZCLP A1", "GZCLP B1", "GZCLP A2", "GZCLP B2") and update them; if none exist, system MUST create new routines with these names
- **FR-011**: System MUST set appropriate rest timers when updating Hevy (T1: 3-5min, T2: 2-3min, T3: 60-90s)
- **FR-012**: System MUST store all user data locally in the browser
- **FR-013**: System MUST NOT transmit data to any server except Hevy's official service
- **FR-014**: System MUST provide data export functionality
- **FR-015**: System MUST provide data import functionality with confirmation for overwrites
- **FR-016**: System MUST display last sync timestamp on the dashboard
- **FR-017**: System MUST handle Hevy service unavailability gracefully with clear error messages
- **FR-018**: System MUST allow users to delete all their local data

### Key Entities

- **Exercise Configuration**: Represents a user's assignment of an exercise to a GZCLP slot, including tier (T1/T2/T3), current weight, current stage, and exercise identifier
- **Progression State**: Represents the current progression status for an exercise, including stage (rep scheme), weight, and success/failure history
- **Pending Change**: Represents a calculated progression recommendation awaiting user confirmation, including current value, proposed value, and change reason
- **Workout Record**: Represents a synced workout from Hevy, including date, exercises performed, sets, reps, and weights used
- **Program Configuration**: Represents the user's overall GZCLP setup, including all exercise assignments, API credentials, and preferences

## Clarifications

### Session 2026-01-02

- Q: How are workouts structured across training days? → A: Standard 4-day rotation (A1/B1/A2/B2)
- Q: How many T3 exercises per workout? → A: 3 T3 exercises per workout (standard GZCLP)
- Q: How does the app manage Hevy routines? → A: Hybrid - detect existing GZCLP routines and update them; create new if none exist
- Q: Should the app support pounds (lbs) in addition to kg? → A: Both kg and lbs with user preference (kg default; lbs increments: 10lb/5lb)
- Q: Are T3 exercises the same across all days or configurable per day? → A: Same 3 T3 exercises for all workout days

## Assumptions

- Users have a valid Hevy account with API access
- Users understand the GZCLP program structure (T1/T2/T3 tiers)
- Users will use Hevy to log their actual workouts; this app only reads and updates routines
- Weight plates are available in 2.5kg and 5kg increments
- Users have a modern web browser with localStorage support
- Hevy API remains stable and accessible

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete initial setup (API connection + exercise configuration) in 15 or fewer user interactions (clicks/taps/form submissions)
- **SC-002**: Sync operation completes and displays progression recommendations within 10 seconds for typical workout history (≤100 workouts, mocked API latency ≤200ms in tests)
- **SC-003**: 100% of progression calculations match manual GZCLP protocol verification
- **SC-004**: Users can confirm pending changes and update Hevy routines within 3 taps/clicks per exercise
- **SC-005**: Data export and import complete successfully with 100% data fidelity
- **SC-006**: Application remains usable (view dashboard, see cached data) when Hevy is unavailable
- **SC-007**: [Post-launch] 95% of users can complete the setup wizard without external documentation or support. Pre-launch proxy: Setup wizard includes inline help text for all form fields and clear error messages
- **SC-008**: Zero user data is transmitted to servers other than Hevy's official endpoints
