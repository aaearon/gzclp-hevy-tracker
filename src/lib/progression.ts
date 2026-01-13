/**
 * Progression Logic
 *
 * GZCLP progression calculations for T1, T2, and T3 exercises.
 */

import type { ProgressionState, WeightUnit, MuscleGroupCategory, ChangeType, Stage, PendingChange, ExerciseConfig, ExerciseRole, GZCLPDay, Tier } from '@/types/state'
import type { WorkoutAnalysisResult } from './workout-analysis'
import { generateId } from '@/utils/id'
import { toKg } from '@/utils/formatting'
import {
  T1_SCHEMES,
  T2_SCHEMES,
  T3_SCHEME,
  DELOAD_PERCENTAGE,
  WEIGHT_INCREMENTS,
  WEIGHT_ROUNDING,
} from './constants'
import { getTierForDay, isMainLiftRole, getProgressionKey } from './role-utils'

// =============================================================================
// Role-Based Utilities
// =============================================================================

/**
 * Derive muscle group from exercise role.
 * Lower body: squat, deadlift
 * Upper body: bench, ohp, t3, warmup, cooldown
 */
function getMuscleGroupForRole(role: ExerciseRole | undefined): MuscleGroupCategory {
  if (!role) return 'upper'
  if (role === 'squat' || role === 'deadlift') return 'lower'
  return 'upper'
}

// =============================================================================
// Constants
// =============================================================================

export const T1_SUCCESS_REPS = {
  0: 3, // Stage 0: 5x3+, need at least 3 reps per set
  1: 2, // Stage 1: 6x2+, need at least 2 reps per set
  2: 1, // Stage 2: 10x1+, need at least 1 rep per set
} as const

export const T1_REQUIRED_SETS = {
  0: 5, // 5x3+
  1: 6, // 6x2+
  2: 10, // 10x1+
} as const

export const T2_SUCCESS_REPS = {
  0: 10, // 3x10
  1: 8, // 3x8
  2: 6, // 3x6
} as const

export const T2_REQUIRED_SETS = 3

export const T3_SUCCESS_THRESHOLD = 25 // Total reps needed across all sets

// =============================================================================
// Weight Utilities
// =============================================================================

/**
 * Round weight to the nearest valid increment based on unit.
 * Note: This is used for rounding within the user's unit system.
 */
export function roundWeight(weight: number, unit: WeightUnit): number {
  const increment = WEIGHT_ROUNDING[unit]
  return Math.round(weight / increment) * increment
}

/**
 * Round weight in kg to the nearest 2.5kg increment.
 * Used for internal storage rounding.
 */
function roundWeightKg(weightKg: number): number {
  const KG_INCREMENT = 2.5
  return Math.round(weightKg / KG_INCREMENT) * KG_INCREMENT
}

/**
 * Minimum weight is the bar weight.
 * REQ-PROG-009: Deload never goes below bar weight (20kg).
 */
const BAR_WEIGHT_KG = 20

/**
 * Calculate deload weight (85% rounded to nearest 2.5kg).
 * [GAP-10] Minimum weight is bar weight (20kg).
 *
 * Note: Input weight is always in kg (internal storage format).
 * The unit parameter determines which increment system to use for
 * selecting the base increment, but result is always in kg.
 */
export function calculateDeload(weightKg: number, _unit: WeightUnit): number {
  const deloadedWeight = weightKg * DELOAD_PERCENTAGE
  const rounded = roundWeightKg(deloadedWeight)
  // Ensure we don't go below bar weight [REQ-PROG-009]
  return Math.max(rounded, BAR_WEIGHT_KG)
}

/**
 * Get weight increment in kg based on muscle group and user's preferred unit.
 *
 * The user's unit determines which increment system they're using:
 * - kg: 2.5kg upper, 5kg lower
 * - lbs: 5lbs (~2.27kg) upper, 10lbs (~4.54kg) lower
 *
 * Returns the increment converted to kg for internal calculation.
 */
function getIncrementKg(muscleGroup: MuscleGroupCategory, unit: WeightUnit): number {
  const userIncrement = WEIGHT_INCREMENTS[unit][muscleGroup]
  return toKg(userIncrement, unit)
}

// =============================================================================
// Progression Result Types
// =============================================================================

export interface ProgressionResult {
  type: ChangeType
  newWeight: number
  newStage: Stage
  newScheme: string
  newBaseWeight?: number
  newAmrapRecord?: number
  reason: string
  /** Whether the workout met success criteria */
  success: boolean
  /** AMRAP set rep count (for T1/T3) */
  amrapReps?: number
}

