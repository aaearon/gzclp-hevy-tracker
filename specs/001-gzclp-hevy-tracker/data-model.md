# Data Model: GZCLP Hevy Tracker

**Date**: 2026-01-02
**Branch**: `001-gzclp-hevy-tracker`

## Entity Relationship Diagram

```
┌─────────────────────┐
│  ProgramConfig      │
│  (singleton)        │
├─────────────────────┤
│ version: string     │
│ apiKey: string      │
│ weightUnit: 'kg'|'lbs'│
│ createdAt: string   │
│ lastSync: string?   │
└─────────┬───────────┘
          │ 1
          │
          │ has many
          ▼
┌─────────────────────┐       ┌─────────────────────┐
│  ExerciseConfig     │──────▶│  ProgressionState   │
│                     │  1:1  │                     │
├─────────────────────┤       ├─────────────────────┤
│ id: string          │       │ exerciseId: string  │
│ hevyTemplateId: str │       │ currentWeight: num  │
│ name: string        │       │ stage: 0|1|2        │
│ tier: T1|T2|T3      │       │ baseWeight: number  │
│ slot: GZCLPSlot     │       │ lastWorkoutId: str? │
│ muscleGroup: upper  │       │ lastWorkoutDate: str?│
│   | lower           │       │ amrapRecord: number │
└─────────────────────┘       └─────────────────────┘
          │
          │ may have
          ▼
┌─────────────────────┐
│  PendingChange      │
│                     │
├─────────────────────┤
│ exerciseId: string  │
│ type: 'progress'    │
│   | 'stage_change'  │
│   | 'deload'        │
│   | 'repeat'        │
│ currentWeight: num  │
│ currentStage: 0|1|2 │
│ newWeight: number   │
│ newStage: 0|1|2     │
│ reason: string      │
│ workoutId: string   │
│ createdAt: string   │
└─────────────────────┘
```

## Core Entities

### 1. GZCLPState (Root)

The root state object stored in localStorage under key `gzclp_state`.

```typescript
interface GZCLPState {
  version: string;           // Schema version for migrations (e.g., "1.0.0")
  apiKey: string;            // Hevy API key

  program: ProgramConfig;
  exercises: Record<string, ExerciseConfig>;  // Keyed by exercise ID
  progression: Record<string, ProgressionState>;  // Keyed by exercise ID
  pendingChanges: PendingChange[];

  settings: UserSettings;
  lastSync: string | null;   // ISO timestamp
}
```

**Validation Rules**:
- `version` must be semver format
- `apiKey` must be non-empty when program is configured
- `exercises` and `progression` must have matching keys

### 2. ProgramConfig

Represents the overall GZCLP program configuration.

```typescript
interface ProgramConfig {
  name: string;              // User-defined name (default: "My GZCLP Program")
  createdAt: string;         // ISO timestamp
  hevyRoutineIds: {
    A1: string | null;       // Hevy routine ID for Day A1
    B1: string | null;       // Hevy routine ID for Day B1
    A2: string | null;       // Hevy routine ID for Day A2
    B2: string | null;       // Hevy routine ID for Day B2
  };
  currentDay: 'A1' | 'B1' | 'A2' | 'B2';  // Next workout to perform
}
```

**State Transitions**:
- `currentDay` cycles: A1 → B1 → A2 → B2 → A1 (after each completed workout)

### 3. ExerciseConfig

Represents a user's assignment of an exercise to a GZCLP slot.

```typescript
type GZCLPSlot =
  | 't1_squat' | 't1_bench' | 't1_ohp' | 't1_deadlift'
  | 't2_squat' | 't2_bench' | 't2_ohp' | 't2_deadlift'
  | 't3_1' | 't3_2' | 't3_3';

type Tier = 'T1' | 'T2' | 'T3';
type MuscleGroup = 'upper' | 'lower';

interface ExerciseConfig {
  id: string;                // Internal UUID
  hevyTemplateId: string;    // Hevy exercise_template_id
  name: string;              // Display name (from Hevy)
  tier: Tier;
  slot: GZCLPSlot;
  muscleGroup: MuscleGroup;
}
```

**Validation Rules**:
- Each slot can have at most one exercise assigned
- `muscleGroup` determines weight increment (upper: 2.5kg/5lb, lower: 5kg/10lb)
- T1/T2 slots are day-specific; T3 slots apply to all days

**Slot to Day Mapping**:
| Day | T1 | T2 |
|-----|----|----|
| A1 | t1_squat | t2_bench |
| B1 | t1_ohp | t2_deadlift |
| A2 | t1_bench | t2_squat |
| B2 | t1_deadlift | t2_ohp |

### 4. ProgressionState

Represents the current progression status for an exercise.

```typescript
interface ProgressionState {
  exerciseId: string;        // References ExerciseConfig.id
  currentWeight: number;     // Current working weight
  stage: 0 | 1 | 2;          // Current rep scheme stage
  baseWeight: number;        // Weight used for deload calculation
  lastWorkoutId: string | null;
  lastWorkoutDate: string | null;  // ISO timestamp
  amrapRecord: number;       // Best AMRAP reps at current weight
}
```

**Stage Schemes by Tier**:

| Tier | Stage 0 | Stage 1 | Stage 2 |
|------|---------|---------|---------|
| T1 | 5x3+ | 6x2+ | 10x1+ |
| T2 | 3x10 | 3x8 | 3x6 |
| T3 | 3x15+ | N/A | N/A |

