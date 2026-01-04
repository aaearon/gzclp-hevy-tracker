# Feature Specification: Separate T1 and T2 Progression Tracking

**Feature Branch**: `005-t1-t2-progression`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Separate T1 and T2 Progression Tracking - Each main lift needs independent progression tracking for T1 (heavy) and T2 (lighter) variants"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Independent Progression Tracking (Priority: P1)

As a user completing GZCLP workouts, when I fail my T1 Squat and it moves from stage 0 (5x3) to stage 1 (6x2), my T2 Squat continues progressing normally at its own weight and stage. These are completely independent progressions that never affect each other.

**Why this priority**: This is the core bug fix. Without independent tracking, the entire GZCLP progression model is broken - users cannot follow the program correctly.

**Independent Test**: Can be tested by simulating a T1 failure and verifying T2 state remains unchanged, delivering correct GZCLP program behavior.

**Acceptance Scenarios**:

1. **Given** T1 Squat at 100kg stage 0 and T2 Squat at 70kg stage 0, **When** T1 Squat fails and advances to stage 1, **Then** T2 Squat remains at 70kg stage 0 unchanged
2. **Given** T1 Bench at 60kg stage 2 and T2 Bench at 40kg stage 1, **When** T2 Bench fails and advances to stage 2, **Then** T1 Bench remains at 60kg stage 2 unchanged
3. **Given** T1 Deadlift at 120kg and T2 Deadlift at 80kg, **When** T1 Deadlift successfully completes with AMRAP of 8, **Then** T1 weight increases to 125kg while T2 Deadlift remains at 80kg

---

### User Story 2 - Import Path Weight Detection (Priority: P2)

As a user importing my existing Hevy routines, the app auto-detects T1 and T2 weights based on exercise position and day mapping, then presents them for my verification before finalizing. I can see where each weight was detected from and correct any mistakes.

**Why this priority**: Most users will onboard via import. Accurate T1/T2 weight detection with verification ensures correct setup without manual data entry for all 8 weights.

**Independent Test**: Can be tested by importing routines and verifying detection accuracy and correction flow.

**Acceptance Scenarios**:

1. **Given** imported routines with Squat on Day A1 position 1 at 100kg and Day A2 position 2 at 70kg, **When** import processes, **Then** system shows "T1 Squat: 100kg (from Day A1, position 1)" and "T2 Squat: 70kg (from Day A2, position 2)"
2. **Given** detected T1 Bench 60kg and T2 Bench 45kg where detection was swapped, **When** user clicks swap, **Then** values exchange to T1 Bench 45kg and T2 Bench 60kg
3. **Given** only T1 data available for OHP at 40kg, **When** import processes, **Then** system pre-fills both T1 and T2 with 40kg and flags for user review with a warning indicator
4. **Given** verification screen displaying detected weights, **When** user manually edits T2 Squat from 70kg to 75kg, **Then** value updates and is saved when user confirms

---

### User Story 3 - Create Path Weight Setup (Priority: P2)

As a new user setting up GZCLP via the "create new routines" path, I enter separate starting weights for each lift's T1 and T2 variants with clear labels distinguishing them.

**Why this priority**: Alternative onboarding path needed for users without existing routines. Must collect all 8 weights accurately.

**Independent Test**: Can be tested by completing the create wizard and verifying all 8 weights are stored correctly.

**Acceptance Scenarios**:

1. **Given** user on weight setup screen, **When** form loads, **Then** 8 input fields display with labels "T1 Squat (5x3)", "T2 Squat (3x10)", etc.
2. **Given** user enters T1 Squat at 100kg, **When** T1 value is entered, **Then** T2 Squat field suggests 70kg (70% of T1)
3. **Given** user has entered all 8 weights, **When** user confirms setup, **Then** system stores independent progression state for each T1/T2 variant

---

### User Story 4 - Dashboard Status Display (Priority: P3)

As a user checking my progress, I see both my T1 and T2 status for each main lift separately - their current weights, stages, and rep schemes - so I know exactly what to load for each workout.

**Why this priority**: Users need visibility into their progression state. Critical for usability but depends on P1 being complete first.

**Independent Test**: Can be tested by viewing dashboard and verifying all 8 progression states display correctly.

**Acceptance Scenarios**:

1. **Given** dashboard is displayed, **When** user views main lifts section, **Then** each lift shows T1 row (weight, stage indicator, rep scheme) and T2 row (weight, stage indicator, rep scheme) separately
2. **Given** T1 Squat at 100kg stage 1 (6x2) and T2 Squat at 70kg stage 0 (3x10), **When** dashboard displays, **Then** Squat section shows "T1: 100kg - 6x2" and "T2: 70kg - 3x10"
3. **Given** it is Day A1, **When** dashboard displays, **Then** system highlights T1 Squat and T2 Bench as the current day's focus lifts

---

### User Story 5 - Tier-Specific Pending Changes (Priority: P3)

As a user after syncing a workout, I see pending changes specific to the tier I trained - showing "T1 Squat" or "T2 Squat" rather than just "Squat".

**Why this priority**: Clarity in pending changes prevents confusion and accidental approval of wrong tier changes.

**Independent Test**: Can be tested by syncing a workout and verifying pending changes show tier-specific labels.

**Acceptance Scenarios**:

