# Data Model: Separate T1 and T2 Progression Tracking

**Feature**: 005-t1-t2-progression
**Date**: 2026-01-03

## Overview

This feature modifies how progression state is keyed in localStorage. The structure of `ProgressionState` remains unchanged; only the key format changes for main lifts.

## Type Definitions

### New Types

```typescript
// src/types/state.ts

/**
 * Progression key format for main lifts (role-tier) and T3 exercises (exerciseId)
 */
export type ProgressionKey =
  | `${MainLiftRole}-T1`
  | `${MainLiftRole}-T2`
  | string  // exerciseId for T3

/**
 * Main lift T1/T2 weight pair detected during import
 */
export interface MainLiftWeights {
  role: MainLiftRole
  t1: {
    weight: number
    source: string  // e.g., "Day A1, position 1"
    stage: Stage
  }
  t2: {
    weight: number
    source: string  // e.g., "Day A2, position 2"
    stage: Stage
  }
  hasWarning: boolean  // True if only one tier detected
}
```

### Modified Types

```typescript
// src/types/state.ts - GZCLPState (no structural change, semantic change only)

export interface GZCLPState {
  // ... existing fields unchanged ...

  /**
   * Progression states keyed by ProgressionKey:
   * - Main lifts: "squat-T1", "squat-T2", "bench-T1", etc.
   * - T3 exercises: exerciseId (uuid)
   */
  progression: Record<ProgressionKey, ProgressionState>
}
```

### ProgressionState (Unchanged)

```typescript
// No changes - structure is already correct
export interface ProgressionState {
  exerciseId: string      // Note: For main lifts, this will be the role name
  currentWeight: number
  stage: Stage            // 0, 1, or 2
  baseWeight: number
  lastWorkoutId: string | null
  lastWorkoutDate: string | null
  amrapRecord: number
}
```

## Key Generation

### Function: getProgressionKey

```typescript
// src/lib/role-utils.ts

/**
 * Generate the progression storage key for an exercise.
 *
 * @param exerciseId - The exercise's unique ID (uuid)
 * @param role - The exercise's role (if assigned)
 * @param tier - The current tier context (T1/T2/T3)
 * @returns The key to use in the progression record
 *
 * @example
 * getProgressionKey("uuid-123", "squat", "T1") // returns "squat-T1"
 * getProgressionKey("uuid-456", "squat", "T2") // returns "squat-T2"
 * getProgressionKey("uuid-789", "t3", "T3")    // returns "uuid-789"
 * getProgressionKey("uuid-000", undefined, "T3") // returns "uuid-000"
 */
export function getProgressionKey(
  exerciseId: string,
  role: ExerciseRole | undefined,
  tier: Tier
): ProgressionKey {
  // Main lifts with T1/T2 context use role-tier key
  if (role && isMainLiftRole(role) && (tier === 'T1' || tier === 'T2')) {
    return `${role}-${tier}` as ProgressionKey
  }
  // T3 exercises and non-main-lifts use exerciseId
  return exerciseId
}
```

## Entity Relationships

```
┌─────────────────────┐
│    GZCLPState       │
├─────────────────────┤
│ progression         │◄──────────────────────────────────┐
│   Record<Key,State> │                                   │
└─────────────────────┘                                   │
                                                          │
         ┌────────────────────────────────────────────────┤
         │                                                │
         ▼                                                │
┌─────────────────────┐      ┌─────────────────────┐     │
│ ProgressionState    │      │    ProgressionKey   │     │
├─────────────────────┤      ├─────────────────────┤     │
│ exerciseId: string  │      │ Main Lifts:         │─────┘
│ currentWeight       │      │   "squat-T1"        │
│ stage: 0|1|2        │      │   "squat-T2"        │
│ baseWeight          │      │   "bench-T1"        │
│ lastWorkoutId       │      │   "bench-T2"        │
│ lastWorkoutDate     │      │   "ohp-T1"          │
│ amrapRecord         │      │   "ohp-T2"          │
└─────────────────────┘      │   "deadlift-T1"     │
                             │   "deadlift-T2"     │
                             │ T3 Exercises:       │
                             │   {exerciseId}      │
                             └─────────────────────┘
```

## State Transitions

### Progression State Machine