**State Transitions**:
- **Success at T1/T2**: `currentWeight += increment`, `stage` unchanged
- **Failure at T1/T2 stage 0-1**: `stage += 1`
- **Failure at T1/T2 stage 2**: `stage = 0`, `currentWeight = baseWeight * 0.85` (rounded)
- **Success at T3 (25+ reps)**: `currentWeight += increment`
- **Failure at T3**: No change (repeat weight)

**Deload Rounding**:
- kg: Round to nearest 2.5kg (e.g., 85% of 100kg = 85kg, 85% of 97.5kg = 82.875kg → 82.5kg)
- lbs: Round to nearest 5lb (e.g., 85% of 225lb = 191.25lb → 190lb)

### 5. PendingChange

Represents a calculated progression recommendation awaiting user confirmation.

```typescript
type ChangeType = 'progress' | 'stage_change' | 'deload' | 'repeat';

interface PendingChange {
  id: string;                // UUID for this change
  exerciseId: string;        // References ExerciseConfig.id
  exerciseName: string;      // Denormalized for display
  tier: Tier;
  type: ChangeType;

  currentWeight: number;
  currentStage: 0 | 1 | 2;
  newWeight: number;
  newStage: 0 | 1 | 2;
  newScheme: string;         // e.g., "5x3+", "6x2+", "3x10"

  reason: string;            // Human-readable explanation
  workoutId: string;         // Hevy workout that triggered this
  workoutDate: string;       // ISO timestamp
  createdAt: string;         // ISO timestamp
}
```

**Change Type Descriptions**:
| Type | Description |
|------|-------------|
| `progress` | Weight increase (success) |
| `stage_change` | Move to next rep scheme (failure) |
| `deload` | Reset to 85% and stage 0 (final stage failure) |
| `repeat` | Keep same weight (T3 under 25 reps) |

### 6. UserSettings

User preferences for the application.

```typescript
interface UserSettings {
  weightUnit: 'kg' | 'lbs';
  increments: {
    upper: number;           // Default: 2.5 (kg) or 5 (lbs)
    lower: number;           // Default: 5 (kg) or 10 (lbs)
  };
  restTimers: {
    t1: number;              // Seconds, default: 180 (3 min)
    t2: number;              // Seconds, default: 120 (2 min)
    t3: number;              // Seconds, default: 60 (1 min)
  };
}
```

## Hevy API Types

> **Nullability Note**: Hevy API returns nullable fields (`weight_kg: number | null`, `reps: number | null`).
> Application code MUST handle null values - treat null weight as 0 for bodyweight exercises,
> treat null reps as 0 (failed set).

### WorkoutFromHevy

Response structure when fetching completed workouts.

```typescript
interface WorkoutFromHevy {
  id: string;
  title: string;
  start_time: string;        // ISO timestamp
  end_time: string;          // ISO timestamp
  exercises: HevyExercise[];
}

interface HevyExercise {
  exercise_template_id: string;
  title: string;
  sets: HevySet[];
}

interface HevySet {
  type: 'normal' | 'warmup' | 'dropset';
  weight_kg: number;
  reps: number;
}
```

### RoutineToHevy

Payload structure when creating/updating Hevy routines.

```typescript
interface RoutineToHevy {
  routine: {
    title: string;           // e.g., "GZCLP A1"
    folder_id: number | null;
    notes: string;
    exercises: RoutineExercise[];
  };
}

interface RoutineExercise {
  exercise_template_id: string;
  superset_id: null;
  rest_seconds: number;
  notes: string;             // e.g., "T1 - 5x3+"
  sets: RoutineSet[];
}

interface RoutineSet {
  type: 'normal';
  weight_kg: number;
  reps: number;
}
```

## localStorage Schema

**Key**: `gzclp_state`

```json
{
  "version": "1.0.0",
  "apiKey": "user-api-key-here",
  "program": {
    "name": "My GZCLP Program",
    "createdAt": "2026-01-02T10:00:00Z",
    "hevyRoutineIds": {
      "A1": "routine-uuid-1",
      "B1": "routine-uuid-2",
      "A2": "routine-uuid-3",
      "B2": "routine-uuid-4"
    },
    "currentDay": "A1"
  },
  "exercises": {
    "ex-001": {
      "id": "ex-001",
      "hevyTemplateId": "hevy-template-uuid",
      "name": "Squat (Barbell)",
      "tier": "T1",
      "slot": "t1_squat",
      "muscleGroup": "lower"
    }
  },
  "progression": {
    "ex-001": {
      "exerciseId": "ex-001",
      "currentWeight": 100,
      "stage": 0,
      "baseWeight": 100,
      "lastWorkoutId": null,
      "lastWorkoutDate": null,
      "amrapRecord": 0
    }
  },
  "pendingChanges": [],
  "settings": {
    "weightUnit": "kg",
    "increments": { "upper": 2.5, "lower": 5 },
    "restTimers": { "t1": 180, "t2": 120, "t3": 60 }
  },
  "lastSync": null
}
```

## Migration Strategy

When `version` in stored state is less than current app version:

1. Read stored state
2. Apply migration functions in sequence
3. Update `version` field
4. Save migrated state

```typescript
const MIGRATIONS: Record<string, (state: unknown) => unknown> = {
  '1.0.0': (state) => state,  // Initial version, no migration needed
  // Future migrations:
  // '1.1.0': (state) => ({ ...state, newField: defaultValue }),
};
```
