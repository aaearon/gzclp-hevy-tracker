# Feature Specification: Import UX Simplification

**Feature Branch**: `004-import-ux-simplification`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Replace complex slot/category system with simple role-based assignment for GZCLP exercises"

## Clarifications

### Session 2026-01-03

- Q: How should existing user data (weights, progression history) be handled given the breaking schema change? → A: Clear all data and prompt user to re-setup from scratch on first load.
- Q: What should happen if Hevy API is unavailable during import (for stage auto-detection)? → A: Block import and require successful Hevy connection to complete.

## Problem Statement

The current import workflow has redundant and confusing fields that create a poor user experience:

1. **Category dropdown** (T1, T2, T3, Warmup, Cooldown, Supplemental) overlaps with slot selection
2. **Slot dropdown** (t1_squat, t1_bench, t2_squat, etc.) is redundant when category already implies tier
3. **Stage dropdown** (Stage 1, 2, 3) adds complexity without clear user value

**Key issues**:
- Selecting Category=T1 still requires picking a slot like t1_squat (redundant)
- Selecting Category=Warmup makes the slot dropdown meaningless
- "Supplemental" category is redundant - non-main-lift exercises are just T3 accessories
- Current model has 8 T1/T2 slots when GZCLP uses the SAME exercise for both T1 and T2 on different days

## Solution Overview

Replace the complex slot/category system with a simple "Role" assignment using 7 total roles instead of 11 slots + 6 categories:

**Main Lifts (4 roles)**:
- Squat - T1 on A1, T2 on A2
- Bench Press - T1 on A2, T2 on A1
- Overhead Press - T1 on B1, T2 on B2
- Deadlift - T1 on B2, T2 on B1

**Accessories (1 role)**:
- T3 Accessory - follows T3 progression (3x15+), multiple per workout

**Non-Training (2 roles)**:
- Warmup - collapsible section at top, no progression
- Cooldown - collapsible section at bottom, no progression

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Assign Roles During Import (Priority: P1)

As a user importing a Hevy routine, I select a single "Role" for each exercise from a dropdown so the app knows how to track progression for each exercise type.

**Why this priority**: This is the core feature - without role assignment, no other functionality works. This replaces the confusing multi-dropdown system with a single, clear choice.

**Independent Test**: Can be fully tested by importing a routine and verifying each exercise receives exactly one role. Delivers immediate value by simplifying the import flow from 3 dropdowns to 1.

**Acceptance Scenarios**:

1. **Given** a user is on the import screen with exercises from Hevy, **When** they view any exercise row, **Then** they see a single "Role" dropdown with 7 options (Squat, Bench Press, Overhead Press, Deadlift, T3 Accessory, Warmup, Cooldown)
2. **Given** a user selects "Squat" for an exercise, **When** they try to assign "Squat" to another exercise, **Then** the system prevents this and shows a warning that Squat is already assigned
3. **Given** a user assigns "T3 Accessory" to an exercise, **When** they assign "T3 Accessory" to additional exercises, **Then** all assignments succeed (no limit on T3/Warmup/Cooldown)
4. **Given** an exercise has a main lift role (Squat/Bench/OHP/Deadlift), **When** viewing that exercise row, **Then** a weight input field appears for setting starting weight
5. **Given** an exercise has T3/Warmup/Cooldown role, **When** viewing that exercise row, **Then** no weight input field appears
6. **Given** any exercise has no role assigned, **When** user tries to complete import, **Then** the import button is disabled with a message indicating all exercises need roles

---

### User Story 2 - View Simplified Workout Structure (Priority: P2)

As a user viewing my workout, I see exercises grouped by their role with a clear visual hierarchy that matches how I think about my workout.

**Why this priority**: After import, users need to see their workout organized logically. This directly improves the daily workout experience.

**Independent Test**: Can be tested by viewing any workout day and verifying exercises appear in correct sections with proper labels.

**Acceptance Scenarios**:

1. **Given** a workout contains warmup exercises, **When** viewing the workout, **Then** a collapsible "Warmup" section appears at the top
2. **Given** a workout is day A1, **When** viewing the workout, **Then** the main lifts section shows Squat labeled as T1 and Bench Press labeled as T2 with their current weights
3. **Given** a workout contains T3 exercises, **When** viewing the workout, **Then** all T3 exercises appear in a "T3 Accessories" section below main lifts
4. **Given** a workout contains cooldown exercises, **When** viewing the workout, **Then** a collapsible "Cooldown" section appears at the bottom
5. **Given** a workout has no warmup exercises, **When** viewing the workout, **Then** no warmup section is rendered
6. **Given** the warmup section is collapsed, **When** user clicks the section header, **Then** the section expands to show warmup exercises

---

### User Story 3 - Manage Exercise Roles After Import (Priority: P3)

As a user, I can change an exercise's role in Settings if I made a mistake during import, without having to re-import my entire routine.

**Why this priority**: Error correction is important but less frequent than initial setup or daily workout viewing.

**Independent Test**: Can be tested by navigating to Settings, changing a role, and verifying the change persists and reflects in workout view.