```
                    ┌────────────────────────────────────┐
                    │                                    │
                    ▼                                    │
            ┌───────────────┐                           │
  ┌────────►│   Stage 0     │                           │
  │         │ T1: 5x3+      │                           │
  │         │ T2: 3x10      │                           │
  │         └───────┬───────┘                           │
  │                 │ FAIL (reps not met)               │
  │                 ▼                                   │
  │         ┌───────────────┐                           │
  │         │   Stage 1     │                           │
  │         │ T1: 6x2+      │                           │
  │         │ T2: 3x8       │                           │
  │         └───────┬───────┘                           │
  │                 │ FAIL                              │
  │                 ▼                                   │
  │         ┌───────────────┐                           │
  │         │   Stage 2     │                           │
  │         │ T1: 10x1+     │                           │
  │         │ T2: 3x6       │                           │
  │         └───────┬───────┘                           │
  │                 │ FAIL                              │
  │                 ▼                                   │
  │         ┌───────────────┐                           │
  └─────────│   DELOAD      │───────────────────────────┘
            │ weight *= 0.85│
            │ stage = 0     │
            └───────────────┘

Key: Each state transition ONLY affects the specific
     ProgressionKey (e.g., "squat-T1" or "squat-T2"),
     never both.
```

### Success Path (Weight Increase)

```
  Stage 0 ──► SUCCESS ──► weight += increment
              │           stage stays at 0
              │
              └─► (stays in Stage 0, but heavier)
```

## Validation Rules

### Weight Input Validation

| Field | Type | Validation | Error Message |
|-------|------|------------|---------------|
| weight | number | Required | "Weight is required" |
| weight | number | > 0 | "Must be greater than 0" |
| weight | number | ≤ 500 | "Weight seems too high" |
| weight | number | Numeric | "Must be a number" |

### T1/T2 Relationship (Warning Only)

| Condition | Warning Message |
|-----------|-----------------|
| T2 ≥ T1 | "T2 is usually lighter than T1 - please verify" |
| T2 < T1 × 0.5 | "T2 seems very light compared to T1 - please verify" |

## Storage Schema

### localStorage Key: `gzclp_state`

```json
{
  "version": "1.0.0",
  "apiKey": "***",
  "program": {
    "name": "My GZCLP",
    "currentDay": "A1",
    "hevyRoutineIds": { "A1": "id1", "B1": "id2", "A2": "id3", "B2": "id4" }
  },
  "exercises": {
    "uuid-squat": { "id": "uuid-squat", "name": "Squat", "role": "squat" },
    "uuid-bench": { "id": "uuid-bench", "name": "Bench Press", "role": "bench" }
  },
  "progression": {
    "squat-T1": {
      "exerciseId": "squat",
      "currentWeight": 100,
      "stage": 0,
      "baseWeight": 60,
      "lastWorkoutId": "workout-123",
      "lastWorkoutDate": "2026-01-03T10:00:00Z",
      "amrapRecord": 7
    },
    "squat-T2": {
      "exerciseId": "squat",
      "currentWeight": 70,
      "stage": 0,
      "baseWeight": 42,
      "lastWorkoutId": "workout-456",
      "lastWorkoutDate": "2026-01-02T10:00:00Z",
      "amrapRecord": 0
    },
    "bench-T1": { "exerciseId": "bench", "currentWeight": 60, "stage": 1, "..." : "..." },
    "bench-T2": { "exerciseId": "bench", "currentWeight": 42, "stage": 0, "..." : "..." },
    "ohp-T1": { "..." : "..." },
    "ohp-T2": { "..." : "..." },
    "deadlift-T1": { "..." : "..." },
    "deadlift-T2": { "..." : "..." },
    "uuid-lat-pulldown": { "exerciseId": "uuid-lat-pulldown", "..." : "..." }
  },
  "pendingChanges": [],
  "settings": { "weightUnit": "kg", "..." : "..." },
  "lastSync": null
}
```

## Import Data Flow

### Detection Phase

```
Hevy Routines
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ For each main lift role:                                    │
│   T1 weight ← Day where role is T1, position 1              │
│   T2 weight ← Day where role is T2, position 2              │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
MainLiftWeights[] (4 entries, one per role)
     │
     ▼
Verification Step (User confirms/edits/swaps)
     │
     ▼
8 ProgressionState entries created
```

### Day-Role Mapping Reference

| Role | T1 Day | T2 Day |
|------|--------|--------|
| squat | A1 | A2 |
| bench | A2 | A1 |
| ohp | B1 | B2 |
| deadlift | B2 | B1 |
