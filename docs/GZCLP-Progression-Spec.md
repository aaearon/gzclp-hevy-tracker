# GZCLP Progression System - Functional Specification

**Version:** 1.0
**Date:** 2026-01-06
**Purpose:** Define the domain logic for GZCLP program progression and deload handling in a Hevy-integrated web application.

---

## 1. Overview

GZCLP (GZCL Linear Progression) is a beginner strength training program created by Cody Lefever. It uses a three-tier exercise structure with distinct progression and failure protocols for each tier.

### 1.1 Program Structure

The program consists of four workout days (A1, A2, B1, B2) performed on a rotating basis with at least one rest day between sessions.

| Day | Tier 1 | Tier 2 | Tier 3 |
|-----|--------|--------|--------|
| A1 | Squat | Bench Press | Lat Pulldown |
| A2 | Overhead Press | Deadlift | Dumbbell Row |
| B1 | Bench Press | Squat | Lat Pulldown |
| B2 | Deadlift | Overhead Press | Dumbbell Row |

### 1.2 Tier Definitions

| Tier | Purpose | Intensity | Rep Range |
|------|---------|-----------|-----------|
| T1 | Primary strength work | Heavy | Low (1-3 reps/set) |
| T2 | Secondary strength/hypertrophy | Moderate | Medium (6-10 reps/set) |
| T3 | Accessories/pump work | Light | High (15-25 reps/set) |

---

## 2. Tier 1 (T1) Progression Logic

### 2.1 Stage Definitions

| Stage | Sets × Reps | Total Volume Base | AMRAP |
|-------|-------------|-------------------|-------|
| 1 | 5×3+ | 15 reps | Last set |
| 2 | 6×2+ | 12 reps | Last set |
| 3 | 10×1+ | 10 reps | Last set |

### 2.2 Success Criteria

A T1 session is **successful** if the lifter completes all prescribed reps on **each individual set** (excluding AMRAP bonus reps).

- Stage 1 (5×3+): Each of the 5 sets must hit at least 3 reps
- Stage 2 (6×2+): Each of the 6 sets must hit at least 2 reps
- Stage 3 (10×1+): Each of the 10 sets must hit at least 1 rep

**Note:** This is a per-set check, not a total volume check. If any single set falls below the target, the workout is considered a failure even if total reps meet the volume base.

### 2.3 Weight Progression (On Success)

After each **successful** T1 session, increase weight for the next session:

| Exercise Type | Increment |
|---------------|-----------|
| Upper body (Bench Press, Overhead Press) | +5 lb (2.5 kg) |
| Lower body (Squat, Deadlift) | +10 lb (5 kg) |

### 2.4 Stage Progression (On Failure)

When a T1 session **fails** (lifter cannot complete minimum volume base):

```
Stage 1 (5×3+) --[fail]--> Stage 2 (6×2+) at SAME weight
Stage 2 (6×2+) --[fail]--> Stage 3 (10×1+) at SAME weight
Stage 3 (10×1+) --[fail]--> RESET (see 2.5)
```

**Important:** When moving to a new stage after failure, the weight stays the same. Weight only increases after a successful session.

### 2.5 Reset Protocol (After Stage 3 Failure)

When the lifter fails at Stage 3 (10×1+):

1. Rest 2-3 days
2. Test for a new 5 Rep Max (5RM)
3. Calculate new working weight: `new_weight = 5RM × 0.85`
4. Restart at Stage 1 (5×3+) with the new weight

### 2.6 Rest Periods

Recommended rest between T1 sets: **3-5 minutes**

---

## 3. Tier 2 (T2) Progression Logic

### 3.1 Stage Definitions

| Stage | Sets × Reps | Total Volume Base | AMRAP |
|-------|-------------|-------------------|-------|
| 1 | 3×10 | 30 reps | No |
| 2 | 3×8 | 24 reps | No |
| 3 | 3×6 | 18 reps | No |

### 3.2 Success Criteria

A T2 session is **successful** if the lifter completes all prescribed reps on **each individual set**.

- Stage 1 (3×10): Each of the 3 sets must hit at least 10 reps
- Stage 2 (3×8): Each of the 3 sets must hit at least 8 reps
- Stage 3 (3×6): Each of the 3 sets must hit at least 6 reps

**Note:** This is a per-set check, not a total volume check. If any single set falls below the target, the workout is considered a failure even if total reps meet the volume base.

### 3.3 Weight Progression (On Success)

After each **successful** T2 session, increase weight for the next session:

