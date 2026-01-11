# GZCLP Hevy Integration - Functional Requirements

**Version:** 2.3
**Last Updated:** 2026-01-04

> **NOTE:** This requirements document is largely **superseded** by the implementation in [ARCHITECTURE.md](ARCHITECTURE.md).
> The architecture doc reflects the actual codebase state and is kept up-to-date, while this document captures the original design intent and may not reflect all implementation decisions.
>
> Use this for understanding design rationale; use ARCHITECTURE.md for current implementation details.

---

## 0. Document Metadata

### 0.1 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.3 | 2026-01-04 | Refined onboarding flow (combined API key + path choice in Step 1), changed post-workout summary to slide-in panel, added toast notification for auto-sync, clarified implementation details |
| 2.2 | 2026-01-04 | Added Onboarding & App States (Section 8), integrated Setup Wizard (Section 9) and Import Flow (Section 10) cohesively |
| 2.1 | 2026-01-04 | Added Import Flow for existing GZCLP users |
| 2.0 | 2026-01-04 | Restructured for LLM consumption: added requirement IDs, glossary, state machines, acceptance criteria, formulas, error handling |
| 1.1 | 2026-01-04 | Added auto-sync, today's workout preview, post-workout summary |
| 1.0 | 2026-01-03 | Initial specification |

### 0.2 Document Conventions

- **[REQ-XXX-NNN]** — Unique requirement identifier (XXX = category, NNN = number)
- **SHALL** — Mandatory requirement
- **SHOULD** — Recommended but not mandatory
- **MAY** — Optional feature

---

## 1. Glossary

| Term | Definition |
|------|------------|
| **AMRAP** | "As Many Reps As Possible" — final set performed to near-failure |
| **Base Weight** | Weight used for deload calculation (deload = 85% of base weight) |
| **Current Weight** | Working weight for next workout |
| **Day** | One of four workout configurations: A1, B1, A2, B2 |
| **Deload** | Weight reduction (to 85% of base) after failing final stage |
| **Failure** | Not completing required reps on any working set |
| **GZCLP** | GZCL Linear Progression — beginner strength program |
| **Hevy** | Third-party workout logging application |
| **Increment** | Weight added after successful workout (2.5kg upper, 5kg lower) |
| **PR** | Personal Record — best AMRAP reps achieved at a given weight |
| **Progression** | Weight increase after successful completion |
| **Rep Scheme** | Sets × Reps format (e.g., 5x3+, 3x10) |
| **Routine** | Hevy entity containing exercises for one workout |
| **Stage** | Current rep scheme phase (0, 1, or 2) |
| **Success** | Completing all working sets with required reps |
| **Sync** | Fetching workout data from Hevy and calculating progressions |
| **T1** | Tier 1 — primary strength lift (5x3+ → 6x2+ → 10x1+) |
| **T2** | Tier 2 — secondary volume lift (3x10 → 3x8 → 3x6) |
| **T3** | Tier 3 — accessory exercise (3x15+) |
| **Warmup Set** | Lighter preparatory set before working sets |
| **Working Set** | Set performed at current weight for progression evaluation |
| **Working Weight** | Synonym for Current Weight |

---

## 2. Problem Statement

### 2.1 Background

Hevy is a workout logging application that allows users to create routines, log workouts, and track exercise history. It does not implement program-specific logic.

### 2.2 Problem

Hevy does not provide:
- Automatic weight progression based on workout success
- Rep scheme stage changes on failure (5x3 → 6x2 → 10x1)
- Automatic deload calculations
- GZCLP-specific program rules

Users following GZCLP must manually calculate progressions and update routines.

### 2.3 Solution

A web application that:
- Tracks GZCLP progression state
- Reads completed workouts from Hevy API
- Evaluates success/failure per GZCLP rules
- Calculates progressions, stage changes, and deloads
- Updates Hevy routines after user confirmation

### 2.4 Key Principle

| Application | Role |
|-------------|------|
| **Hevy** | Workout logger (used in gym) |
| **This App** | Progression brain (used between workouts) |

All routine updates require explicit user confirmation.

---

## 3. Functional Requirements: Program Structure

### [REQ-PROG-001] Day Configuration

The system SHALL support exactly four workout days with fixed T1/T2 assignments:

| Day | T1 Exercise | T2 Exercise |
|-----|-------------|-------------|
| A1 | Squat | Bench Press |
| B1 | OHP | Deadlift |
| A2 | Bench Press | Squat |
| B2 | Deadlift | OHP |

**Acceptance Criteria:**
- T1/T2 exercises are NOT user-selectable
- T1/T2 are determined by day selection only
- Each main lift appears as T1 on one day and T2 on another

### [REQ-PROG-002] T3 Accessory Selection

The system SHALL allow users to select T3 accessories from Hevy's exercise database.

**Acceptance Criteria:**
- Minimum 2 T3 exercises per day
- No maximum limit
- T3 exercises MAY differ between days
- T3 exercises MAY be reused across days
- Selection source: Hevy `GET /v1/exercise_templates`

### [REQ-PROG-003] Rotation Pattern

The system SHALL track workout rotation in order: A1 → B1 → A2 → B2 → A1...

**Acceptance Criteria:**
- After completing A1, `currentDay` advances to B1
- After completing B2, `currentDay` advances to A1
- Rotation is independent of calendar days

### [REQ-PROG-004] Main Lift Mapping

The system SHALL map each main lift to a Hevy exercise template.

| Lift | Expected Hevy Template | Muscle Group |
|------|------------------------|--------------|
| Squat | "Squat (Barbell)" or user-selected equivalent | Lower |
| Bench Press | "Bench Press (Barbell)" or user-selected equivalent | Upper |
| OHP | "Overhead Press (Barbell)" or user-selected equivalent | Upper |
| Deadlift | "Deadlift (Barbell)" or user-selected equivalent | Lower |

