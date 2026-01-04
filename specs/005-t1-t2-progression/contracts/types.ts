/**
 * Type Contracts: Separate T1 and T2 Progression Tracking
 *
 * Feature: 005-t1-t2-progression
 * Date: 2026-01-03
 *
 * These types define the contracts for the T1/T2 progression tracking feature.
 * Implementation MUST conform to these specifications.
 */

import type { MainLiftRole, Stage, Tier, ExerciseRole, WeightUnit } from '@/types/state'

// =============================================================================
// Progression Key
// =============================================================================

/**
 * Progression key format:
 * - Main lifts: "squat-T1", "squat-T2", "bench-T1", etc.
 * - T3 exercises: exerciseId (uuid string)
 */
export type ProgressionKey =
  | `${MainLiftRole}-T1`
  | `${MainLiftRole}-T2`
  | string

/**
 * Generate the progression storage key for an exercise.
 *
 * Rules:
 * - Main lifts (squat, bench, ohp, deadlift) with T1/T2 tier → "role-tier"
 * - All other exercises → exerciseId
 */
export interface GetProgressionKeyFn {
  (exerciseId: string, role: ExerciseRole | undefined, tier: Tier): ProgressionKey
}

// =============================================================================
// Import: T1/T2 Weight Detection
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
  /** Confidence in detection */
  confidence: 'high' | 'low'
}

/**
 * Main lift weights detected during import.
 * One entry per main lift role.
 */
export interface MainLiftWeights {
  role: MainLiftRole
  t1: DetectedWeight
  t2: DetectedWeight
  /** True if only one tier was detected (other is estimated) */
  hasWarning: boolean
}

/**
 * Result of T1/T2 weight detection from imported routines.
 */
export interface T1T2DetectionResult {
  /** Detected weights per main lift */
  mainLifts: MainLiftWeights[]
  /** Warnings generated during detection */
  warnings: T1T2DetectionWarning[]
}

export interface T1T2DetectionWarning {
  role: MainLiftRole
  type: 'missing_t1' | 'missing_t2' | 'weight_mismatch'
  message: string
}

// =============================================================================
// Verification UI
// =============================================================================

/**
 * User-editable weight pair for verification step.
 */
export interface EditableMainLiftWeights {
  role: MainLiftRole
  t1Weight: number
  t1Source: string
  t2Weight: number
  t2Source: string
  /** User has modified this entry */
  isModified: boolean
  /** Validation warning (not error) */
  warning: string | null
}

/**
 * Actions available during verification.
 */
export interface VerificationActions {
  /** Swap T1 and T2 values for a role */
  swap: (role: MainLiftRole) => void
  /** Update T1 weight for a role */
  setT1Weight: (role: MainLiftRole, weight: number) => void
  /** Update T2 weight for a role */
  setT2Weight: (role: MainLiftRole, weight: number) => void
  /** Confirm and finalize all weights */
  confirm: () => void
}

// =============================================================================
// Weight Input Validation
// =============================================================================

/**
 * Weight validation result.
 */
export interface WeightValidationResult {
  isValid: boolean
  error: string | null
}

/**
 * Validate a weight input value.
 *
 * Validation rules:
 * - Required (not empty)
 * - Must be numeric
 * - Must be > 0
 * - Must be <= 500 (sanity check)
 */
export interface ValidateWeightFn {
  (value: string, unit: WeightUnit): WeightValidationResult
}

/**
 * Validation errors by field.
 */
export type WeightValidationErrors = {
  [K in `${MainLiftRole}-T1` | `${MainLiftRole}-T2`]?: string
}

// =============================================================================
// Create Path: Weight Setup
// =============================================================================

/**
 * Weight setup form state.
 */
export interface WeightSetupFormState {
  squat: { t1: string; t2: string }
  bench: { t1: string; t2: string }
  ohp: { t1: string; t2: string }
  deadlift: { t1: string; t2: string }
}

/**
 * Weight setup form actions.
 */
export interface WeightSetupActions {
  /** Set T1 weight for a role */
  setT1: (role: MainLiftRole, value: string) => void
  /** Set T2 weight for a role */
  setT2: (role: MainLiftRole, value: string) => void
  /** Get validation errors */
  validate: () => WeightValidationErrors
  /** Check if form is valid */
  isValid: () => boolean
  /** Get final weights for submission */
  getWeights: () => Record<ProgressionKey, number>
}

// =============================================================================
// Dashboard Display
// =============================================================================

/**
 * Main lift display data for dashboard.
 */
export interface MainLiftDisplayData {
  role: MainLiftRole
  displayName: string  // e.g., "Squat", "Bench Press"
  t1: TierDisplayData
  t2: TierDisplayData
}

export interface TierDisplayData {
  tier: 'T1' | 'T2'
  weight: number
  stage: Stage
  scheme: string  // e.g., "5x3+", "3x10"
  /** True if this tier is scheduled for current day */
  isActiveToday: boolean
}

// =============================================================================
// Pending Changes
// =============================================================================

/**
 * Tier-specific pending change display.
 */
export interface TierSpecificPendingChange {
  /** Display name with tier prefix (e.g., "T1 Squat") */
  displayName: string
  tier: 'T1' | 'T2'
  role: MainLiftRole
  currentWeight: number
  newWeight: number
  currentStage: Stage
  newStage: Stage
  changeType: 'progress' | 'stage_change' | 'deload'
}
