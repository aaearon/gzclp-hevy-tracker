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