**Acceptance Criteria:**
- User selects Hevy template for each lift during setup
- Mapping stored as `hevyTemplateId`
- Muscle group determines weight increment (upper: 2.5kg, lower: 5kg)

---

## 4. Functional Requirements: Progression Rules

### 4.1 State Machine: T1 Progression

```
┌─────────────────────────────────────────────────────────────┐
│                    T1 PROGRESSION STATE MACHINE             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                            │
│  │  STAGE 0    │                                            │
│  │   5x3+      │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    SUCCESS: weight += increment, stay STAGE 0              │
│    FAILURE: go to STAGE 1, weight unchanged                │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  STAGE 1    │                                            │
│  │   6x2+      │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    SUCCESS: weight += increment, stay STAGE 1              │
│    FAILURE: go to STAGE 2, weight unchanged                │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  STAGE 2    │                                            │
│  │   10x1+     │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    SUCCESS: weight += increment, stay STAGE 2              │
│    FAILURE: DELOAD → go to STAGE 0                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

DELOAD FORMULA:
  newWeight = round(baseWeight * 0.85, 2.5)
  newWeight = max(newWeight, 20)  // Never below bar
  baseWeight = newWeight
  stage = 0
```

### 4.2 State Machine: T2 Progression

```
┌─────────────────────────────────────────────────────────────┐
│                    T2 PROGRESSION STATE MACHINE             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                            │
│  │  STAGE 0    │                                            │
│  │   3x10      │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    SUCCESS: weight += increment, stay STAGE 0              │
│    FAILURE: go to STAGE 1, weight unchanged                │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  STAGE 1    │                                            │
│  │   3x8       │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    SUCCESS: weight += increment, stay STAGE 1              │
│    FAILURE: go to STAGE 2, weight unchanged                │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  STAGE 2    │                                            │
│  │   3x6       │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    SUCCESS: weight += increment, stay STAGE 2              │
│    FAILURE: DELOAD → go to STAGE 0                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 T3 Progression (No Stages)

```
T3 PROGRESSION:
  IF totalReps >= 25 THEN
    weight += 2.5
  ELSE
    weight unchanged (repeat)
  
  Where: totalReps = sum of reps across all 3 sets