| Exercise Type | Increment |
|---------------|-----------|
| Upper body (Bench Press, Overhead Press) | +5 lb (2.5 kg) |
| Lower body (Squat, Deadlift) | +10 lb (5 kg) |

> **Note:** Some variations recommend halving T2 increments (+2.5 lb upper / +5 lb lower) since higher reps are more sensitive to weight jumps. This is optional.

### 3.4 Stage Progression (On Failure)

When a T2 session **fails** (lifter cannot complete minimum volume base):

```
Stage 1 (3×10) --[fail]--> Stage 2 (3×8) at SAME weight
Stage 2 (3×8) --[fail]--> Stage 3 (3×6) at SAME weight
Stage 3 (3×6) --[fail]--> RESET (see 3.5)
```

**Important:** When moving to a new stage after failure, the weight stays the same. Weight only increases after a successful session.

### 3.5 Reset Protocol (After Stage 3 Failure)

When the lifter fails at Stage 3 (3×6):

1. Calculate new working weight: `new_weight = current_weight × 0.85`
2. Round to nearest valid increment (2.5 kg or 5 lb)
3. Ensure weight is at least bar weight (20 kg / 44 lb)
4. Restart at Stage 1 (3×10) with the new weight

**Example:**
- Failed at 3×6 @ 100 kg
- Reset weight = 100 × 0.85 = 85 kg
- Restart at 3×10 @ 85 kg

**Note:** This uses the same 85% deload protocol as T1 for simplicity.

### 3.6 Rest Periods

Recommended rest between T2 sets: **2-3 minutes**

---

## 4. Tier 3 (T3) Progression Logic

### 4.1 Set/Rep Scheme

| Sets × Reps | AMRAP |
|-------------|-------|
| 3×15+ | Last set |

All three sets are Max Rep Sets (MRS) within a 15-25 rep target range, with the final set being AMRAP.

### 4.2 Success Criteria (Progression Trigger)

T3 progression is triggered when the lifter achieves **25 or more reps on the final AMRAP set**.

### 4.3 Weight Progression

When progression is triggered (25+ reps on AMRAP):

| Action | Increment |
|--------|-----------|
| Increase weight | Smallest available increment (typically 2.5-5 lb / 1-2.5 kg) |
| Reset rep target | Back to 15 reps |

### 4.4 No Failure Protocol

T3 exercises do **not** have stage progressions or failure protocols. The lifter simply:

1. Stays at the current weight until hitting 25+ on the AMRAP set
2. Increases weight by the smallest increment
3. Repeats

### 4.5 Rest Periods

Recommended rest between T3 sets: **1-1.5 minutes**

---

## 5. State Machine Representations

### 5.1 T1/T2 State Machine

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────┐   fail    ┌─────────┐   fail   ┌─────────┐│
│  │ Stage 1 │ ───────── │ Stage 2 │ ──────── │ Stage 3 ││
│  │         │           │         │          │         ││
│  └────┬────┘           └────┬────┘          └────┬────┘│
│       │                     │                    │     │
│       │ success             │ success            │     │
│       │ (+weight)           │ (+weight)          │     │
│       │                     │                    │     │
│       ▼                     ▼                    │     │
│  ┌─────────┐           ┌─────────┐              │     │
│  │ Stage 1 │           │ Stage 2 │              │     │
│  │ (+wgt)  │           │ (+wgt)  │              │     │
│  └─────────┘           └─────────┘              │     │
│                                                  │     │
│                                          fail    │     │
│                                                  ▼     │
│                                            ┌─────────┐ │
│                                            │  RESET  │ │
│                                            │         │ │
│                                            └────┬────┘ │
│                                                 │      │
│                                                 │      │
│                              ┌──────────────────┘      │
│                              │                         │
│                              ▼                         │
│                         ┌─────────┐                    │
│                         │ Stage 1 │                    │
│                         │(new wgt)│                    │
│                         └─────────┘                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 5.2 T3 State Machine

```
┌──────────────────────────────────────┐
│                                      │
│  ┌──────────────┐                    │
│  │   Current    │                    │
│  │   Weight     │◄───────────┐       │
│  └──────┬───────┘            │       │
│         │                    │       │
│         │ AMRAP < 25         │       │
│         │                    │       │
│         ▼                    │       │
│  ┌──────────────┐            │       │
│  │    Stay      │────────────┘       │
│  │  (same wgt)  │                    │
│  └──────────────┘                    │
│                                      │
│         │ AMRAP >= 25                │
│         │                            │
│         ▼                            │
│  ┌──────────────┐                    │
│  │   Progress   │                    │
│  │  (+smallest) │                    │
│  └──────────────┘                    │
│                                      │
└──────────────────────────────────────┘
```

