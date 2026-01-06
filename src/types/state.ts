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
 * 5 roles replacing 11 slots + 6 categories.
 * Main lifts are exclusive (one exercise each), T3 allows multiple.
 * Note: warmup/cooldown roles removed - T1 warmups are now inline sets (Task 2.1).
 */
export type ExerciseRole = 'squat' | 'bench' | 'ohp' | 'deadlift' | 't3'

/** Main lift roles - exclusive, one exercise each */
export const MAIN_LIFT_ROLES = ['squat', 'bench', 'ohp', 'deadlift'] as const
export type MainLiftRole = (typeof MAIN_LIFT_ROLES)[number]

/** Multi-assign roles - unlimited exercises allowed */
export const MULTI_ASSIGN_ROLES = ['t3'] as const

export type GZCLPDay = 'A1' | 'B1' | 'A2' | 'B2'

export type MuscleGroupCategory = 'upper' | 'lower'

export type WeightUnit = 'kg' | 'lbs'

export type Stage = 0 | 1 | 2

export type ChangeType = 'progress' | 'stage_change' | 'deload' | 'repeat'

// =============================================================================
// Progression Key (T1/T2 Independence)
// =============================================================================

/**
 * Progression key format for main lifts (role-tier) and T3 exercises (exerciseId).
 * - Main lifts: "squat-T1", "squat-T2", "bench-T1", etc. (format: `${MainLiftRole}-T1` | `${MainLiftRole}-T2`)
 * - T3 exercises: exerciseId (uuid string)
 */
export type ProgressionKey = string

// =============================================================================
// Main Lift Weight Detection (Import Path)
// =============================================================================

/**
 * Detected weight with source information for verification UI.
 */
export interface DetectedWeight {
  /** The detected weight in kg */
  weight: number
  /** Human-readable source (e.g., "Day A1, position 1") */
  source: string
  /** Detected stage based on rep scheme */
  stage: Stage
}

/**
 * Main lift T1/T2 weight pair detected during import.
 * One entry per main lift role.
 */
export interface MainLiftWeights {
  role: MainLiftRole
  t1: DetectedWeight
  t2: DetectedWeight
  /** True if only one tier was detected (other is estimated) */
  hasWarning: boolean
}

// =============================================================================
// Program Configuration
// =============================================================================

export interface ProgramConfig {
  name: string
  createdAt: string // ISO timestamp
  workoutsPerWeek: number // Default: 3
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

  /** Progression key for state lookup (role-tier for main lifts, exerciseId for T3) */
  progressionKey: ProgressionKey

  currentWeight: number
  currentStage: Stage
  newWeight: number
  newStage: Stage
  newScheme: string

  reason: string
  workoutId: string
  workoutDate: string
  createdAt: string

  // Summary fields (for Post-Workout Summary panel)
  /** Number of sets completed in workout */
  setsCompleted?: number
  /** Target number of sets for the scheme */
  setsTarget?: number
  /** AMRAP set rep count (for T1/T3) */
  amrapReps?: number
  /** Whether this workout was successful (hit targets) */
  success?: boolean
  /** Whether AMRAP beat previous record */
  newPR?: boolean
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
// Workout Summary (Post-Workout Panel)
// =============================================================================

/**
 * Data structure for the Post-Workout Summary panel.
 * Built from PendingChange[] after workout analysis.
 */
export interface WorkoutSummaryData {
  dayName: string           // e.g., "Day A1"
  completedAt: string       // ISO date string

  exercises: {
    name: string
    tier: Tier
    weight: number          // kg
    setsCompleted: number
    setsTarget: number
    success: boolean
    amrapReps?: number      // Only for T1/T3
  }[]

  newPRs: {
    exercise: string
    reps: number
    weight: number          // kg
  }[]

  progressions: {
    exercise: string
    oldWeight: number
    newWeight: number
  }[]

  stageChanges: {
    exercise: string
    oldStage: Stage
    newStage: Stage
  }[]

  deloads: {
    exercise: string
    newWeight: number
  }[]
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

  /** Per-day T3 schedule - maps each day to its T3 exercise IDs */
  t3Schedule: Record<GZCLPDay, string[]>

  /** Total workout count matching GZCLP routines (from Hevy API) */
  totalWorkouts: number
  /** Most recent workout date matching GZCLP routines (ISO string) */
  mostRecentWorkoutDate: string | null
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
 * Per-day import data structure for tabbed import review.
 * Groups T1, T2, and T3 exercises by day.
 */
export interface DayImportData {
  day: GZCLPDay
  t1: ImportedExercise | null
  t2: ImportedExercise | null
  t3s: ImportedExercise[]
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
 * Uses per-day structure for tabbed import review.
 */
export interface ImportResult {
  byDay: Record<GZCLPDay, DayImportData>
  warnings: ImportWarning[]
  routineIds: RoutineAssignment
}