```

### [REQ-PROG-005] T1 Success Criteria

**Definition:** T1 SUCCESS occurs when ALL working sets meet required reps.

| Stage | Scheme | Required Sets | Required Reps/Set | AMRAP Set |
|-------|--------|---------------|-------------------|-----------|
| 0 | 5x3+ | 5 | 3 | Last |
| 1 | 6x2+ | 6 | 2 | Last |
| 2 | 10x1+ | 10 | 1 | Last |

**Acceptance Criteria:**
- Warmup sets are NOT evaluated
- ALL working sets must have reps >= required
- Logged set count must equal required sets
- If fewer sets logged → FAILURE
- If more sets logged → evaluate first N sets only
- AMRAP set: any reps >= required counts as success

### [REQ-PROG-006] T2 Success Criteria

**Definition:** T2 SUCCESS occurs when ALL working sets meet required reps.

| Stage | Scheme | Required Sets | Required Reps/Set | AMRAP Set |
|-------|--------|---------------|-------------------|-----------|
| 0 | 3x10 | 3 | 10 | None |
| 1 | 3x8 | 3 | 8 | None |
| 2 | 3x6 | 3 | 6 | None |

**Acceptance Criteria:**
- Same rules as T1 except no AMRAP
- ALL 3 sets must meet rep requirement

### [REQ-PROG-007] T3 Success Criteria

**Definition:** T3 SUCCESS occurs when total reps across all sets >= 25.

| Scheme | Required Sets | Target Reps/Set | Success Threshold |
|--------|---------------|-----------------|-------------------|
| 3x15+ | 3 | 15 | 25 total reps |

**Acceptance Criteria:**
- Sum reps from all 3 sets
- If sum >= 25 → increase weight
- If sum < 25 → repeat same weight
- No stage changes for T3

### [REQ-PROG-008] Weight Increments

| Muscle Group | Increment (kg) | Applies To |
|--------------|----------------|------------|
| Lower | 5.0 | Squat, Deadlift (T1 and T2) |
| Upper | 2.5 | Bench, OHP (T1 and T2) |
| Accessory | 2.5 | All T3 exercises |

### [REQ-PROG-009] Deload Calculation

**Formula:**
```
newWeight = baseWeight × 0.85
newWeight = roundToNearest(newWeight, 2.5)
newWeight = max(newWeight, 20)  // Minimum bar weight
baseWeight = newWeight          // Reset base for next deload
stage = 0                       // Restart at first stage
```

**Acceptance Criteria:**
- Deload only triggered after failing final stage (Stage 2)
- Minimum weight is 20kg (bar weight)
- Round to nearest 2.5kg
- Base weight resets to new weight

### [REQ-PROG-010] T3 Shared Progression

The system SHALL share progression state for identical T3 exercises across days.

**Acceptance Criteria:**
- Progression key format: `t3_{hevyTemplateId}`
- Same exercise on A1 and B2 uses same progression record
- Weight increase after A1 applies to B2 routine

### [REQ-PROG-011] Incomplete Workout Handling

The system SHALL treat incomplete workouts as FAILURE.

**Definition:** Incomplete = fewer working sets logged than required.

**Acceptance Criteria:**
- If logged sets < required sets → FAILURE
- Triggers stage advancement (or deload if at Stage 2)
- Display to user: "Incomplete workout detected (3/5 sets). Treating as failure."

---

## 5. Functional Requirements: AMRAP

### [REQ-AMRAP-001] AMRAP Set Identification

| Tier | Has AMRAP | Which Set |
|------|-----------|-----------|
| T1 | Yes | Last working set |
| T2 | No | None |
| T3 | Yes | Last set |

### [REQ-AMRAP-002] AMRAP Indication in Hevy

The system SHALL indicate AMRAP sets via exercise notes field.

**Format:**
- T1: `"T1 - 5x3+ (last set AMRAP)"`
- T3: `"T3 - 3x15+ (last set AMRAP, target 25+ total reps)"`

### [REQ-AMRAP-003] PR Tracking

The system SHALL track best AMRAP reps per exercise at each weight.

**Storage:** `progression[key].amrapRecord`

**Acceptance Criteria:**
- Record = best reps achieved at current weight
- New PR = current AMRAP > stored record at same weight
- Reset record when weight increases
- Display: "New PR! 8 reps @ 100kg (previous: 6)"

---

## 6. Functional Requirements: Warmup Sets

### [REQ-WARM-001] Warmup Applicability

The system SHALL generate warmup sets for T1 exercises only.

**Rationale:** T2 follows T1; muscles already warm.

### [REQ-WARM-002] Warmup Protocol

| Set | Weight Calculation | Reps |
|-----|-------------------|------|
| 1 | 20kg (bar only) | 10 |
| 2 | 50% of working weight | 5 |
| 3 | 70% of working weight | 3 |
| 4 | 85% of working weight | 2 |

### [REQ-WARM-003] Warmup Weight Calculation

**Formula:**
```
warmupWeight = workingWeight × percentage
warmupWeight = roundToNearest(warmupWeight, 2.5)
warmupWeight = max(warmupWeight, 20)  // Never below bar
```

**Acceptance Criteria:**
- All warmup weights rounded to nearest 2.5kg
- Minimum warmup weight is 20kg
- Warmup weights recalculate when working weight changes

---

## 7. Functional Requirements: Rest Timers

### [REQ-REST-001] Rest Timer Values

| Tier | Rest (seconds) | Hevy Field |
|------|----------------|------------|
| T1 | 240 | `rest_seconds: 240` |
| T2 | 150 | `rest_seconds: 150` |
| T3 | 75 | `rest_seconds: 75` |

**Note:** Values are midpoints of recommended ranges (T1: 3-5min, T2: 2-3min, T3: 60-90s).

---

## 8. Functional Requirements: Onboarding & App States

### 8.1 App State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      APP STATE MACHINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [App Launch]                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │ Check State │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    ┌────┴────┐                                              │
│    │         │                                              │
│    ▼         ▼                                              │
│  [No State]  [Has State]                                    │
│    │              │                                         │
│    ▼              ▼                                         │
│  ┌──────────┐  ┌───────────┐                                │
│  │  Setup   │  │ Dashboard │◄────────────────────┐          │
│  │  Step 1  │  └─────┬─────┘                     │          │
│  │(API Key +│        │                           │          │
│  │ Path)    │        ▼                           │          │
│  └────┬─────┘  ┌───────────┐    ┌───────────┐   │          │
│       │        │   Sync    │───►│Post-Workout│───┘          │
│  ┌────┴────┐   └───────────┘    │  Summary   │              │
│  │         │                    │(Slide-in)  │              │
│  ▼         ▼                    └───────────┘              │
│ [Start   [Import                      │                     │
│  New]    Existing]                    ▼                     │
│  │         │                    ┌───────────┐               │
│  ▼         ▼                    │Confirmation│──► [Hevy     │
│ ┌─────┐  ┌──────┐               │   Dialog  │     Update]   │
│ │Setup│  │Import│               └───────────┘               │
│ │Wizard│ │ Flow │                                           │
│ └──┬──┘  └──┬───┘                                           │
│    │        │                                               │
│    └────┬───┘                                               │
│         │                                                   │
│         ▼                                                   │
│   [Program Created]─────────────────────────────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### [REQ-ONBOARD-001] State Detection on Launch

The system SHALL check for existing program state in localStorage on every app launch.

**Logic:**
```
IF localStorage.getItem('gzclp-state') exists AND is valid THEN
  Navigate to Dashboard
ELSE
  Navigate to Welcome Screen
