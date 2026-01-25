/**
 * ProgressionContext
 *
 * Provides progression state and mutations: progression data, pending changes, sync metadata.
 * Part of the granular context split to reduce unnecessary re-renders.
 *
 * Note: This context has no dependencies on other contexts. Exercise validation
 * during role changes is handled by useExerciseManagement in the facade layer.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useProgressionStorage, type UseProgressionStorageResult } from '@/hooks/useProgressionStorage'
import { useProgressionManager } from '@/hooks/useProgressionManager'
import type {
  ProgressionState,
  PendingChange,
  AcknowledgedDiscrepancy,
  Stage,
  Tier,
} from '@/types/state'

// =============================================================================
// Context Value Type
// =============================================================================

/**
 * Note: totalWorkouts and mostRecentWorkoutDate were removed (Task 2 - Derive Stats from History).
 * - totalWorkouts: Now derived from Hevy API response during sync
 * - mostRecentWorkoutDate: Now derived from progressionHistory via getMostRecentWorkoutDate()
 */
export interface ProgressionContextValue {
  // Read-only state
  progression: Record<string, ProgressionState>
  pendingChanges: PendingChange[]
  lastSync: string | null
  acknowledgedDiscrepancies: AcknowledgedDiscrepancy[]
  needsPush: boolean

  // Progression mutations
  setInitialWeight: (exerciseId: string, weight: number, stage?: Stage) => void
  setProgressionByKey: (key: string, exerciseId: string, weight: number, stage?: Stage) => void
  updateProgression: (exerciseId: string, updates: Partial<ProgressionState>) => void
  updateProgressionBatch: (progressionUpdates: Record<string, ProgressionState>) => void

  // Sync metadata
  setLastSync: (timestamp: string) => void
  setNeedsPush: (needsPush: boolean) => void

  // Discrepancy acknowledgment
  acknowledgeDiscrepancy: (exerciseId: string, acknowledgedWeight: number, tier: Tier) => void
  clearAcknowledgedDiscrepancies: () => void

  // Pending changes
  addPendingChange: (change: PendingChange) => void
  removePendingChange: (id: string) => void
  clearPendingChanges: () => void

  // Internal: expose storage for useProgram facade
  _progressionStorage: UseProgressionStorageResult
}

// =============================================================================
// Context Creation
// =============================================================================

const ProgressionContext = createContext<ProgressionContextValue | null>(null)

// =============================================================================
// Provider Props
// =============================================================================

export interface ProgressionProviderProps {
  children: ReactNode
}

// =============================================================================
// Provider Component
// =============================================================================

export function ProgressionProvider({ children }: ProgressionProviderProps) {
  // Use the storage hook
  const progressionStorage = useProgressionStorage()
  const { store: progressionStore } = progressionStorage

  // Use domain-specific hook for progression management
  const {
    setInitialWeight,
    setProgressionByKey,
    updateProgression,
    updateProgressionBatch,
    setLastSync,
    setNeedsPush,
    acknowledgeDiscrepancy,
    clearAcknowledgedDiscrepancies,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
  } = useProgressionManager({ progressionStorage })

  // Memoize the context value
  const value = useMemo((): ProgressionContextValue => ({
    // Read-only state
    progression: progressionStore.progression,
    pendingChanges: progressionStore.pendingChanges,
    lastSync: progressionStore.lastSync,
    acknowledgedDiscrepancies: progressionStore.acknowledgedDiscrepancies,
    needsPush: progressionStore.needsPush,

    // Mutations
    setInitialWeight,
    setProgressionByKey,
    updateProgression,
    updateProgressionBatch,
    setLastSync,
    setNeedsPush,
    acknowledgeDiscrepancy,
    clearAcknowledgedDiscrepancies,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,

    // Internal
    _progressionStorage: progressionStorage,
  }), [
    progressionStore,
    progressionStorage,
    setInitialWeight,
    setProgressionByKey,
    updateProgression,
    updateProgressionBatch,
    setLastSync,
    setNeedsPush,
    acknowledgeDiscrepancy,
    clearAcknowledgedDiscrepancies,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
  ])

  return (
    <ProgressionContext.Provider value={value}>
      {children}
    </ProgressionContext.Provider>
  )
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Access the progression context.
 * Must be used within a ProgressionProvider.
 *
 * @throws Error if used outside of ProgressionProvider
 */
export function useProgressionContext(): ProgressionContextValue {
  const context = useContext(ProgressionContext)

  if (!context) {
    throw new Error('useProgressionContext must be used within a ProgressionProvider')
  }

  return context
}

/**
 * Access the progression context without throwing.
 * Returns null if not within a provider.
 */
export function useProgressionContextOptional(): ProgressionContextValue | null {
  return useContext(ProgressionContext)
}

// =============================================================================
// Selector Hooks
// =============================================================================

/**
 * Get all progressions.
 */
export function useProgressions(): Record<string, ProgressionState> {
  const { progression } = useProgressionContext()
  return progression
}

/**
 * Get progression for a specific key.
 */
export function useProgressionForKey(key: string): ProgressionState | undefined {
  const { progression } = useProgressionContext()
  return progression[key]
}

/**
 * Get pending changes.
 */
export function usePendingChanges(): PendingChange[] {
  const { pendingChanges } = useProgressionContext()
  return pendingChanges
}

/**
 * Get sync metadata.
 */
export function useSyncMetadata(): {
  lastSync: string | null
  needsPush: boolean
} {
  const { lastSync, needsPush } = useProgressionContext()
  return { lastSync, needsPush }
}
