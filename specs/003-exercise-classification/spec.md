# Feature Specification: Exercise Classification System

**Feature Branch**: `003-exercise-classification`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Exercise Classification System - Classify exercises into GZCLP (T1/T2/T3) or non-GZCLP (Warmup/Cooldown/Supplemental) categories during routine import"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classify Exercises During Routine Import (Priority: P1)

As a user importing a routine from Hevy, I need to classify each exercise into one of six categories (T1, T2, T3, Warmup, Cooldown, or Supplemental) so the app knows how to track and display each exercise appropriately.

**Why this priority**: This is the core functionality - without classification during import, the system cannot differentiate between GZCLP-managed exercises and auxiliary exercises. This blocks all other features.

**Independent Test**: Can be fully tested by importing a Hevy routine with mixed exercise types and verifying each exercise can be assigned a category before import completes.

**Acceptance Scenarios**:

1. **Given** I am importing a routine from Hevy with 8 exercises, **When** I view the import screen, **Then** I see all 8 exercises listed with a dropdown next to each for category selection.
2. **Given** I have 3 exercises without a category assigned, **When** I attempt to complete the import, **Then** the import is blocked and I am shown which exercises need classification.
3. **Given** I have assigned categories to all exercises, **When** I complete the import, **Then** each exercise is saved with its assigned category.

---

### User Story 2 - Reclassify Exercises After Import (Priority: P2)

As a user, I need to change an exercise's classification after initial import so I can correct mistakes or adapt to changes in my training approach.

**Why this priority**: Users need flexibility to adjust classifications without re-importing routines. This supports iterative refinement of workout organization.

**Independent Test**: Can be fully tested by accessing an already-imported exercise and changing its category from one type to another.

**Acceptance Scenarios**:

1. **Given** an exercise is currently classified as T3, **When** I change it to Supplemental, **Then** the exercise is now treated as Supplemental in all routines.
2. **Given** an exercise is classified as Warmup, **When** I reclassify it to T1, **Then** it appears in the GZCLP section and follows T1 progression rules going forward.
3. **Given** I reclassify an exercise, **When** I view past workout history, **Then** historical entries retain their original classification context.

---

### User Story 3 - View Exercises by Category in Workout (Priority: P2)

As a user viewing my workout, I need exercises organized by category with warmup/cooldown in collapsible sections so I can focus on my main GZCLP lifts while still having access to auxiliary work.

**Why this priority**: Proper visual organization improves workout usability and keeps focus on the programmed lifts while not losing auxiliary exercises.

**Independent Test**: Can be fully tested by viewing a workout containing exercises from all categories and verifying correct grouping and collapsibility.

**Acceptance Scenarios**:

1. **Given** a workout with warmup, T1, T2, T3, supplemental, and cooldown exercises, **When** I view the workout, **Then** warmup appears in a collapsible section at top, GZCLP lifts (T1/T2/T3) in the main visible section, supplemental with visual markers, and cooldown in a collapsible section at bottom.
2. **Given** the warmup section is collapsed, **When** I tap to expand it, **Then** all warmup exercises become visible.
3. **Given** a workout with no warmup exercises, **When** I view the workout, **Then** no warmup section is shown.

---

### User Story 4 - Resolve Classification Conflicts (Priority: P3)

As a user importing a second routine containing an exercise I already classified differently, I need to resolve the conflict so the system maintains consistent global classification.

**Why this priority**: While important for data integrity, this is an edge case that only occurs when importing multiple routines with overlapping exercises.

**Independent Test**: Can be fully tested by importing two routines that share a common exercise with different intended classifications.

**Acceptance Scenarios**:

1. **Given** "Lat Pulldown" is classified as T3 from a previous import, **When** I import a new routine containing "Lat Pulldown", **Then** I am prompted to confirm or change the existing classification.
2. **Given** a conflict prompt appears, **When** I choose to keep the existing classification, **Then** the exercise retains its T3 classification.
3. **Given** a conflict prompt appears, **When** I choose to update the classification to Supplemental, **Then** the exercise is reclassified globally.