```

**Acceptance Criteria:**
- State validation includes: apiKey present, program.routineIds has at least one non-null value
- Invalid/corrupted state treated as no state (show Welcome Screen)
- No user interaction required for return visits

### [REQ-ONBOARD-002] Combined Step 1: API Key & Path Selection

The system SHALL display a combined first step for first-time users (no existing state) that includes both API key entry and program path selection.

**Content:**
- App title/logo
- Brief description: "Track your GZCLP progress with automatic Hevy integration"
- Hevy API key input field (required, validated)
- Two path selection options (displayed after API key validated):
  1. **"Start New Program"** — For users new to GZCLP
  2. **"Import Existing Program"** — For users already doing GZCLP in Hevy

**Path Descriptions:**
| Option | Subtitle | Destination |
|--------|----------|-------------|
| Start New Program | "I'm starting GZCLP from scratch" | Setup Wizard Step 2 (Section 9) |
| Import Existing Program | "I've been doing GZCLP in Hevy" | Import Flow Step 2 (Section 10) |

**Acceptance Criteria:**
- API key validation happens first (via `GET /v1/exercise_templates?pageSize=1`)
- Path options shown/enabled only after API key validated successfully
- Both path options equally prominent (no default)
- Clear distinction between the two paths
- Weight unit selection included in this step (default: kg)
- Continue button disabled until API key validated AND path selected

### [REQ-ONBOARD-003] Return Visit Behavior

The system SHALL navigate directly to Dashboard for users with existing program state.

**Acceptance Criteria:**
- No Welcome Screen shown
- Auto-sync triggered on Dashboard load (per REQ-SYNC-001)
- User sees their current program immediately

### [REQ-ONBOARD-004] Program Reset

The system SHALL allow users to reset their program from Settings.

**Process:**
1. User navigates to Settings
2. User selects "Reset Program"
3. Confirmation dialog: "This will delete all local data. You'll need to set up again. Continue?"
4. On confirm: clear localStorage, navigate to Welcome Screen
5. On cancel: return to Settings

**Acceptance Criteria:**
- Hevy routines are NOT deleted (user must do manually if desired)
- Only local state is cleared
- Requires explicit confirmation

### 8.2 Navigation Summary

| From | To | Trigger |
|------|-----|---------|
| App Launch | Setup Step 1 | No existing state |
| App Launch | Dashboard | Has valid state |
| Setup Step 1 | Setup Wizard Step 2 | "Start New Program" selected |
| Setup Step 1 | Import Flow Step 2 | "Import Existing Program" selected |
| Setup Wizard | Dashboard | Completed final step |
| Import Flow | Dashboard | Completed final step |
| Dashboard | Post-Workout Summary | Auto-sync detects new workout |
| Dashboard | Today's Workout | "Start Workout" button |
| Dashboard | Settings | Settings button |
| Settings | Setup Step 1 | "Reset Program" confirmed |

---

## 9. Functional Requirements: Setup Wizard

### 9.1 Overview

The Setup Wizard is for users **new to GZCLP** who are starting the program from scratch. All exercises start at Stage 0 (5x3+ for T1, 3x10 for T2) and new routines are created in Hevy.

For users already doing GZCLP, see **Section 10: Import Flow**.

**Note:** Step 1 (API Key & Path Selection) is shared with Import Flow and defined in [REQ-ONBOARD-002]. The Setup Wizard begins at Step 2 after user selects "Start New Program".

### 9.2 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SETUP WIZARD FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Step 1: API Key & Path Selection] ◄── Shared (Section 8)  │
│         │ "Start New Program"                               │
│         ▼                                                   │
│  [Step 2: Main Lift Templates]                              │
│         │                                                   │
│         ▼                                                   │
│  [Step 3: Day A1 Configuration]                             │
│         │                                                   │
│         ▼                                                   │
│  [Step 4: Day B1 Configuration]                             │
│         │                                                   │
│         ▼                                                   │
│  [Step 5: Day A2 Configuration]                             │
│         │                                                   │
│         ▼                                                   │
│  [Step 6: Day B2 Configuration]                             │
│         │                                                   │
│         ▼                                                   │
│  [Step 7: Review & Create]                                  │
│         │                                                   │
│         ▼                                                   │
│  [Dashboard]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### [REQ-SETUP-001] Step 1: API Key & Path Selection (Shared)

See [REQ-ONBOARD-002] in Section 8. This step is shared between Setup Wizard and Import Flow.

### [REQ-SETUP-002] Step 2: Main Lift Templates

**Inputs:**
- Template selection for each lift (Squat, Bench, OHP, Deadlift)

**Data Source:** `GET /v1/exercise_templates` (paginated, fetch all)

**Acceptance Criteria:**
- Display searchable list of Hevy exercises
- User selects one template per lift
- Continue disabled until all 4 mapped
- Store `hevyTemplateId` for each lift

### [REQ-SETUP-003] Steps 3-6: Day Configuration

**Per Day Inputs:**
- T1 starting weight (number, required)
- T2 starting weight (number, required)
- T3 accessories (array, minimum 2)
  - Each: exercise selection + starting weight

**Display:**
- T1/T2 exercise names (from Step 2, read-only)
- T3 exercise selector (from Hevy templates)

**T3 Auto-Fill:**
- If T3 exercise was configured on previous day, auto-fill weight
- Show hint: "(from Day X)"
- User may override

**Acceptance Criteria:**
- T1/T2 weights required
- Minimum 2 T3 exercises required
- All weights > 0
- Continue disabled until valid

### [REQ-SETUP-004] Step 7: Review & Create

**Display:**
- Summary of all 4 days (exercises + weights)
- Warning if existing GZCLP routines found in Hevy

**Existing Routine Detection:**
- Fetch `GET /v1/routines`
- Search for titles matching "GZCLP Day A1/B1/A2/B2"
- If found: show confirmation dialog with option to overwrite

**On Confirm (no existing routines):**
1. Create 4 routines via `POST /v1/routines`
2. Store returned routine IDs in state
3. Initialize all progression records
4. Navigate to Dashboard

**On Confirm (existing routines found + user confirms overwrite):**
1. Update existing routines via `PUT /v1/routines/{id}`
2. Store routine IDs in state (from existing routines)
3. Initialize all progression records
4. Navigate to Dashboard

**Note:** Hevy API does not support DELETE for routines. Existing routines are updated in-place via PUT.

### [REQ-SETUP-005] Wizard Navigation

**Rules:**
- Steps 2-7 have Back button
- Going back preserves entered data
- Wizard state held in memory (not persisted)
- Closing browser loses unsaved progress

### [REQ-SETUP-006] Progression Initialization

On program creation, initialize progression record for each exercise:

```
progression[key] = {
  currentWeight: <entered starting weight>,
  stage: 0,
  baseWeight: <entered starting weight>,
  lastWorkoutId: null,
  lastWorkoutDate: null,
  consecutiveFailures: 0,
  totalDeloads: 0,
  amrapRecord: 0
}
```

**Keys:**
- Main lifts: `squat_t1`, `squat_t2`, `bench_t1`, `bench_t2`, `ohp_t1`, `ohp_t2`, `deadlift_t1`, `deadlift_t2`
- T3 accessories: `t3_{hevyTemplateId}`

---

## 10. Functional Requirements: Import Flow (Existing GZCLP Users)

### 10.1 Overview

The Import Flow supports users who have been performing GZCLP in Hevy WITHOUT the app and want to start using it. Unlike the Setup Wizard (for new programs), Import allows users to:
- Specify current weights AND current stages
- Link to existing Hevy routines OR create new ones
- Resume at their current position in the rotation

**Note:** Step 1 (API Key & Path Selection) is shared with Setup Wizard and defined in [REQ-ONBOARD-002]. The Import Flow begins at Step 2 after user selects "Import Existing Program".

### 10.2 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      IMPORT FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Step 1: API Key & Path Selection] ◄── Shared (Section 8)  │
│         │ "Import Existing Program"                         │
│         ▼                                                   │
│  [Step 2: Main Lift Templates]                              │
│         │                                                   │
│         ▼                                                   │
│  [Step 3: Routine Linking]  ← Import-specific               │
│         │                                                   │
│         ▼                                                   │
│  [Step 4: Day A1 Configuration + Stage Selection]           │
│         │                                                   │
│         ▼                                                   │
│  [Step 5: Day B1 Configuration + Stage Selection]           │
│         │                                                   │
│         ▼                                                   │
│  [Step 6: Day A2 Configuration + Stage Selection]           │
│         │                                                   │
│         ▼                                                   │
│  [Step 7: Day B2 Configuration + Stage Selection]           │
│         │                                                   │
│         ▼                                                   │
│  [Step 8: Rotation Position]  ← Import-specific             │
│         │                                                   │
│         ▼                                                   │
│  [Step 9: Review & Create/Link]                             │
│         │                                                   │
│         ▼                                                   │
│  [Dashboard]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### [REQ-IMPORT-001] Entry Point

Entry point is defined in [REQ-ONBOARD-002] (Section 8). User selects "Import Existing Program" to enter this flow.

### [REQ-IMPORT-002] Step 1: API Key & Path Selection (Shared)

See [REQ-ONBOARD-002] in Section 8. This step is shared between Setup Wizard and Import Flow.

### [REQ-IMPORT-003] Step 2: Main Lift Templates

Identical to [REQ-SETUP-002] (Section 9).

### [REQ-IMPORT-004] Step 3: Routine Linking

**Purpose:** Allow user to link existing Hevy routines OR create new ones.

**Display:**
- Fetch all routines from Hevy via `GET /v1/routines`
- Show two options:
  1. "Link existing routines"
  2. "Create new routines"

**Option 1: Link Existing Routines**
- Display list of user's Hevy routines
- User selects one routine for each day (A1, B1, A2, B2)
- Selected routine IDs stored in state

**Option 2: Create New Routines**
- Same as Setup Wizard (routines created in final step)

**Acceptance Criteria:**
- User can mix: link some days, create others (if needed)
- Validation: all 4 days must be assigned before continuing
- Linked routines will be UPDATED with correct exercises/weights in final step

### [REQ-IMPORT-005] Steps 4-7: Day Configuration with Stage Selection

**Difference from Setup Wizard:** User also selects current STAGE for T1 and T2.

**Per Day Inputs:**
- T1 current weight (number, required)
- T1 current stage (dropdown, required):
  - "5x3+ (Stage 1)" — default
  - "6x2+ (Stage 2)"
  - "10x1+ (Stage 3)"
- T2 current weight (number, required)
- T2 current stage (dropdown, required):
  - "3x10 (Stage 1)" — default
  - "3x8 (Stage 2)"
  - "3x6 (Stage 3)"
- T3 accessories (array, minimum 2)
  - Each: exercise selection + current weight

**Stage Dropdown Labels:**
| Tier | Stage 0 | Stage 1 | Stage 2 |
|------|---------|---------|---------|
| T1 | 5x3+ (default) | 6x2+ | 10x1+ |
| T2 | 3x10 (default) | 3x8 | 3x6 |

**Acceptance Criteria:**
- Stage defaults to 0 (first stage) if user unsure
- Weight and stage are independent inputs
- T3 exercises have no stage selection (always 3x15+)

### [REQ-IMPORT-006] Step 8: Rotation Position

**Purpose:** Determine which day is next in the rotation.

**Process:**
1. Fetch recent workouts from Hevy (`GET /v1/workouts?pageSize=10`)
2. Attempt to detect last GZCLP workout:
   - Match by linked routine IDs (if user linked routines)
   - Match by exercise composition (T1+T2 pattern)
3. If detected: suggest next day in rotation
4. Display dropdown for user to confirm or override

**Display:**
- "Based on your recent workouts, your next day appears to be: **B1**"
- Dropdown: [A1] [B1] [A2] [B2]
- User selects correct day

**Detection Logic:**
```
IF last workout routine_id matches state.routineIds.A1 THEN suggest B1
IF last workout routine_id matches state.routineIds.B1 THEN suggest A2
IF last workout routine_id matches state.routineIds.A2 THEN suggest B2
IF last workout routine_id matches state.routineIds.B2 THEN suggest A1
IF no match found THEN default to A1, show "Could not detect - please select"
```

**Acceptance Criteria:**
- Detection is best-effort, user always has final say
- If no routines linked yet, skip detection, just show dropdown
- Default to A1 if detection fails

### [REQ-IMPORT-007] Step 9: Review & Create/Link

**Display:**
- Summary of all 4 days (exercises + weights + STAGES)
- Indicate which routines will be created vs linked
- Show next workout day

**On Confirm:**

*For linked routines:*
1. Update routine via `PUT /v1/routines/{id}` with current exercises/weights/stages
2. Store routine ID in state

*For new routines:*
1. Create routine via `POST /v1/routines`
2. Store returned routine ID in state

*For all:*
3. Initialize progression records with user-specified weights AND stages
4. Set `currentDay` to user-selected rotation position
5. Navigate to Dashboard

### [REQ-IMPORT-008] Progression Initialization (Import)

On import, initialize progression with user-specified stages:

```
progression[key] = {
  currentWeight: <entered weight>,
  stage: <selected stage>,           // 0, 1, or 2 from dropdown
  baseWeight: <entered weight>,      // Same as currentWeight
  lastWorkoutId: null,
  lastWorkoutDate: null,
  consecutiveFailures: 0,
  totalDeloads: 0,
  amrapRecord: 0
}
```

**Note:** `baseWeight` = `currentWeight` regardless of history. This simplifies import at the cost of slightly inaccurate first deload. Self-corrects after first deload cycle.

### 10.3 Import vs Setup Wizard Comparison

| Aspect | Setup Wizard | Import Flow |
|--------|--------------|-------------|
| Target User | New to GZCLP | Already doing GZCLP |
| Stage Selection | No (always Stage 0) | Yes (dropdown) |
| Routine Linking | No (always create) | Yes (link or create) |
| Rotation Detection | No (always A1) | Yes (infer + confirm) |
| Base Weight | = Starting weight | = Current weight |
| Steps | 7 | 9 |

---

## 11. Functional Requirements: Hevy API Integration

### [REQ-API-001] Authentication

| Field | Value |
|-------|-------|
| Base URL | `https://api.hevyapp.com` |
| Auth Header | `api-key: {user_api_key}` |
| Requirement | Hevy Pro subscription |

