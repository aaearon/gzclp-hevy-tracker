/**
 * Warmup Set Calculator
 *
 * Shared utility for calculating warmup sets for T1 exercises.
 * Used by both UI components and Hevy routine sync.
 *
 * Protocol:
 * - Light lifts (≤40kg): Bar only x10, 50% x5, 75% x3
 * - Heavy lifts (>40kg): 50% x5, 70% x3, 85% x2
 */

import { WARMUP_CONFIG } from './constants'

export interface WarmupSet {
  /** Weight in kg */
  weight: number
  /** Number of reps */
  reps: number
}

/**
 * Round weight to nearest increment.
 */
function roundToNearest(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment
}

/**
 * Calculate warmup sets for a given working weight.
 *
 * Light lifts (≤40kg): Bar only x10, 50% x5, 75% x3
 * Heavy lifts (>40kg): 50% x5, 70% x3, 85% x2
 *
 * Smart filtering: skips duplicate weights when rounding produces same value.
 *
 * @param workingWeightKg - The working weight in kg
 * @returns Array of warmup sets with weight (kg) and reps
 */
export function calculateWarmupSets(workingWeightKg: number): WarmupSet[] {
  const BAR_WEIGHT = WARMUP_CONFIG.minWeight
  const isHeavy = workingWeightKg > WARMUP_CONFIG.heavyThreshold

  const percentages = isHeavy ? WARMUP_CONFIG.heavyPercentages : WARMUP_CONFIG.lightPercentages
  const reps = isHeavy ? WARMUP_CONFIG.heavyReps : WARMUP_CONFIG.lightReps

  const sets: WarmupSet[] = []

  for (let i = 0; i < percentages.length; i++) {
    const pct = percentages[i]
    if (pct === undefined) continue

    const weight =
      pct === 0 ? BAR_WEIGHT : Math.max(BAR_WEIGHT, roundToNearest(workingWeightKg * pct, 2.5))

    // Smart filtering: skip if weight equals previous set (avoid duplicates)
    const lastSet = sets[sets.length - 1]
    if (lastSet?.weight === weight) {
      continue
    }

    const repCount = reps[i]
    if (repCount !== undefined) {
      sets.push({ weight, reps: repCount })
    }
  }

  return sets
}
