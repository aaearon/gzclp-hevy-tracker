/**
 * Stage Detector
 *
 * Detects GZCLP progression stage from routine set configurations.
 * Handles T1, T2, and T3 exercises with different detection patterns.
 */

import type { RoutineSetRead } from '@/types/hevy'
import type { Stage, StageConfidence } from '@/types/state'
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