### [REQ-API-002] Read Operations

| Endpoint | Purpose | When Used |
|----------|---------|-----------|
| `GET /v1/exercise_templates` | Fetch exercise database | Setup Step 2, T3 selection |
| `GET /v1/workouts` | Fetch completed workouts | Sync |
| `GET /v1/routines` | Fetch existing routines | Setup Step 7 |

### [REQ-API-003] Write Operations

| Endpoint | Purpose | When Used |
|----------|---------|-----------|
| `POST /v1/routines` | Create routine | Setup Step 7 (new routines) |
| `PUT /v1/routines/{id}` | Update routine | Setup overwrite, progression updates |

**Note:** Hevy API does not support DELETE for routines. Existing routines are updated via PUT.

### [REQ-API-004] Workout Matching

The system SHALL match completed workouts to days using stored `routineId`.

**Process:**
1. Fetch workouts from Hevy
2. For each workout, check if `routine_id` matches any stored `routineIds.{A1|B1|A2|B2}`
3. If match found, associate workout with that day

**Acceptance Criteria:**
- Matching by `routineId` (not title)
- Survives routine title renames
- Unmatched workouts are ignored

### [REQ-API-005] Routine Naming

| Day | Routine Title |
|-----|---------------|
| A1 | `GZCLP Day A1` |
| B1 | `GZCLP Day B1` |
| A2 | `GZCLP Day A2` |
| B2 | `GZCLP Day B2` |

