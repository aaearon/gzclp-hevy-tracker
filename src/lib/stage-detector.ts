/**
 * Stage Detector
 *
 * Detects GZCLP progression stage from routine set configurations and workout history.
 * Handles T1, T2, and T3 exercises with different detection patterns.
 */

import type { RoutineSetRead, Workout, WorkoutSet } from '@/types/hevy'
import type { Stage, StageConfidence, Tier } from '@/types/state'
import { T1_STAGE_PATTERNS, T2_STAGE_PATTERNS, STAGE_SCHEMES } from './constants'

// =============================================================================
// Types
// =============================================================================

export interface StageDetectionResult {
  stage: Stage
  confidence: StageConfidence
  setCount: number
  repScheme: string
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Filter sets to only include normal sets (excludes warmup, dropset, failure).
 */
function filterNormalSets(sets: RoutineSetRead[]): RoutineSetRead[] {
  return sets.filter((set) => set.type === 'normal')
}

/**
 * Get the modal (most common) value from an array of numbers.
 * Returns 0 if array is empty.
 */
function getMode(values: number[]): number {
  if (values.length === 0) return 0

  const counts = new Map<number, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  let maxCount = 0
  let mode = 0
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      mode = value
    }
  }

  return mode
}

// =============================================================================
// Stage Detection
// =============================================================================

/**
 * Detect progression stage from routine sets.
 *
 * @param sets - All sets for the exercise (will filter to 'normal' internally)
 * @param tier - 'T1', 'T2', or 'T3' (T3 always returns stage 0)
 * @returns Detection result or null if cannot detect
 */
export function detectStage(
  sets: RoutineSetRead[],
  tier: 'T1' | 'T2' | 'T3'
): StageDetectionResult | null {
  const normalSets = filterNormalSets(sets)

  if (normalSets.length === 0) {
    return null
  }

  // T3 exercises always return Stage 0 with high confidence
  if (tier === 'T3') {
    return {
      stage: 0,
      confidence: 'high',
      setCount: normalSets.length,
      repScheme: '3x15+',
    }
  }

  const setCount = normalSets.length
  const repCounts = normalSets.map((set) => set.reps ?? 0)
  const modalReps = getMode(repCounts)

  // Select patterns based on tier
  const patterns = tier === 'T1' ? T1_STAGE_PATTERNS : T2_STAGE_PATTERNS

  // Try to match against known patterns
  for (const [patternSets, patternReps, stageIndex] of patterns) {
    if (setCount === patternSets && modalReps === patternReps) {
      return {
        stage: stageIndex,
        confidence: 'high',
        setCount,
        repScheme: STAGE_SCHEMES[tier][stageIndex],
      }
    }
  }

  // No pattern matched
  return null
}

// =============================================================================
// Weight Extraction
// =============================================================================

/**
 * Extract working weight from routine sets.
 * Returns the maximum weight from normal sets.
 *
 * @param sets - All sets for the exercise (will filter to 'normal' internally)
 * @param _userUnit - User's preferred unit (currently unused, returns kg)
 * @returns Weight in kg, or 0 if no weight found
 */
export function extractWeight(
  sets: RoutineSetRead[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userUnit?: 'kg' | 'lbs'
): number {
  const normalSets = filterNormalSets(sets)

  if (normalSets.length === 0) {
    return 0
  }

  // Get max weight from normal sets, treating null as 0
  const weights = normalSets
    .map((set) => set.weight_kg)
    .filter((w): w is number => w !== null)

  if (weights.length === 0) {
    return 0
  }

  return Math.max(...weights)
}

// =============================================================================
// Workout History Stage Detection (T016)
// =============================================================================

/**
 * Filter workout sets to only include normal sets.
 */
function filterNormalWorkoutSets(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.filter((set) => set.type === 'normal')
}

/**
 * Detect stage from workout history for a specific exercise.
 * Searches recent workouts for the exercise and analyzes set/rep patterns.
 *
 * @param workouts - Array of workouts to search (most recent first)
 * @param exerciseTemplateId - Hevy exercise template ID to find
 * @param tier - The tier to use for pattern matching (T1 or T2)
 * @returns Detected stage (0, 1, or 2) or null if no match found
 */
export function detectStageFromWorkoutHistory(
  workouts: Workout[],
  exerciseTemplateId: string,
  tier: Tier
): Stage | null {
  // T3 exercises are always stage 0
  if (tier === 'T3') {
    return 0
  }

  // Find the most recent workout containing this exercise
  for (const workout of workouts) {
    const exercise = workout.exercises.find(
      (ex) => ex.exercise_template_id === exerciseTemplateId
    )

    if (!exercise) continue

    // Analyze the sets
    const normalSets = filterNormalWorkoutSets(exercise.sets)
    if (normalSets.length === 0) continue

    const setCount = normalSets.length
    const repCounts = normalSets.map((set) => set.reps ?? 0)
    const modalReps = getMode(repCounts)

    // Select patterns based on tier
    const patterns = tier === 'T1' ? T1_STAGE_PATTERNS : T2_STAGE_PATTERNS

    // Try to match against known patterns
    for (const [patternSets, patternReps, stageIndex] of patterns) {
      if (setCount === patternSets && modalReps === patternReps) {
        return stageIndex
      }
    }

    // Found the exercise but couldn't match pattern - return null
    // This will trigger manual confidence and default to stage 0
    return null
  }

  // Exercise not found in workout history - default to stage 0
  return null
}
