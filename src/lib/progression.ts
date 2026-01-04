/**
 * Progression Logic
 *
 * GZCLP progression calculations for T1, T2, and T3 exercises.
 */

import type { ProgressionState, WeightUnit, MuscleGroupCategory, ChangeType, Stage, PendingChange, ExerciseConfig, ExerciseRole, GZCLPDay, Tier } from '@/types/state'
import type { WorkoutAnalysisResult } from './workout-analysis'
import { generateId } from '@/utils/id'
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

/**
 * Derive tier from exercise role and optional day.
 * For main lifts, tier depends on day. For T3/warmup/cooldown, always T3.
 */
function deriveTierFromRole(role: ExerciseRole | undefined, day?: GZCLPDay): Tier {
  if (!role) return 'T3'
  if (!isMainLiftRole(role)) return 'T3'
  if (!day) return 'T1' // Default to T1 if day not provided
  return getTierForDay(role, day) ?? 'T3'
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
 */
export function roundWeight(weight: number, unit: WeightUnit): number {
  const increment = WEIGHT_ROUNDING[unit]
  return Math.round(weight / increment) * increment
}

/**
 * Calculate deload weight (85% rounded to valid increment).
 */
export function calculateDeload(weight: number, unit: WeightUnit): number {
  const deloadedWeight = weight * DELOAD_PERCENTAGE
  const rounded = roundWeight(deloadedWeight, unit)
  // Ensure we don't go below the minimum increment
  const minWeight = WEIGHT_ROUNDING[unit]
  return Math.max(rounded, weight > 0 ? minWeight : 0)
}

/**
 * Get weight increment based on muscle group and unit.
 */
function getIncrement(muscleGroup: MuscleGroupCategory, unit: WeightUnit): number {
  return WEIGHT_INCREMENTS[unit][muscleGroup]
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
  const increment = getIncrement(muscleGroup, unit)

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
      reason: `Completed ${scheme.display} at ${current.currentWeight}${unit}. Adding ${increment}${unit}.`,
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
      reason: `Failed to complete ${scheme.display} at ${current.currentWeight}${unit}. Moving to ${nextScheme.display}.`,
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
    reason: `Failed ${scheme.display} at ${current.currentWeight}${unit}. Deloading to ${deloadWeight}${unit} and restarting at ${T1_SCHEMES[0].display}.`,
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
  const increment = getIncrement(muscleGroup, unit)

  if (success) {
    // Add weight, keep stage
    return {
      type: 'progress',
      newWeight: current.currentWeight + increment,
      newStage: current.stage,
      newScheme: scheme.display,
      reason: `Completed ${scheme.display} at ${current.currentWeight}${unit}. Adding ${increment}${unit}.`,
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
      reason: `Failed to complete ${scheme.display} at ${current.currentWeight}${unit}. Moving to ${nextScheme.display}.`,
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
    reason: `Failed ${scheme.display} at ${current.currentWeight}${unit}. Deloading to ${deloadWeight}${unit} and restarting at ${T2_SCHEMES[0].display}.`,
  }
}

// =============================================================================
// T3 Progression
// =============================================================================

/**
 * Check if T3 workout was successful (total reps >= 25).
 */
export function isT3Success(reps: number[]): boolean {
  const totalReps = reps.reduce((sum, r) => sum + r, 0)
  return totalReps >= T3_SUCCESS_THRESHOLD
}

/**
 * Calculate T3 progression based on workout performance.
 */
export function calculateT3Progression(
  current: ProgressionState,
  reps: number[],
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ProgressionResult {
  const totalReps = reps.reduce((sum, r) => sum + r, 0)
  const success = totalReps >= T3_SUCCESS_THRESHOLD
  const increment = getIncrement(muscleGroup, unit)

  if (success) {
    return {
      type: 'progress',
      newWeight: current.currentWeight + increment,
      newStage: 0, // T3 only has stage 0
      newScheme: T3_SCHEME.display,
      reason: `Hit ${totalReps} total reps (${T3_SUCCESS_THRESHOLD}+ required) at ${current.currentWeight}${unit}. Adding ${increment}${unit}.`,
    }
  }

  // T3 never deloads, just repeat
  return {
    type: 'repeat',
    newWeight: current.currentWeight,
    newStage: 0,
    newScheme: T3_SCHEME.display,
    reason: `Hit ${totalReps} total reps (need ${T3_SUCCESS_THRESHOLD}+) at ${current.currentWeight}${unit}. Repeat same weight.`,
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
 * Create a PendingChange object from a progression result.
 * For main lifts (T1/T2), includes tier prefix in exercise name (e.g., "T1 Squat").
 *
 * @param exercise - The exercise configuration
 * @param progression - Current progression state for the exercise
 * @param result - The calculated progression result (weight/stage changes)
 * @param workoutId - ID of the workout that triggered this change
 * @param workoutDate - ISO date string of the workout
 * @param day - Optional GZCLP day for tier derivation (A1/B1/A2/B2)
 * @returns A PendingChange object with tier-specific progressionKey for main lifts
 */
export function createPendingChange(
  exercise: ExerciseConfig,
  progression: ProgressionState,
  result: ProgressionResult,
  workoutId: string,
  workoutDate: string,
  day?: GZCLPDay
): PendingChange {
  // Derive tier from role + day
  const tier = deriveTierFromRole(exercise.role, day)

  // For main lifts, include tier prefix in exercise name (T039)
  const exerciseName = isMainLiftRole(exercise.role) && (tier === 'T1' || tier === 'T2')
    ? `${tier} ${exercise.name}`
    : exercise.name

  // Get the progression key (role-tier for main lifts, exerciseId for T3)
  const progressionKey = getProgressionKey(exercise.id, exercise.role, tier)

  return {
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
  }
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
  day?: GZCLPDay
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

    // Derive tier and muscle group from role
    const tier = deriveTierFromRole(exercise.role, day)
    const muscleGroup = getMuscleGroupForRole(exercise.role)

    // Get the progression key (role-tier for main lifts, exerciseId for T3)
    const progressionKey = getProgressionKey(result.exerciseId, exercise.role, tier)
    const exerciseProgression = progression[progressionKey]

    // Skip if progression not found
    if (!exerciseProgression) {
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

    // Create pending change
    const pendingChange = createPendingChange(
      exercise,
      exerciseProgression, // Use original progression for currentWeight display
      progressionResult,
      result.workoutId,
      result.workoutDate,
      day
    )

    pendingChanges.push(pendingChange)
  }

  return pendingChanges
}