**Acceptance Scenarios**:

1. **Given** a user is in Settings, **When** they view the exercise management section, **Then** they see all exercises listed with their current role
2. **Given** an exercise has role "T3 Accessory", **When** user changes it to "Squat", **Then** the role updates and Squat appears in main lift position on appropriate workout days
3. **Given** exercise A has role "Squat" and exercise B has role "T3 Accessory", **When** user tries to change exercise B to "Squat", **Then** a warning appears offering to swap roles between A and B
4. **Given** a user accepts the role swap offer, **When** the swap completes, **Then** exercise A becomes T3 Accessory and exercise B becomes Squat

---

### Edge Cases

- **Two squat variations imported**: User assigns one as "Squat" main lift, the other as "T3 Accessory"
- **No T3 exercises**: Valid configuration - T3 section simply doesn't render
- **Multiple T3 exercises (5+)**: All shown in T3 section with no limit
- **No warmup/cooldown exercises**: Those sections don't render
- **User imports new routine over existing**: Previous role assignments are cleared and user re-assigns all roles
- **Existing user data on upgrade**: All stored data (weights, progression history, role assignments) is cleared; user sees a prompt explaining they need to re-setup from scratch due to the simplified data model
- **Hevy API unavailable during import**: Import is blocked; user sees an error message indicating Hevy connection is required and to try again later

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a single "Role" dropdown per exercise during import (replacing Category + Slot dropdowns)
- **FR-002**: System MUST enforce that main lift roles (Squat, Bench Press, Overhead Press, Deadlift) can only be assigned to one exercise each
- **FR-003**: System MUST allow T3 Accessory, Warmup, and Cooldown roles to be assigned to multiple exercises
- **FR-004**: System MUST display a weight input field only for exercises with main lift roles
- **FR-005**: System MUST block import completion until all exercises have a role assigned
- **FR-006**: System MUST derive the tier (T1/T2/T3) from the exercise role and current workout day using standard GZCLP rotation
- **FR-007**: System MUST display warmup exercises in a collapsible section at the top of workout view
- **FR-008**: System MUST display cooldown exercises in a collapsible section at the bottom of workout view
- **FR-009**: System MUST NOT display any "Supplemental" category or section (concept removed)
- **FR-010**: System MUST allow users to change exercise roles in Settings after import
- **FR-011**: System MUST warn users when changing to a main lift role that is already assigned to another exercise
- **FR-012**: System MUST offer a role swap option when a main lift role conflict is detected
- **FR-013**: System MUST auto-detect stage from Hevy workout history when available, defaulting to Stage 1 otherwise
- **FR-014**: System MUST clear all existing stored data on first load after upgrade and display a prompt explaining the user needs to re-setup
- **FR-015**: System MUST block import completion if Hevy API is unavailable and display an error message requiring the user to retry when connection is restored

### Key Entities

- **ExerciseRole**: The role assigned to an exercise - one of: squat, bench, ohp, deadlift, t3, warmup, cooldown
- **ExerciseConfig**: Configuration for a tracked exercise containing id, hevy template reference, name, and role
- **GZCLPDay**: The workout day identifier (A1, A2, B1, B2) that determines T1/T2 rotation
- **Tier**: Derived value (T1, T2, T3, or null) calculated from role + current day

### Data Model Concept

The tier is derived dynamically rather than stored:
- Squat: T1 on A1, T2 on A2
- Bench Press: T1 on A2, T2 on A1
- Overhead Press: T1 on B1, T2 on B2
- Deadlift: T1 on B2, T2 on B1
- T3 Accessory: Always T3
- Warmup/Cooldown: No tier (null)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete exercise role assignment in under 30 seconds per exercise (down from 60+ seconds with current 3-dropdown system). Measured via manual user testing with 5+ test subjects.
- **SC-002**: Import completion rate reaches 95%+ (baseline unknown; qualitative success = zero abandonment reports due to UI confusion)
- **SC-003**: 95% of users correctly assign all 4 main lifts on first import attempt
- **SC-004**: Zero support questions about "what's the difference between category and slot"
- **SC-005**: Workout view renders correct T1/T2 exercises for each day type with 100% accuracy
- **SC-006**: Users can identify today's T1 and T2 exercises within 2 seconds of viewing workout

## Breaking Changes

This feature intentionally removes backward compatibility with the previous data model:

**Removed Concepts**:
- GZCLPSlot type (t1_squat, t1_bench, t2_squat, etc.)
- ExerciseCategory type with 6 values
- "Supplemental" as a category
- Separate slot and category fields on ExerciseConfig

**New Concepts**:
- ExerciseRole type with 7 values
- Single role field on ExerciseConfig
- Tier derived from role + day (not stored)

## Assumptions

- Users understand basic GZCLP terminology (T1, T2, T3)
- The standard GZCLP rotation (Squat/Bench on A days, OHP/Deadlift on B days) is fixed and not customizable
- Stage auto-detection from Hevy history uses the most recent workout data for each main lift
- Weight input for main lifts uses kg as the default unit (matching existing app behavior)
- Collapsible sections default to collapsed state to minimize visual clutter
