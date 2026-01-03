# Data Model: Routine Selection Wizard

**Date**: 2026-01-03
**Branch**: `002-routine-selection-wizard`

## Overview

This document defines new types and extensions for the routine selection wizard feature. These types are used during the setup wizard import flow and are not persisted to localStorage (the final state is stored using existing `GZCLPState` types).

## Entity Relationship Diagram

```
┌─────────────────────┐
│  RoutineSourceChoice │  (wizard step 2)
├─────────────────────┤
│ mode: 'create'      │
│      | 'import'     │
└─────────┬───────────┘
          │
          │ if 'import'
          ▼
┌─────────────────────┐       ┌─────────────────────┐
│  RoutineAssignment  │──────▶│  AvailableRoutine   │
│  (4 slots)          │  1:1  │  (from Hevy API)    │
├─────────────────────┤       ├─────────────────────┤
│ A1: routineId | null│       │ id: string          │
│ B1: routineId | null│       │ title: string       │
│ A2: routineId | null│       │ exerciseCount: num  │
│ B2: routineId | null│       │ exercisePreview: [] │
└─────────┬───────────┘       │ updatedAt: string   │
          │                   └─────────────────────┘
          │ extraction
          ▼
┌─────────────────────┐
│  ImportedExercise   │  (per slot)
├─────────────────────┤
│ slot: GZCLPSlot     │
│ templateId: string  │
│ name: string        │
│ detectedWeight: num │
│ detectedStage: 0|1|2│       ┌─────────────────────┐
│ stageConfidence:    │──────▶│  StageConfidence    │
│   'high'|'manual'   │       │  'high' | 'manual'  │
│ originalSetCount: n │       └─────────────────────┘
│ originalRepScheme: s│
└─────────────────────┘
```

## New Types

### 1. RoutineSourceChoice

Tracks user's choice between creating new routines or importing existing ones.

```typescript
type RoutineSourceMode = 'create' | 'import';

interface RoutineSourceChoice {
  mode: RoutineSourceMode;
  hasExistingRoutines: boolean;  // Controls whether 'import' option is available
}
```

**Validation Rules**:
- `mode` must be 'create' if `hasExistingRoutines` is false

### 2. AvailableRoutine

Summary of a Hevy routine for display in the selector.

```typescript
interface AvailableRoutine {
  id: string;                    // Hevy routine ID
  title: string;                 // Routine name
  exerciseCount: number;         // Number of exercises in routine
  exercisePreview: string[];     // First 2-3 exercise names for context
  updatedAt: string;             // ISO timestamp, for sorting
}
```

**Derivation**: Computed from `Routine` API response:
```typescript
function toAvailableRoutine(routine: Routine): AvailableRoutine {
  return {
    id: routine.id,
    title: routine.title,
    exerciseCount: routine.exercises.length,
    exercisePreview: routine.exercises.slice(0, 3).map(e => e.title),
    updatedAt: routine.updated_at,
  };
}
```

### 3. RoutineAssignment

User's mapping of Hevy routines to GZCLP days.

```typescript
interface RoutineAssignment {
  A1: string | null;  // Hevy routine ID or null if unassigned
  B1: string | null;
  A2: string | null;
  B2: string | null;
}
```

**Validation Rules**:
- At least one day must be assigned to proceed
- Same routine ID for multiple days is allowed but triggers a warning

### 4. StageConfidence

Indicates whether stage was auto-detected or requires user input.

```typescript
type StageConfidence = 'high' | 'manual';
```

- `'high'`: Set/rep scheme matched a known GZCLP pattern
- `'manual'`: Scheme didn't match; user must confirm stage

### 5. ImportedExercise

Represents an exercise extracted from a routine, pending user confirmation.

```typescript
interface ImportedExercise {
  slot: GZCLPSlot;              // Target slot (t1_squat, t2_bench, t3_1, etc.)
  templateId: string;            // Hevy exercise_template_id
  name: string;                  // Exercise name (from Hevy)

  // Detected values (can be overridden by user)
  detectedWeight: number;        // Weight in kg (converted if needed)
  detectedStage: 0 | 1 | 2;      // Detected progression stage
  stageConfidence: StageConfidence;

  // Original routine data (for display in review)
  originalSetCount: number;      // e.g., 5 for 5x3
  originalRepScheme: string;     // e.g., "5x3+" or "3x10"

  // User overrides (set during review)
  userWeight?: number;           // User-corrected weight
  userStage?: 0 | 1 | 2;         // User-corrected stage
}
```

**Derived Values for Display**:
```typescript
function getConfirmedWeight(ex: ImportedExercise): number {
  return ex.userWeight ?? ex.detectedWeight;
}

function getConfirmedStage(ex: ImportedExercise): 0 | 1 | 2 {
  return ex.userStage ?? ex.detectedStage;
}
```

