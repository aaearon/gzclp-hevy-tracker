/**
 * useProgressionManager Hook
 *
 * Domain-specific hook for progression state, workout stats,
 * sync metadata, and discrepancy handling.
 *
 * This hook receives the progression storage hook via dependency injection for:
 * - Easier unit testing with mocked storage
 * - Avoiding duplicate localStorage subscriptions
 * - Clear dependency graph
 */

import { useCallback } from 'react'
import type { UseProgressionStorageResult } from './useProgressionStorage'
import type { PendingChange, ProgressionState, Stage, Tier } from '@/types/state'

/**
 * Parameters for useProgressionManager hook.
 */
export interface UseProgressionManagerParams {
  /** Progression storage hook result */
  progressionStorage: UseProgressionStorageResult
}

/**
 * Result interface for useProgressionManager hook.
 */
export interface UseProgressionManagerResult {
  /** Set initial weight and stage for an exercise */
  setInitialWeight: (exerciseId: string, weight: number, stage?: Stage) => void

  /** Set progression by an arbitrary key (for role-tier keys like "squat-T1") */
  setProgressionByKey: (
    key: string,
    exerciseId: string,
    weight: number,
    stage?: Stage
  ) => void

  /** Update a single exercise's progression */
  updateProgression: (exerciseId: string, updates: Partial<ProgressionState>) => void

  /** Update multiple exercises' progressions at once */
  updateProgressionBatch: (progressionUpdates: Record<string, ProgressionState>) => void

  /** Set total workout count */
  setTotalWorkouts: (count: number) => void

  /** Set most recent workout date */
  setMostRecentWorkoutDate: (date: string | null) => void

  /** Set last sync timestamp */
  setLastSync: (timestamp: string) => void

  /** Set whether local state needs to be pushed to Hevy */
  setNeedsPush: (needsPush: boolean) => void

  /** Acknowledge a weight discrepancy between local and Hevy */
  acknowledgeDiscrepancy: (
    exerciseId: string,
    acknowledgedWeight: number,
    tier: Tier
  ) => void

  /** Clear all acknowledged discrepancies */
  clearAcknowledgedDiscrepancies: () => void

  /** Add a pending change to storage (for persisting sync results) */
  addPendingChange: (change: PendingChange) => void

  /** Clear all pending changes from storage */
  clearPendingChanges: () => void
}

/**
 * Hook for managing progression state, workout stats, sync metadata, and discrepancies.
 *
 * @example
 * ```tsx
 * const progressionStorage = useProgressionStorage()
 *
 * const {
 *   setInitialWeight,
 *   updateProgressionBatch,
 *   setLastSync,
 *   setNeedsPush,
 * } = useProgressionManager({ progressionStorage })
 *
 * // Set initial weight
 * setInitialWeight('squat-id', 100, 0)
 *
 * // Update after workout
 * updateProgressionBatch({ 'squat-id': updatedProgression })
 * setNeedsPush(true)
 *
 * // After sync
 * setLastSync(new Date().toISOString())
 * ```
 */
export function useProgressionManager({
  progressionStorage,
}: UseProgressionManagerParams): UseProgressionManagerResult {
  const setInitialWeight = useCallback(
    (exerciseId: string, weight: number, stage: Stage = 0) => {
      const existing = progressionStorage.store.progression[exerciseId]
      if (!existing) return

      progressionStorage.setProgression({
        ...progressionStorage.store.progression,
        [exerciseId]: {
          ...existing,
          currentWeight: weight,
          baseWeight: weight,
          stage,
        },
      })
    },
    [progressionStorage]
  )

  const setProgressionByKey = useCallback(
    (key: string, exerciseId: string, weight: number, stage: Stage = 0) => {
      progressionStorage.setProgressionByKey(key, exerciseId, weight, stage)
    },
    [progressionStorage]
  )

  const updateProgression = useCallback(
    (exerciseId: string, updates: Partial<ProgressionState>) => {
      progressionStorage.updateProgression(exerciseId, updates)
    },
    [progressionStorage]
  )

  const updateProgressionBatch = useCallback(
    (progressionUpdates: Record<string, ProgressionState>) => {
      progressionStorage.setProgression({
        ...progressionStorage.store.progression,
        ...progressionUpdates,
      })
    },
    [progressionStorage]
  )

  const setTotalWorkouts = useCallback(
    (count: number) => {
      progressionStorage.setTotalWorkouts(count)
    },
    [progressionStorage]
  )

  const setMostRecentWorkoutDate = useCallback(
    (date: string | null) => {
      progressionStorage.setMostRecentWorkoutDate(date)
    },
    [progressionStorage]
  )

  const setLastSync = useCallback(
    (timestamp: string) => {
      progressionStorage.setLastSync(timestamp)
    },
    [progressionStorage]
  )

  const setNeedsPush = useCallback(
    (needsPush: boolean) => {
      progressionStorage.setNeedsPush(needsPush)
    },
    [progressionStorage]
  )

  const acknowledgeDiscrepancy = useCallback(
    (exerciseId: string, acknowledgedWeight: number, tier: Tier) => {
      progressionStorage.acknowledgeDiscrepancy(exerciseId, acknowledgedWeight, tier)
    },
    [progressionStorage]
  )

  const clearAcknowledgedDiscrepancies = useCallback(() => {
    progressionStorage.clearAcknowledgedDiscrepancies()
  }, [progressionStorage])

  const addPendingChange = useCallback(
    (change: PendingChange) => {
      progressionStorage.addPendingChange(change)
    },
    [progressionStorage]
  )

  const clearPendingChanges = useCallback(() => {
    progressionStorage.clearPendingChanges()
  }, [progressionStorage])

  return {
    setInitialWeight,
    setProgressionByKey,
    updateProgression,
    updateProgressionBatch,
    setTotalWorkouts,
    setMostRecentWorkoutDate,
    setLastSync,
    setNeedsPush,
    acknowledgeDiscrepancy,
    clearAcknowledgedDiscrepancies,
    addPendingChange,
    clearPendingChanges,
  }
}