**Constraints:**
- No emojis
- No folders (API limitation)

### [REQ-API-006] Weight Unit Handling

The system SHALL store all weights in kilograms internally.

**Conversion:**
- If user selected lbs: convert to kg for storage and API
- Convert to display unit in UI only
- Formula: `kg = lbs × 0.453592`

**Acceptance Criteria:**
- Hevy API always receives `weight_kg`
- Progression calculations use kg
- UI displays user's preferred unit

---

## 12. Functional Requirements: Data Storage

### [REQ-DATA-001] Storage Method

The system SHALL use browser localStorage.

**Rationale:** No backend required, user owns data.

### [REQ-DATA-002] State Schema

```typescript
interface GZCLPState {
  apiKey: string;
  
  program: {
    name: string;                    // Always "GZCLP"
    createdAt: string;               // ISO date
    routineIds: {
      A1: string | null;             // Hevy routine ID
      B1: string | null;
      A2: string | null;
      B2: string | null;
    };
  };
  
  mainLifts: {
    squat: MainLiftConfig;
    benchPress: MainLiftConfig;
    ohp: MainLiftConfig;
    deadlift: MainLiftConfig;
  };
  
  dayAccessories: {
    A1: AccessoryConfig[];
    B1: AccessoryConfig[];
    A2: AccessoryConfig[];
    B2: AccessoryConfig[];
  };
  
  progression: {
    [key: string]: ProgressionState;
  };
  
  settings: {
    weightUnit: 'kg' | 'lbs';
    restTimers: {
      t1: number;                    // seconds
      t2: number;
      t3: number;
    };
  };
  
  currentDay: 'A1' | 'B1' | 'A2' | 'B2';
  lastSync: string | null;           // ISO date
}

interface MainLiftConfig {
  hevyTemplateId: string;
  name: string;                      // From Hevy template
  muscleGroup: 'upper' | 'lower';
}

interface AccessoryConfig {
  hevyTemplateId: string;
  name: string;
}

interface ProgressionState {
  currentWeight: number;             // kg
  stage: number;                     // 0, 1, or 2
  baseWeight: number;                // kg, for deload calc
  lastWorkoutId: string | null;
  lastWorkoutDate: string | null;
  consecutiveFailures: number;
  totalDeloads: number;
  amrapRecord: number;               // Best reps at current weight
}
```

### [REQ-DATA-003] Progression Keys

| Exercise Type | Key Format | Example |
|---------------|------------|---------|
| Main lift T1 | `{lift}_t1` | `squat_t1` |
| Main lift T2 | `{lift}_t2` | `squat_t2` |
| T3 Accessory | `t3_{hevyTemplateId}` | `t3_A1B2C3D4` |

---

## 13. Functional Requirements: Dashboard

### [REQ-DASH-001] Main Elements

| Element | Description |
|---------|-------------|
| Next Workout | Current day indicator (A1/B1/A2/B2) |
| Last Sync | Timestamp of last sync |
| Day Tabs | Selector for A1, B1, A2, B2 |
| Exercise Table | Per-day exercise list |
| Pending Changes | Calculated progressions awaiting confirmation |
| Start Workout | Button to Today's Workout Preview |

