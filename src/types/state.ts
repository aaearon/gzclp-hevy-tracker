/**
 * Application State Types
 *
 * Core type definitions for the GZCLP Hevy Tracker application state.
 * All state is persisted to localStorage under key 'gzclp_state'.
 */

// =============================================================================
// GZCLP Program Types
// =============================================================================

export type Tier = 'T1' | 'T2' | 'T3'

export type GZCLPSlot =
  | 't1_squat'
  | 't1_bench'
  | 't1_ohp'
  | 't1_deadlift'
  | 't2_squat'
  | 't2_bench'
  | 't2_ohp'
  | 't2_deadlift'
  | 't3_1'
  | 't3_2'
  | 't3_3'

export type GZCLPDay = 'A1' | 'B1' | 'A2' | 'B2'

export type MuscleGroupCategory = 'upper' | 'lower'

export type WeightUnit = 'kg' | 'lbs'

export type Stage = 0 | 1 | 2

export type ChangeType = 'progress' | 'stage_change' | 'deload' | 'repeat'

// =============================================================================
// Program Configuration
// =============================================================================

export interface ProgramConfig {
  name: string
  createdAt: string // ISO timestamp
  hevyRoutineIds: {
    A1: string | null
    B1: string | null
    A2: string | null
    B2: string | null
  }
  currentDay: GZCLPDay
}

// =============================================================================
// Exercise Configuration
// =============================================================================

export interface ExerciseConfig {
  id: string
  hevyTemplateId: string
  name: string
  tier: Tier
  slot: GZCLPSlot
  muscleGroup: MuscleGroupCategory
}

// =============================================================================
// Progression State
// =============================================================================

export interface ProgressionState {
  exerciseId: string
  currentWeight: number
  stage: Stage
  baseWeight: number
  lastWorkoutId: string | null
  lastWorkoutDate: string | null
  amrapRecord: number
}

// =============================================================================
// Pending Changes
// =============================================================================

export interface PendingChange {
  id: string
  exerciseId: string
  exerciseName: string
  tier: Tier
  type: ChangeType

  currentWeight: number
  currentStage: Stage
  newWeight: number
  newStage: Stage
  newScheme: string

  reason: string
  workoutId: string
  workoutDate: string
  createdAt: string
}

// =============================================================================
// User Settings
// =============================================================================

export interface UserSettings {
  weightUnit: WeightUnit
  increments: {
    upper: number
    lower: number
  }
  restTimers: {
    t1: number // seconds
    t2: number // seconds
    t3: number // seconds
  }
}

// =============================================================================
// Root State
// =============================================================================

export interface GZCLPState {
  version: string
  apiKey: string

  program: ProgramConfig
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  pendingChanges: PendingChange[]

  settings: UserSettings
  lastSync: string | null
}

// =============================================================================
// Routine Import Types (transient wizard state, not persisted)
// =============================================================================

/**
 * User's choice between creating new routines or importing existing ones.
 */
export type RoutineSourceMode = 'create' | 'import'

/**
 * Summary of a Hevy routine for display in the selector.
 */
export interface AvailableRoutine {
  id: string
  title: string
  exerciseCount: number
  exercisePreview: string[]
  updatedAt: string
}

/**
 * User's mapping of Hevy routines to GZCLP days.
 */
export interface RoutineAssignment {
  A1: string | null
  B1: string | null
  A2: string | null
  B2: string | null
}

/**
 * Confidence level for stage detection.
 * - 'high': Set/rep scheme matched a known GZCLP pattern
 * - 'manual': Scheme didn't match; user must confirm stage
 */
export type StageConfidence = 'high' | 'manual'

/**
 * Represents an exercise extracted from a routine, pending user confirmation.
 */
export interface ImportedExercise {
  slot: GZCLPSlot
  templateId: string
  name: string

  /** Detected weight in kg (converted if needed) */
  detectedWeight: number
  /** Detected progression stage (0, 1, or 2) */
  detectedStage: Stage
  stageConfidence: StageConfidence

  /** Original routine data for display */
  originalSetCount: number
  originalRepScheme: string

  /** User overrides set during review */
  userWeight?: number
  userStage?: Stage
  userSlot?: GZCLPSlot
}

/**
 * Types of warnings that can occur during import.
 */
export type ImportWarningType =
  | 'no_t2'
  | 'stage_unknown'
  | 'duplicate_routine'
  | 'weight_null'

/**
 * Warning generated during routine import.
 */
export interface ImportWarning {
  type: ImportWarningType
  day?: GZCLPDay
  slot?: GZCLPSlot
  message: string
}

/**
 * Complete result of extraction from assigned routines.
 */
export interface ImportResult {
  exercises: ImportedExercise[]
  warnings: ImportWarning[]
  routineIds: RoutineAssignment
}