---

## 6. Data Model Requirements

### 6.1 Exercise State

For each exercise, the system must track:

```
{
  exercise_id: string,
  exercise_name: string,
  tier: "T1" | "T2" | "T3",
  current_stage: 0 | 1 | 2,          // T1/T2 only (0-indexed internally)
  current_weight: number,
  weight_unit: "lb" | "kg",
  base_weight: number,               // Weight after last reset (for reference)
  exercise_type: "upper" | "lower",  // Determines increment size
}
```

### 6.2 Session Result

For each completed session:

```
{
  session_id: string,
  exercise_id: string,
  date: timestamp,
  prescribed_sets: number,
  prescribed_reps: number,
  completed_reps: number[],          // Array of reps per set
  total_reps: number,
  amrap_reps: number,                // Final set reps (for T1/T3)
  weight: number,
  success: boolean,
  stage_at_time: 1 | 2 | 3,
}
```

### 6.3 Progression Event Log

```
{
  event_id: string,
  exercise_id: string,
  date: timestamp,
  event_type: "weight_increase" | "stage_change" | "reset",
  from_weight: number,
  to_weight: number,
  from_stage: number,
  to_stage: number,
  reason: string,
}
```

---

## 7. Business Rules Summary

### 7.1 T1 Rules

| Rule ID | Condition | Action |
|---------|-----------|--------|
| T1-01 | Success at any stage | Increase weight by increment, stay at current stage |
| T1-02 | Failure at Stage 1 or 2 | Move to next stage, keep same weight |
| T1-03 | Failure at Stage 3 | Trigger reset: test 5RM, use 85%, restart Stage 1 |
| T1-04 | Upper body exercise | Increment = 5 lb (2.5 kg) |
| T1-05 | Lower body exercise | Increment = 10 lb (5 kg) |

### 7.2 T2 Rules

| Rule ID | Condition | Action |
|---------|-----------|--------|
| T2-01 | Success at any stage | Increase weight by increment, stay at current stage |
| T2-02 | Failure at Stage 1 or 2 | Move to next stage, keep same weight |
| T2-03 | Failure at Stage 3 | Trigger reset: deload to 85% of current weight, restart Stage 1 |
| T2-04 | Upper body exercise | Increment = 5 lb (2.5 kg) |
| T2-05 | Lower body exercise | Increment = 10 lb (5 kg) |

### 7.3 T3 Rules

| Rule ID | Condition | Action |
|---------|-----------|--------|
| T3-01 | AMRAP set < 25 reps | No change, repeat same weight next session |
| T3-02 | AMRAP set >= 25 reps | Increase weight by smallest increment |
| T3-03 | Weight increase | Increment = smallest available (typically 2.5-5 lb) |

---

## 8. Edge Cases and Clarifications

### 8.1 AMRAP Definition

- AMRAP = "As Many Reps As Possible"
- Should NOT be taken to absolute muscular failure
- Stop when bar speed slows significantly or 1-2 reps remain "in the tank"

### 8.2 What Counts as Failure?

- **T1:** Any prescribed set falls below the target reps (e.g., a set with only 2 reps in a 5×3+ scheme)
- **T2:** Any prescribed set falls below the target reps (e.g., a set with only 9 reps in a 3×10 scheme)
- **T3:** No failure state exists (T3 exercises only repeat at same weight if AMRAP < 25)

### 8.3 Partial Set Completion

If a lifter completes some but not all reps in a set:
- **T1/T2:** The set is marked as failed if it falls below the target reps. Since success is determined per-set, a single failed set means the entire workout fails regardless of other sets' performance.
- **T3:** Only the final AMRAP set matters for progression. Earlier sets do not affect the success/failure determination.

### 8.4 Skipped Sessions

If a user skips a session or takes extended time off:
- The system should retain the last state
- User resumes at the same weight/stage
- Consider prompting for a conservative deload if absence > 2 weeks

### 8.5 Exercise Substitutions

If user substitutes exercises (e.g., front squat for back squat):
- Treat as a separate exercise with its own progression state
- Same tier rules apply

---

## 9. References

- [GZCLP Infographic](https://saynotobroscience.com/gzclp-infographic/) - Say No To Bro Science
- [The Fitness Wiki - GZCLP](https://thefitness.wiki/routines/gzclp/)
- [Original Reddit Post by u/gzcl](https://old.reddit.com/r/Fitness/comments/44hnbc/strength_training_using_the_gzcl_method_from/)
- [Cody Lefever's Blog](http://swoleateveryheight.blogspot.com/)

---

## 10. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-06 | — | Initial specification |