### [REQ-DASH-002] Exercise Table Columns

| Column | Description |
|--------|-------------|
| Exercise | Name from Hevy template |
| Tier | T1, T2, or T3 |
| Weight | Current weight (display unit) |
| Scheme | Current rep scheme (e.g., 5x3+) |
| Status | ✅ On track, ⚠️ Attention needed, 🔄 Pending change |

### [REQ-DASH-003] Quick Stats

| Stat | Calculation |
|------|-------------|
| Weeks on Program | `floor((now - createdAt) / 7 days)` |
| Total Workouts | Count of unique `lastWorkoutId` across progressions |
| Current Streak | Consecutive days with workouts (implementation detail) |
| Days Since Last | `floor(now - max(lastWorkoutDate))` |

---

## 14. Functional Requirements: Today's Workout Preview

### [REQ-TODAY-001] Access

The system SHALL provide a "Start Workout" button on Dashboard.

### [REQ-TODAY-002] Content Display Order

1. Header: Day name + date
2. Warmup sets (T1): collapsible, collapsed by default
3. T1 exercise: name, weight, scheme, AMRAP indicator
4. T2 exercise: name, weight, scheme
5. T3 exercises: list with weights
6. Estimated duration

### [REQ-TODAY-003] Estimated Duration Calculation

```
duration = 0
for each exercise:
  duration += sets × (set_time + rest_seconds)

Where:
  set_time = 30 seconds (estimated)
  rest_seconds = tier-specific (240/150/75)
```

### [REQ-TODAY-004] Actions

| Action | Behavior |
|--------|----------|
| Open in Hevy | Deep link to Hevy (if supported) |
| Copy Workout | Copy text summary to clipboard |
| Back | Return to Dashboard |

---

## 15. Functional Requirements: Sync

### [REQ-SYNC-001] Auto-Sync on App Open

The system SHALL automatically fetch workouts when Dashboard loads.

**Behavior:**
- Run in background (non-blocking UI)
- Trigger on Dashboard mount (not blocking render)
- Compare fetched workout IDs against stored `lastWorkoutId`
- If new workout detected: analyze and queue changes, show toast notification

**Toast Notification:**
- Message: "New workout detected"
- Duration: 5 seconds (auto-dismiss) or until clicked
- Action: Click toast to open Post-Workout Summary (slide-in panel)
- Position: Top-right of screen

### [REQ-SYNC-002] Manual Sync

The system SHALL provide a "Sync from Hevy" button.

### [REQ-SYNC-003] Sync Sequence

```
1. fetchWorkouts(apiKey, pageSize=10) → workouts[]
2. For each workout in workouts:
   a. matchedDay = findDayByRoutineId(workout.routine_id, state.routineIds)
   b. If matchedDay is null: skip
   c. If workout.id === progression[matchedDay].lastWorkoutId: skip (already processed)
   d. performance = extractPerformance(workout.exercises)
   e. changes = evaluateProgression(performance, progression)
   f. queueChanges(changes)
3. If changes.length > 0:
   a. showPostWorkoutSummary(changes)
4. updateLastSync(now)
```

### [REQ-SYNC-004] Sync State Indicators

| State | UI Indicator |
|-------|--------------|
| Syncing | Loading spinner on sync button |
| Up to date | "Last synced: X minutes ago" |
| New workout | Toast notification + badge: "1 new workout" |
| Pending changes | Yellow badge with count |
| Error | Red error message + **Retry** button (not just dismiss) |

**Error Retry Behavior:**
- Retry button triggers new sync attempt
- Show loading state during retry
- Clear error on successful retry

---

## 16. Functional Requirements: Post-Workout Summary

### [REQ-POST-001] Trigger & Presentation

Display after auto-sync detects new workout OR when user clicks toast notification.

**Presentation:** Slide-in panel from right side of screen
- Width: ~400px on desktop, full-width on mobile
- Overlay: Semi-transparent backdrop
- Animation: Slide in from right edge
- Dismissible: Click outside or X button to close

### [REQ-POST-002] Content

| Section | Description |
|---------|-------------|
| Header | "Workout Complete!" + day + date |
| Exercises | List with checkmarks |
| AMRAP Results | Reps achieved vs target |
| New PRs | Trophy icon + records beaten |
| Progressions | Up arrow + weight increases |
| Stage Changes | Cycle icon + scheme changes |
| Deloads | Warning icon + deload triggered |
| Streak | Fire icon + consecutive workouts |

### [REQ-POST-003] Tone

- Positive, motivational
- Celebrate small wins
- Frame deloads constructively: "Time to rebuild strength"

### [REQ-POST-004] Actions

| Action | Behavior |
|--------|----------|
| Review Changes | Open confirmation dialog (Section 17) |
| Dismiss | Close slide-in panel, return to Dashboard |

---

## 17. Functional Requirements: Confirmation

### [REQ-CONF-001] Confirmation Requirement

The system SHALL NOT update Hevy routines without explicit user confirmation.

### [REQ-CONF-002] Confirmation Dialog

**Presentation:** Separate modal dialog (not same as Post-Workout Summary)
- Triggered by: "Review Changes" button in Post-Workout Summary, OR "Update Hevy" button in Dashboard
- Centered modal with overlay
- Must explicitly confirm before Hevy API calls

**Content:**
| Element | Description |
|---------|-------------|
| Title | "Confirm Hevy Update" |
| Change List | Each pending change with current → new value |
| Reason | Why change triggered (success, failure, deload) |
| Cancel | Discard changes, close dialog |
| Confirm | Apply changes to Hevy |

### [REQ-CONF-003] On Confirm

1. For each changed exercise:
   a. Update progression record in state
   b. Build updated routine payload
2. Call `PUT /v1/routines/{id}` for affected routines
3. Save state to localStorage
4. **Advance `currentDay` to next in rotation** (A1→B1→A2→B2→A1)
5. Show success message
6. Close confirmation dialog and Post-Workout Summary (if open)