1. **Given** Day A1 workout completed with successful T1 Squat, **When** pending changes display, **Then** shows "T1 Squat: 100kg → 102.5kg" not "Squat: 100kg → 102.5kg"
2. **Given** pending change for T1 Bench weight increase, **When** user approves change, **Then** only T1 Bench state updates; T2 Bench remains unchanged
3. **Given** Day B2 workout with failed T2 OHP, **When** pending changes display, **Then** shows "T2 OHP: Stage 0 → Stage 1" with tier prefix

---

### Edge Cases

- What happens when user imports routines with non-standard exercise ordering? System detects based on position and day, presents for verification with source indicators.
- What happens when only T1 or only T2 data exists in import? System pre-fills both with available weight, flags for user review.
- What happens when T2 weight suggestion exceeds T1 weight entered? System still suggests 70%, user can override.
- What happens when deload resets T1 to base weight? T2 remains unaffected at its current weight/stage.

## Requirements *(mandatory)*

### Functional Requirements

**Weight Setup (Create Path)**
- **FR-001**: System MUST collect 8 weights for main lifts: T1 and T2 for each of squat, bench, ohp, deadlift
- **FR-002**: System MUST display clear labels distinguishing T1 vs T2 (e.g., "T1 Squat (5x3)" vs "T2 Squat (3x10)")
- **FR-003**: System SHOULD suggest T2 starting weight as 70% of T1 weight when user enters T1 first
- **FR-024**: System MUST show inline validation errors immediately as user types for invalid weights (negative, non-numeric, or zero values)

**Routine Import (Import Path)**
- **FR-004**: System MUST auto-detect T1 weight from the day where that lift appears in T1 position (position 1)
- **FR-005**: System MUST auto-detect T2 weight from the day where that lift appears in T2 position (position 2)
- **FR-006**: System MUST present detected T1/T2 weights to user for verification before finalizing import
- **FR-007**: System MUST show the source of each detected weight (e.g., "from Day A1, position 1")
- **FR-008**: System MUST allow user to swap T1/T2 values if detection was incorrect
- **FR-009**: System MUST allow user to manually edit either weight during verification
- **FR-010**: System MUST handle cases where only T1 or T2 data is available by pre-filling both with available weight and flagging for user review

**Progression Tracking**
- **FR-011**: System MUST maintain independent progression state for each lift's T1 and T2 variant
- **FR-012**: Each variant MUST track: current weight, current stage, base weight, AMRAP record
- **FR-013**: T1 variants MUST follow T1 progression rules (5x3 → 6x2 → 10x1 → deload)
- **FR-014**: T2 variants MUST follow T2 progression rules (3x10 → 3x8 → 3x6 → deload)

**Workout Analysis**
- **FR-015**: System MUST determine tier from workout day when analyzing completed workouts
- **FR-016**: Day A1/B1 first exercise performance MUST update T1 progression only
- **FR-017**: Day A1/B1 second exercise performance MUST update T2 progression only
- **FR-018**: Day A2/B2 first exercise performance MUST update T1 progression only
- **FR-019**: Day A2/B2 second exercise performance MUST update T2 progression only

**Dashboard Display**
- **FR-020**: System MUST show T1 and T2 status separately for each main lift
- **FR-021**: System MUST display correct weight and rep scheme for each tier

**Pending Changes**
- **FR-022**: System MUST generate tier-specific pending changes (e.g., "T1 Squat: 100kg → 102.5kg")
- **FR-023**: Approving a T1 change MUST NOT affect T2 state for same lift

### Key Entities

- **T1 Progression**: Heavy variant progression state - weight, stage (0=5x3, 1=6x2, 2=10x1), base weight, AMRAP record. One per main lift (squat, bench, ohp, deadlift).
- **T2 Progression**: Lighter variant progression state - weight, stage (0=3x10, 1=3x8, 2=3x6), base weight, AMRAP record. One per main lift (squat, bench, ohp, deadlift).
- **Main Lift**: One of four: squat, bench, ohp, deadlift. Each has exactly one T1 and one T2 progression.
- **Workout Day**: One of A1, A2, B1, B2. Determines which exercises are T1 vs T2 for that session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can set and track 8 independent weights for main lifts (4 T1 + 4 T2)
- **SC-002**: Failing a T1 lift does not affect the corresponding T2 progression state
- **SC-003**: Failing a T2 lift does not affect the corresponding T1 progression state
- **SC-004**: Imported routines correctly populate both T1 and T2 weights with verification step
- **SC-005**: Users can correct auto-detected T1/T2 assignments during import in under 30 seconds per lift
- **SC-006**: Dashboard clearly shows which weight/scheme applies for each tier
- **SC-007**: 100% of pending changes display tier-specific labels (T1/T2 prefix)
- **SC-008**: User can complete full weight setup (8 weights) in under 3 minutes via create path

## Assumptions

- T2 weight is typically 70% of T1 weight for the same lift (reasonable default based on GZCLP program design)
- T1 exercises appear in position 1 on their designated day; T2 exercises appear in position 2
- Standard GZCLP day mapping: A1 (T1 Squat, T2 Bench), A2 (T1 Bench, T2 Squat), B1 (T1 OHP, T2 Deadlift), B2 (T1 Deadlift, T2 OHP)

## Out of Scope

- **Data migration**: No backward compatibility with existing single-weight data. Users with prior data must re-setup via import or create path.

## Clarifications

### Session 2026-01-03

- Q: When a user enters an invalid weight (negative, non-numeric, or 0), what should happen? → A: Show inline error immediately as user types (real-time validation)
