/**
 * useProgressionStorage Hook
 *
 * Manages progression state in localStorage (progression, pendingChanges, sync metadata).
 * Part of the split storage system for optimized state management.
 */

import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import type { ProgressionStore } from '@/types/storage'
import type {
  ProgressionState,
  PendingChange,
  AcknowledgedDiscrepancy,
  Tier,
  Stage,
} from '@/types/state'

// =============================================================================
// Default Values
// =============================================================================

function createDefaultProgressionStore(): ProgressionStore {
  return {
    progression: {},
    pendingChanges: [],
    lastSync: null,
    totalWorkouts: 0,
    mostRecentWorkoutDate: null,
    acknowledgedDiscrepancies: [],
    needsPush: false,
  }
}

// =============================================================================
// Hook Result Type
// =============================================================================

export interface UseProgressionStorageResult {
  /** Current progression store */
  store: ProgressionStore

  // Progression
  setProgression: (progression: Record<string, ProgressionState>) => void
  updateProgression: (key: string, updates: Partial<ProgressionState>) => void
  setProgressionByKey: (
    key: string,
    exerciseId: string,
    weight: number,
    stage?: Stage
  ) => void
  removeProgression: (key: string) => void

  // Pending Changes
  setPendingChanges: (changes: PendingChange[]) => void
  addPendingChange: (change: PendingChange) => void
  removePendingChange: (id: string) => void
  clearPendingChanges: () => void

  // Sync Metadata
  setLastSync: (timestamp: string | null) => void
  setTotalWorkouts: (count: number) => void
  setMostRecentWorkoutDate: (date: string | null) => void
  setNeedsPush: (needsPush: boolean) => void

  // Discrepancy Acknowledgment
  acknowledgeDiscrepancy: (exerciseId: string, weight: number, tier: Tier) => void
  clearAcknowledgedDiscrepancies: () => void

  // Full state management
  resetProgression: () => void
  importProgression: (store: ProgressionStore) => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useProgressionStorage(): UseProgressionStorageResult {
  const [rawStore, setRawStore, removeStore] = useLocalStorage<ProgressionStore>(
    STORAGE_KEYS.PROGRESSION,
    createDefaultProgressionStore()
  )

  // Ensure store has all required fields
  const store = useMemo((): ProgressionStore => {
    const defaultStore = createDefaultProgressionStore()
    return {
      ...defaultStore,
      ...rawStore,
      pendingChanges: rawStore.pendingChanges ?? [],
      acknowledgedDiscrepancies: rawStore.acknowledgedDiscrepancies ?? [],
      needsPush: rawStore.needsPush ?? false,
    }
  }, [rawStore])

  // Progression
  const setProgression = useCallback(
    (progression: Record<string, ProgressionState>) => {
      setRawStore((prev) => ({ ...prev, progression }))
    },
    [setRawStore]
  )

  const updateProgression = useCallback(
    (key: string, updates: Partial<ProgressionState>) => {
      setRawStore((prev) => {
        const existing = prev.progression[key]
        if (!existing) return prev
        return {
          ...prev,
          progression: {
            ...prev.progression,
            [key]: { ...existing, ...updates },
          },
        }
      })
    },
    [setRawStore]
  )

  const setProgressionByKey = useCallback(
    (key: string, exerciseId: string, weight: number, stage: Stage = 0) => {
      setRawStore((prev) => ({
        ...prev,
        progression: {
          ...prev.progression,
          [key]: {
            exerciseId,
            currentWeight: weight,
            baseWeight: weight,
            stage,
            lastWorkoutId: null,
            lastWorkoutDate: null,
            amrapRecord: 0,
          },
        },
      }))
    },
    [setRawStore]
  )

  const removeProgression = useCallback(
    (key: string) => {
      setRawStore((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: removed, ...remaining } = prev.progression
        return {
          ...prev,
          progression: remaining,
          pendingChanges: prev.pendingChanges.filter((c) => c.progressionKey !== key),
        }
      })
    },
    [setRawStore]
  )

  // Pending Changes
  const setPendingChanges = useCallback(
    (changes: PendingChange[]) => {
      setRawStore((prev) => ({ ...prev, pendingChanges: changes }))
    },
    [setRawStore]
  )

  const addPendingChange = useCallback(
    (change: PendingChange) => {
      setRawStore((prev) => ({
        ...prev,
        pendingChanges: [...prev.pendingChanges, change],
      }))
    },
    [setRawStore]
  )

  const removePendingChange = useCallback(
    (id: string) => {
      setRawStore((prev) => ({
        ...prev,
        pendingChanges: prev.pendingChanges.filter((c) => c.id !== id),
      }))
    },
    [setRawStore]
  )

  const clearPendingChanges = useCallback(() => {
    setRawStore((prev) => ({ ...prev, pendingChanges: [] }))
  }, [setRawStore])

  // Sync Metadata
  const setLastSync = useCallback(
    (timestamp: string | null) => {
      setRawStore((prev) => ({ ...prev, lastSync: timestamp }))
    },
    [setRawStore]
  )

  const setTotalWorkouts = useCallback(
    (count: number) => {
      setRawStore((prev) => ({ ...prev, totalWorkouts: count }))
    },
    [setRawStore]
  )

  const setMostRecentWorkoutDate = useCallback(
    (date: string | null) => {
      setRawStore((prev) => ({ ...prev, mostRecentWorkoutDate: date }))
    },
    [setRawStore]
  )

  const setNeedsPush = useCallback(
    (needsPush: boolean) => {
      setRawStore((prev) => ({ ...prev, needsPush }))
    },
    [setRawStore]
  )

  // Discrepancy Acknowledgment
  const acknowledgeDiscrepancy = useCallback(
    (exerciseId: string, weight: number, tier: Tier) => {
      setRawStore((prev) => {
        const existing = prev.acknowledgedDiscrepancies ?? []
        const alreadyAcknowledged = existing.some(
          (d) =>
            d.exerciseId === exerciseId &&
            d.acknowledgedWeight === weight &&
            d.tier === tier
        )
        if (alreadyAcknowledged) return prev

        const newAcknowledgment: AcknowledgedDiscrepancy = {
          exerciseId,
          acknowledgedWeight: weight,
          tier,
        }
        return {
          ...prev,
          acknowledgedDiscrepancies: [...existing, newAcknowledgment],
        }
      })
    },
    [setRawStore]
  )

  const clearAcknowledgedDiscrepancies = useCallback(() => {
    setRawStore((prev) => ({ ...prev, acknowledgedDiscrepancies: [] }))
  }, [setRawStore])

  // Full state management
  const resetProgression = useCallback(() => {
    removeStore()
  }, [removeStore])

  const importProgression = useCallback(
    (newStore: ProgressionStore) => {
      setRawStore(newStore)
    },
    [setRawStore]
  )

  return {
    store,
    setProgression,
    updateProgression,
    setProgressionByKey,
    removeProgression,
    setPendingChanges,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    setLastSync,
    setTotalWorkouts,
    setMostRecentWorkoutDate,
    setNeedsPush,
    acknowledgeDiscrepancy,
    clearAcknowledgedDiscrepancies,
    resetProgression,
    importProgression,
  }
}
