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

// =============================================================================
// Exercise Role System (NEW - Replaces slots + categories)
// =============================================================================

/**
 * 7 roles replacing 11 slots + 6 categories.
 * Main lifts are exclusive (one exercise each), others allow multiple.
 */
export type ExerciseRole =
  | 'squat'
  | 'bench'
  | 'ohp'
  | 'deadlift'
  | 't3'
  | 'warmup'
  | 'cooldown'

/** Main lift roles - exclusive, one exercise each */
export const MAIN_LIFT_ROLES = ['squat', 'bench', 'ohp', 'deadlift'] as const
export type MainLiftRole = (typeof MAIN_LIFT_ROLES)[number]

/** Multi-assign roles - unlimited exercises allowed */
export const MULTI_ASSIGN_ROLES = ['t3', 'warmup', 'cooldown'] as const

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
  /** Exercise role - the new simplified role system */
  role?: ExerciseRole
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
  /** Exercise role - assigned by user during import */
  role?: ExerciseRole
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