---

## 18. Error Handling

### [REQ-ERR-001] API Error Handling

| Error | Cause | User Message | Recovery |
|-------|-------|--------------|----------|
| 401 Unauthorized | Invalid API key | "API key invalid. Update in Settings." | Link to settings |
| 403 Forbidden | No Hevy Pro | "Hevy Pro required for API access." | Link to Hevy |
| 403 Routine Limit | Too many routines | "Routine limit exceeded in Hevy. Delete unused routines." | Link to Hevy |
| 404 Not Found | Routine deleted in Hevy | "Routine not found in Hevy. Re-run setup." | Link to setup |
| 429 Rate Limited | Too many requests | "Rate limited. Try again in 1 minute." | Auto-retry with backoff |
| 500+ Server Error | Hevy down | "Hevy unavailable. Try again later." | Retry button |
| Network Error | No connection | "No internet connection." | Retry button |

### [REQ-ERR-002] Validation Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| Weight ≤ 0 | Invalid input | "Weight must be greater than 0" |
| No T3 selected | Missing accessories | "Select at least 2 T3 exercises" |
| No template selected | Missing mapping | "Select an exercise for {lift}" |

### [REQ-ERR-003] Data Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| Corrupted state | localStorage issue | "Data corrupted. Reset program?" |
| Missing progression | State inconsistency | "Missing data for {exercise}. Re-sync?" |

---

## 19. Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Connectivity | Required | API-dependent |
| Weight Unit Default | kg | Hevy API uses kg |
| Minimum Weight | 20kg | Bar weight |
| Routine Folders | Not used | API limitation |
| Emojis in Names | Not allowed | Consistency |
| Offline Mode | Not supported | Defer to future |

---

## 20. Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| Responsive | Mobile-first, desktop support |
| UI Style | Simple table-based |
| Tech Stack | React, TypeScript, Vite, Tailwind CSS |
| Deployment | Local, self-hosted, cloud |
| Browser Support | Modern browsers (Chrome, Firefox, Safari, Edge) |
| localStorage Size | < 1MB typical |

---

## Appendix A: Hevy Routine Payload Example

```json
{
  "routine": {
    "title": "GZCLP Day A1",
    "folder_id": null,
    "notes": "",
    "exercises": [
      {
        "exercise_template_id": "D04AC939",
        "superset_id": null,
        "rest_seconds": 240,
        "notes": "T1 - 5x3+ (last set AMRAP)",
        "sets": [
          { "type": "warmup", "weight_kg": 20, "reps": 10 },
          { "type": "warmup", "weight_kg": 50, "reps": 5 },
          { "type": "warmup", "weight_kg": 70, "reps": 3 },
          { "type": "warmup", "weight_kg": 85, "reps": 2 },
          { "type": "normal", "weight_kg": 100, "reps": 3 },
          { "type": "normal", "weight_kg": 100, "reps": 3 },
          { "type": "normal", "weight_kg": 100, "reps": 3 },
          { "type": "normal", "weight_kg": 100, "reps": 3 },
          { "type": "normal", "weight_kg": 100, "reps": 3 }
        ]
      },
      {
        "exercise_template_id": "B1C2D3E4",
        "superset_id": null,
        "rest_seconds": 150,
        "notes": "T2 - 3x10",
        "sets": [
          { "type": "normal", "weight_kg": 60, "reps": 10 },
          { "type": "normal", "weight_kg": 60, "reps": 10 },
          { "type": "normal", "weight_kg": 60, "reps": 10 }
        ]
      },
      {
        "exercise_template_id": "C3D4E5F6",
        "superset_id": null,
        "rest_seconds": 75,
        "notes": "T3 - 3x15+ (last set AMRAP, target 25+ total reps)",
        "sets": [
          { "type": "normal", "weight_kg": 40, "reps": 15 },
          { "type": "normal", "weight_kg": 40, "reps": 15 },
          { "type": "normal", "weight_kg": 40, "reps": 15 }
        ]
      }
    ]
  }
}
```

**Note:** Warmup sets (type: "warmup") and working sets (type: "normal") are combined in a single exercise entry. Hevy displays them appropriately based on the `type` field.

---

## Appendix B: Calculation Formulas

### B.1 Deload Weight

```
function calculateDeload(baseWeight: number): number {
  let newWeight = baseWeight * 0.85;
  newWeight = Math.round(newWeight / 2.5) * 2.5;  // Round to 2.5
  newWeight = Math.max(newWeight, 20);             // Min bar weight
  return newWeight;
}
```

### B.2 Warmup Weights

```
function calculateWarmups(workingWeight: number): WarmupSet[] {
  const bar = 20;
  const percentages = [0.5, 0.7, 0.85];
  const reps = [5, 3, 2];
  
  const warmups: WarmupSet[] = [{ weight: bar, reps: 10 }];
  
  for (let i = 0; i < percentages.length; i++) {
    let weight = workingWeight * percentages[i];
    weight = Math.round(weight / 2.5) * 2.5;
    weight = Math.max(weight, bar);
    warmups.push({ weight, reps: reps[i] });
  }
  
  return warmups;
}
```

### B.3 Weight Unit Conversion

```
function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;  // 1 decimal
}

function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 100) / 100;  // 2 decimals
}
```

### B.4 Estimated Workout Duration

```
function estimateDuration(exercises: Exercise[]): number {
  const SET_TIME = 30;  // seconds per set
  let total = 0;
  
  for (const ex of exercises) {
    const rest = ex.tier === 'T1' ? 240 : ex.tier === 'T2' ? 150 : 75;
    total += ex.sets.length * (SET_TIME + rest);
  }
  
  return Math.ceil(total / 60);  // Return minutes
}
```