### 6. ImportResult

Complete result of extraction from assigned routines.

```typescript
interface ImportResult {
  exercises: ImportedExercise[];
  warnings: ImportWarning[];
  routineIds: RoutineAssignment;
}

interface ImportWarning {
  type: 'no_t2' | 'stage_unknown' | 'duplicate_routine' | 'weight_null';
  day?: GZCLPDay;
  slot?: GZCLPSlot;
  message: string;
}
```

**Warning Types**:
| Type | Trigger | Message Example |
|------|---------|-----------------|
| `no_t2` | Routine has <2 exercises | "A1: No T2 exercise found. Assign manually." |
| `stage_unknown` | Rep scheme doesn't match GZCLP | "Squat: 4x5 detected. Please select stage." |
| `duplicate_routine` | Same routine for 2+ days | "Same routine selected for A1 and A2." |
| `weight_null` | Set weight is null | "Lat Pulldown: No weight found. Set to 0." |

### 7. NextWorkoutChoice

User's selection of which day to start with.

```typescript
type NextWorkoutChoice = GZCLPDay;  // 'A1' | 'B1' | 'A2' | 'B2'
```

## Slot Mapping Constants

Fixed mapping from day + position to GZCLP slot:

```typescript
const SLOT_MAPPING: Record<GZCLPDay, { t1: GZCLPSlot; t2: GZCLPSlot }> = {
  A1: { t1: 't1_squat', t2: 't2_bench' },
  B1: { t1: 't1_ohp', t2: 't2_deadlift' },
  A2: { t1: 't1_bench', t2: 't2_squat' },
  B2: { t1: 't1_deadlift', t2: 't2_ohp' },
};

// T3 slots are shared across all days
const T3_SLOTS: GZCLPSlot[] = ['t3_1', 't3_2', 't3_3'];
```

## Stage Detection Constants

```typescript
// T1 stage patterns: (setCount, repCount) => stage
const T1_STAGE_PATTERNS: [number, number, 0 | 1 | 2][] = [
  [5, 3, 0],   // 5x3+ = Stage 1 (index 0)
  [6, 2, 1],   // 6x2+ = Stage 2 (index 1)
  [10, 1, 2],  // 10x1+ = Stage 3 (index 2)
];

// T2 stage patterns
const T2_STAGE_PATTERNS: [number, number, 0 | 1 | 2][] = [
  [3, 10, 0],  // 3x10 = Stage 1 (index 0)
  [3, 8, 1],   // 3x8 = Stage 2 (index 1)
  [3, 6, 2],   // 3x6 = Stage 3 (index 2)
];

// Display names for stages
const STAGE_DISPLAY: Record<0 | 1 | 2, string> = {
  0: 'Stage 1',
  1: 'Stage 2',
  2: 'Stage 3',
};
```

## Import Workflow State

Complete state for the import wizard flow:

```typescript
interface ImportWorkflowState {
  // Step 1: Source choice
  sourceChoice: RoutineSourceChoice | null;

  // Step 2: Available routines (loaded from API)
  availableRoutines: AvailableRoutine[];
  isLoadingRoutines: boolean;
  loadError: string | null;

  // Step 3: Routine assignment
  assignment: RoutineAssignment;

  // Step 4: Extraction result
  importResult: ImportResult | null;
  isExtracting: boolean;

  // Step 5: Next workout selection
  nextWorkout: NextWorkoutChoice;
}
```

## Conversion to Final State

When import is confirmed, `ImportedExercise[]` is converted to existing types:

```typescript
function importToExerciseConfig(imported: ImportedExercise): ExerciseConfig {
  return {
    id: generateId(),
    hevyTemplateId: imported.templateId,
    name: imported.name,
    tier: getTierFromSlot(imported.slot),
    slot: imported.slot,
    muscleGroup: SLOT_DEFAULT_MUSCLE_GROUP[imported.slot],
  };
}

function importToProgressionState(
  imported: ImportedExercise,
  exerciseId: string
): ProgressionState {
  return {
    exerciseId,
    currentWeight: getConfirmedWeight(imported),
    stage: getConfirmedStage(imported),
    baseWeight: getConfirmedWeight(imported),
    lastWorkoutId: null,
    lastWorkoutDate: null,
    amrapRecord: 0,
  };
}
```

## No Schema Changes Required

This feature does not modify the `GZCLPState` schema stored in localStorage. All new types are transient (wizard state only). The final result is stored using existing types:
- `ProgramConfig.hevyRoutineIds` - stores selected routine IDs
- `ProgramConfig.currentDay` - stores next workout choice
- `exercises` - populated from `ImportedExercise[]`
- `progression` - populated from `ImportedExercise[]`
