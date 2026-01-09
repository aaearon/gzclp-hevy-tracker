/**
 * Import Analysis Types
 *
 * Types for intelligent progression analysis during Hevy routine import.
 * These types capture workout performance data, progression calculations,
 * and analysis results for the import wizard.
 */

import type { ChangeType, Stage, Tier } from './state'

/**
 * Performance data extracted from a Hevy workout for a single exercise.
 * Captures what was actually performed for progression analysis.
 */
export interface WorkoutPerformance {
  /** Hevy workout ID */
  workoutId: string
  /** ISO 8601 date string of the workout */
  workoutDate: string
  /** Weight used (kg) from first normal set */
  weight: number
  /** Reps achieved per set (normal sets only) */
  reps: number[]
  /** Number of normal sets completed */
  totalSets: number
}

/**
 * Progression suggestion calculated from workout performance.
 * Maps directly to ProgressionResult from progression.ts.
 */
export interface ProgressionSuggestion {
  /** Type of progression change */
  type: ChangeType
  /** Calculated next weight target */
  suggestedWeight: number
  /** Calculated next stage (0, 1, or 2) */
  suggestedStage: Stage
  /** Rep scheme string (e.g., "5x3+" or "3x8") */
  newScheme: string
  /** Human-readable explanation of the suggestion */
  reason: string
  /** Whether the workout met success criteria */
  success: boolean
  /** AMRAP set rep count (for T1/T3) */
  amrapReps?: number
}

/**
 * Complete analysis result for an exercise during import.
 * Combines performance data with progression suggestion.
 */
export interface ImportAnalysis {
  /** Performance data from workout, null if no workout found */
  performance: WorkoutPerformance | null
  /** Calculated progression suggestion, null if no workout found */
  suggestion: ProgressionSuggestion | null
  /** Whether workout data was found for this exercise */
  hasWorkoutData: boolean
  /** Tier context for the analysis */
  tier: Tier
}
