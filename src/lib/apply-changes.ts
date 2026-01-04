/**
 * Apply Changes Module
 *
 * Functions for applying, rejecting, and modifying pending progression changes.
 */

import type { PendingChange, ProgressionState } from '@/types/state'

/**
 * Apply a single pending change to the progression state.
 * Returns a new progression state with the change applied.
 *
 * Uses progressionKey (role-tier for main lifts, exerciseId for T3) to correctly
 * update only the specific tier's progression state. This ensures T1 Squat and
 * T2 Squat have independent progression states.
 *
 * @param progression - Current progression state record
 * @param change - The pending change to apply
 * @returns New progression state with the change applied
 *
 * @example
 * // Apply a T1 Squat change - only "squat-T1" key is updated
 * const updated = applyPendingChange(progression, t1SquatChange)
 * // "squat-T2" remains unchanged
 */
export function applyPendingChange(
  progression: Record<string, ProgressionState>,
  change: PendingChange
): Record<string, ProgressionState> {
  // Use progressionKey for tier-specific updates (T041, T042)
  const key = change.progressionKey
  const exerciseProgression = progression[key]

  // If progression entry not found, return original state
  if (!exerciseProgression) {
    return progression
  }

  const updatedProgression: ProgressionState = {
    ...exerciseProgression,
    currentWeight: change.newWeight,
    stage: change.newStage,
    lastWorkoutId: change.workoutId,
    lastWorkoutDate: change.workoutDate,
  }

  // Update baseWeight on deload
  if (change.type === 'deload') {
    updatedProgression.baseWeight = change.newWeight
  }

  return {
    ...progression,
    [key]: updatedProgression,
  }
}

/**
 * Apply all pending changes to the progression state.
 * Changes are applied in order, so later changes can build on earlier ones.
 */
export function applyAllPendingChanges(
  progression: Record<string, ProgressionState>,
  changes: PendingChange[]
): Record<string, ProgressionState> {
  return changes.reduce(
    (currentProgression, change) => applyPendingChange(currentProgression, change),
    progression
  )
}

/**
 * Create a modified version of a pending change with a different weight.
 * The reason is updated to reflect manual modification.
 */
export function modifyPendingChangeWeight(
  change: PendingChange,
  newWeight: number
): PendingChange {
  return {
    ...change,
    newWeight,
    reason: `Modified by user: ${change.currentWeight} -> ${newWeight} (original suggestion: ${change.newWeight})`,
  }
}