// =============================================================================
// T1 Progression
// =============================================================================

/**
 * Check if T1 workout was successful (all prescribed sets hit target reps).
 */
export function isT1Success(reps: number[], stage: Stage): boolean {
  const requiredSets = T1_REQUIRED_SETS[stage]
  const targetReps = T1_SUCCESS_REPS[stage]

  // Need at least the required number of sets
  if (reps.length < requiredSets) {
    return false
  }

  // Check if all required sets hit target
  for (let i = 0; i < requiredSets; i++) {
    if ((reps[i] ?? 0) < targetReps) {
      return false
    }
  }

  return true
}

/**
 * Calculate T1 progression based on workout performance.
 */
export function calculateT1Progression(
  current: ProgressionState,
  reps: number[],
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ProgressionResult {
  const success = isT1Success(reps, current.stage)
  const scheme = T1_SCHEMES[current.stage]
  const increment = getIncrementKg(muscleGroup, unit)

  // Track AMRAP (last set of prescribed sets)
  const requiredSets = T1_REQUIRED_SETS[current.stage]
  const amrapReps = reps[requiredSets - 1] ?? 0
  const newAmrapRecord = Math.max(current.amrapRecord, amrapReps)

  if (success) {
    // Add weight, keep stage
    return {
      type: 'progress',
      newWeight: current.currentWeight + increment,
      newStage: current.stage,
      newScheme: scheme.display,
      newAmrapRecord,
      reason: `Completed ${scheme.display} at ${String(current.currentWeight)}${unit}. Adding ${String(increment)}${unit}.`,
      success: true,
      amrapReps,
    }
  }

  // Failed - check if we need to advance stage or deload
  if (current.stage < 2) {
    // Move to next stage
    const nextStage = (current.stage + 1) as Stage
    const nextScheme = T1_SCHEMES[nextStage]

    return {
      type: 'stage_change',
      newWeight: current.currentWeight,
      newStage: nextStage,
      newScheme: nextScheme.display,
      newAmrapRecord,
      reason: `Failed to complete ${scheme.display} at ${String(current.currentWeight)}${unit}. Moving to ${nextScheme.display}.`,
      success: false,
      amrapReps,
    }
  }

  // At stage 2 and failed - deload
  const deloadWeight = calculateDeload(current.currentWeight, unit)

  return {
    type: 'deload',
    newWeight: deloadWeight,
    newStage: 0,
    newScheme: T1_SCHEMES[0].display,
    newBaseWeight: deloadWeight,
    newAmrapRecord,
    reason: `Failed ${scheme.display} at ${String(current.currentWeight)}${unit}. Deloading to ${String(deloadWeight)}${unit} and restarting at ${T1_SCHEMES[0].display}.`,
    success: false,
    amrapReps,
  }
}

// =============================================================================
// T2 Progression
// =============================================================================

/**
 * Check if T2 workout was successful (all 3 sets hit target reps).
 */
export function isT2Success(reps: number[], stage: Stage): boolean {
  // Need exactly 3 sets
  if (reps.length < T2_REQUIRED_SETS) {
    return false
  }

  const targetReps = T2_SUCCESS_REPS[stage]

  // Check if first 3 sets hit target
  for (let i = 0; i < T2_REQUIRED_SETS; i++) {
    if ((reps[i] ?? 0) < targetReps) {
      return false
    }
  }

  return true
}

/**
 * Calculate T2 progression based on workout performance.
 */
export function calculateT2Progression(
  current: ProgressionState,
  reps: number[],
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ProgressionResult {
  const success = isT2Success(reps, current.stage)
  const scheme = T2_SCHEMES[current.stage]
  const increment = getIncrementKg(muscleGroup, unit)

  if (success) {
    // Add weight, keep stage
    return {
      type: 'progress',
      newWeight: current.currentWeight + increment,
      newStage: current.stage,
      newScheme: scheme.display,
      reason: `Completed ${scheme.display} at ${String(current.currentWeight)}${unit}. Adding ${String(increment)}${unit}.`,
      success: true,
    }
  }

  // Failed - check if we need to advance stage or deload
  if (current.stage < 2) {
    const nextStage = (current.stage + 1) as Stage
    const nextScheme = T2_SCHEMES[nextStage]

    return {
      type: 'stage_change',
      newWeight: current.currentWeight,
      newStage: nextStage,
      newScheme: nextScheme.display,
      reason: `Failed to complete ${scheme.display} at ${String(current.currentWeight)}${unit}. Moving to ${nextScheme.display}.`,
      success: false,
    }
  }

  // At stage 2 and failed - deload
  const deloadWeight = calculateDeload(current.currentWeight, unit)

  return {
    type: 'deload',
    newWeight: deloadWeight,
    newStage: 0,
    newScheme: T2_SCHEMES[0].display,
    newBaseWeight: deloadWeight,
    reason: `Failed ${scheme.display} at ${String(current.currentWeight)}${unit}. Deloading to ${String(deloadWeight)}${unit} and restarting at ${T2_SCHEMES[0].display}.`,
    success: false,
  }
}

// =============================================================================
// T3 Progression
// =============================================================================

/**
 * Check if T3 workout was successful (AMRAP set >= 25 reps).
 * Per GZCLP spec, only the final AMRAP set is checked for 25+ reps.
 */
export function isT3Success(reps: number[]): boolean {
  if (reps.length === 0) return false
  const amrapReps = reps[reps.length - 1] ?? 0
  return amrapReps >= T3_SUCCESS_THRESHOLD
}

/**
 * Calculate T3 progression based on workout performance.
 * Per GZCLP spec, progression is triggered when AMRAP (last) set >= 25 reps.
 */
export function calculateT3Progression(
  current: ProgressionState,
  reps: number[],
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ProgressionResult {
  const amrapReps = reps.length > 0 ? (reps[reps.length - 1] ?? 0) : 0
  const success = isT3Success(reps)
  const increment = getIncrementKg(muscleGroup, unit)

  if (success) {
    return {
      type: 'progress',
      newWeight: current.currentWeight + increment,
      newStage: 0, // T3 only has stage 0
      newScheme: T3_SCHEME.display,
      reason: `Hit ${String(amrapReps)} reps on AMRAP set (${String(T3_SUCCESS_THRESHOLD)}+ required) at ${String(current.currentWeight)}${unit}. Adding ${String(increment)}${unit}.`,
      success: true,
      amrapReps,
    }
  }

  // T3 never deloads, just repeat
  return {
    type: 'repeat',
    newWeight: current.currentWeight,
    newStage: 0,
    newScheme: T3_SCHEME.display,
    reason: `Hit ${String(amrapReps)} reps on AMRAP set (need ${String(T3_SUCCESS_THRESHOLD)}+) at ${String(current.currentWeight)}${unit}. Repeat same weight.`,
    success: false,
    amrapReps,
  }
}

// =============================================================================
// Generic Progression Calculator
// =============================================================================

/**
 * Calculate progression for any tier.
 */
export function calculateProgression(
  tier: Tier,
  current: ProgressionState,
  reps: number[],
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ProgressionResult {
  switch (tier) {
    case 'T1':
      return calculateT1Progression(current, reps, muscleGroup, unit)
    case 'T2':
      return calculateT2Progression(current, reps, muscleGroup, unit)
    case 'T3':
      return calculateT3Progression(current, reps, muscleGroup, unit)
  }
}

// =============================================================================
// PendingChange Generator
// =============================================================================

/**
 * Summary fields for PendingChange (optional parameters for createPendingChange).
 */
export interface PendingChangeSummaryFields {
  setsCompleted: number
  setsTarget: number
  newPR: boolean
  /** New AMRAP record value when a PR is achieved */
  newAmrapRecord?: number
}

/**
 * Create a PendingChange object from a progression result.
 * For main lifts (T1/T2), includes tier prefix in exercise name (e.g., "T1 Squat").
 *
 * @param exercise - The exercise configuration
 * @param progression - Current progression state for the exercise
 * @param result - The calculated progression result (weight/stage changes)
 * @param workoutId - ID of the workout that triggered this change
 * @param workoutDate - ISO date string of the workout
 * @param tier - The tier for this exercise (T1/T2/T3)
 * @param day - Optional GZCLP day this change came from
 * @param summaryFields - Optional summary fields for post-workout panel
 * @param discrepancy - Optional weight discrepancy info when actual weight differs from expected
 * @returns A PendingChange object with tier-specific progressionKey for main lifts
 */
export function createPendingChange(
  exercise: ExerciseConfig,
  progression: ProgressionState,
  result: ProgressionResult,
  workoutId: string,
  workoutDate: string,
  tier: Tier,
  day?: GZCLPDay,
  summaryFields?: PendingChangeSummaryFields,
  discrepancy?: { storedWeight: number; actualWeight: number }
): PendingChange {

  // For main lifts, include tier prefix in exercise name (T039)
  const exerciseName = isMainLiftRole(exercise.role) && (tier === 'T1' || tier === 'T2')
    ? `${tier} ${exercise.name}`
    : exercise.name

  // Get the progression key (role-tier for main lifts, exerciseId for T3)
  const progressionKey = getProgressionKey(exercise.id, exercise.role, tier)

  const change: PendingChange = {
    id: generateId(),
    exerciseId: exercise.id,
    exerciseName,
    tier,
    type: result.type,
    progressionKey,
    currentWeight: progression.currentWeight,
    currentStage: progression.stage,
    newWeight: result.newWeight,
    newStage: result.newStage,
    newScheme: result.newScheme,
    reason: result.reason,
    workoutId,
    workoutDate,
    createdAt: new Date().toISOString(),
    success: result.success,
    day,
    discrepancy,
  }

  // Add optional summary fields only when defined
  if (summaryFields !== undefined) {
    change.setsCompleted = summaryFields.setsCompleted
    change.setsTarget = summaryFields.setsTarget
    change.newPR = summaryFields.newPR
    if (summaryFields.newAmrapRecord !== undefined) {
      change.newAmrapRecord = summaryFields.newAmrapRecord
    }
  }
  if (result.amrapReps !== undefined) {
    change.amrapReps = result.amrapReps
  }

  return change
}

/**
 * Create PendingChange objects from workout analysis results.
 * Calculates progression for each analyzed exercise and generates pending changes.
 */
export function createPendingChangesFromAnalysis(
  analysisResults: WorkoutAnalysisResult[],
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  unit: WeightUnit,
  _day?: GZCLPDay // Note: day context now comes from result.day in analysisResults
): PendingChange[] {
  const pendingChanges: PendingChange[] = []

  for (const result of analysisResults) {
    const exercise = exercises[result.exerciseId]

    // Skip if exercise not found
    if (!exercise) {
      continue
    }

    // Skip non-GZCLP exercises (no role)
    if (!exercise.role) {
      continue
    }

    // Use tier from analysis result (already correctly derived with day context)
    // Don't re-derive here as day may not be available
    const tier = result.tier
    const muscleGroup = getMuscleGroupForRole(exercise.role)

    // Get the progression key (role-tier for main lifts, exerciseId for T3)
    const progressionKey = getProgressionKey(result.exerciseId, exercise.role, tier)
    const exerciseProgression = progression[progressionKey]

    // Skip if progression not found
    if (!exerciseProgression) {
      console.warn(
        `[createPendingChanges] Skipping "${exercise.name}" (${tier}): ` +
        `progression key "${progressionKey}" not found. ` +
        `Available keys: [${Object.keys(progression).join(', ')}]`
      )
      continue
    }

    // When there's a discrepancy, use the actual workout weight for progression calculation
    // but keep the stored weight for reference
    const workoutWeight = result.discrepancy?.actualWeight ?? result.weight
    const progressionForCalc: ProgressionState = {
      ...exerciseProgression,
      currentWeight: workoutWeight,
    }

    // Calculate progression based on workout performance
    const progressionResult = calculateProgression(
      tier,
      progressionForCalc,
      result.reps,
      muscleGroup,
      unit
    )

    // Skip 'repeat' type changes - nothing actually changes and user doesn't need to review
    // This happens when T3 exercises don't hit the 25+ AMRAP threshold
    if (progressionResult.type === 'repeat') {
      continue
    }

    // Calculate summary fields
    const setsCompleted = result.reps.length
    const setsTarget = tier === 'T1'
      ? T1_REQUIRED_SETS[exerciseProgression.stage]
      : tier === 'T2'
        ? T2_REQUIRED_SETS
        : 3 // T3 default
    const newPR = progressionResult.amrapReps !== undefined &&
      progressionResult.amrapReps > exerciseProgression.amrapRecord
    const newAmrapRecord = newPR && progressionResult.amrapReps !== undefined
      ? progressionResult.amrapReps
      : undefined

    // Create pending change - conditionally include newAmrapRecord only when defined
    const summaryFields = newAmrapRecord !== undefined
      ? { setsCompleted, setsTarget, newPR, newAmrapRecord }
      : { setsCompleted, setsTarget, newPR }
    const pendingChange = createPendingChange(
      exercise,
      exerciseProgression, // Use original progression for currentWeight display
      progressionResult,
      result.workoutId,
      result.workoutDate,
      tier, // Use tier from analysis result
      result.day, // Use day from analysis result
      summaryFields,
      result.discrepancy // Pass discrepancy info for display in ReviewModal
    )

    console.debug(
      `[createPendingChanges] Created change for "${exercise.name}" (${tier}): ` +
      `progressionKey="${progressionKey}", workoutId="${result.workoutId}", type="${progressionResult.type}"`
    )
    pendingChanges.push(pendingChange)
  }

  return pendingChanges
}