---

### Edge Cases

- What happens when a routine has zero GZCLP exercises (all warmup/cooldown/supplemental)?
  - System allows import; workout view shows only non-GZCLP sections
- What happens when a routine has only T1/T2/T3 exercises (no auxiliary)?
  - System allows import; no collapsible warmup/cooldown sections displayed
- How does the system handle an exercise that exists in Hevy but was deleted from the app's classification store?
  - Treat as new exercise requiring classification
- What happens if user cancels import midway through classification?
  - No changes are saved; user can restart import later
- What happens if Hevy sync fails due to network issues?
  - Failed syncs are queued locally and retried automatically when connectivity returns

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support six exercise categories: T1, T2, T3, Warmup, Cooldown, and Supplemental
- **FR-002**: System MUST display all exercises from a Hevy routine with inline category dropdown during import
- **FR-003**: System MUST block import completion until every exercise has an explicit category assigned
- **FR-004**: System MUST store exercise classifications globally (same classification across all routines)
- **FR-005**: System MUST allow reclassification of any exercise to any category at any time
- **FR-006**: System MUST preserve historical workout data with original classification context when reclassifying
- **FR-007**: System MUST prompt user to resolve conflicts when importing an exercise that already has a different classification
- **FR-008**: System MUST apply GZCLP progression rules only to T1, T2, and T3 exercises
- **FR-009**: System MUST NOT apply automated progression to Warmup, Cooldown, or Supplemental exercises
- **FR-010**: System MUST track history for non-GZCLP exercises (manual progression only)
- **FR-011**: System MUST display warmup exercises in a collapsible section at the top of workout view
- **FR-012**: System MUST display cooldown exercises in a collapsible section at the bottom of workout view
- **FR-013**: System MUST display T1, T2, T3 exercises in the main (always visible) workout section
- **FR-014**: System MUST display supplemental exercises inline with a visual marker/badge
- **FR-015**: System MUST sync all exercise categories (including non-GZCLP) back to Hevy
- **FR-016**: System MUST NOT allow manual creation of exercises outside of Hevy routine imports
- **FR-017**: System MUST queue failed Hevy syncs and retry automatically when connectivity returns

### Key Entities

- **Exercise**: Represents a unique exercise from Hevy; uniquely identified by Hevy exercise ID (used for matching across imports), has a display name, and a single global classification category
- **Exercise Classification**: One of six categories (T1, T2, T3, Warmup, Cooldown, Supplemental) that determines tracking behavior and display location
- **Workout History Entry**: A record of an exercise performed in a workout; retains the classification that was active at the time of the workout

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete exercise classification for a 10-exercise routine in under 2 minutes
- **SC-002**: 100% of exercises in an imported routine have explicit classifications before import completes
- **SC-003**: Users can reclassify any exercise in 3 taps or fewer
- **SC-004**: Workout view correctly groups exercises by category with 100% accuracy
- **SC-005**: Historical workout data remains unchanged when exercises are reclassified (verified via history view)
- **SC-006**: All exercise data syncs back to Hevy including non-GZCLP categories

## Clarifications

### Session 2026-01-03

- Q: How should the system identify that two exercises are the same across different Hevy routine imports? → A: Match by Hevy exercise ID (unique identifier from Hevy API)
- Q: How should the system behave when syncing exercise data back to Hevy fails? → A: Queue failed syncs and retry automatically when connectivity returns

## Assumptions

- Users have already connected their Hevy account and can access routines via the existing Hevy integration
- The existing GZCLP progression logic for T1/T2/T3 remains unchanged; this feature only adds the ability to exclude exercises from that logic
- "Manual progression" for non-GZCLP exercises means the system logs what the user does but does not suggest weight/rep changes
- Classification conflicts only occur during import, not during workout logging (since exercises are already classified by then)
