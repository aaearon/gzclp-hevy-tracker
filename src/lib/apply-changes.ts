/**
 * Apply Changes Module
 *
 * Functions for applying, rejecting, and modifying pending progression changes.
 */

import type { PendingChange, ProgressionState } from '@/types/state'

/**
 * Apply a single pending change to the progression state.
 * Returns a new progression state with the change applied.
 */
export function applyPendingChange(
  progression: Record<string, ProgressionState>,
  change: PendingChange
): Record<string, ProgressionState> {
  const exerciseProgression = progression[change.exerciseId]

  // If exercise not found, return original progression
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
    [change.exerciseId]: updatedProgression,
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
