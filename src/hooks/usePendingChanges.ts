/**
 * usePendingChanges Hook
 *
 * Manages pending changes state - apply, reject, and modify operations.
 */

import { useState, useCallback } from 'react'
import type { PendingChange, ProgressionState } from '@/types/state'
import { applyPendingChange, modifyPendingChangeWeight } from '@/lib/apply-changes'

export interface UsePendingChangesProps {
  initialChanges: PendingChange[]
  progression: Record<string, ProgressionState>
  onProgressionUpdate: (progression: Record<string, ProgressionState>) => void
}

export interface UsePendingChangesResult {
  pendingChanges: PendingChange[]

  // Actions
  applyChange: (change: PendingChange) => void
  rejectChange: (changeId: string) => void
  modifyChange: (changeId: string, newWeight: number) => void
  applyAllChanges: () => void
  clearAllChanges: () => void
}

export function usePendingChanges(props: UsePendingChangesProps): UsePendingChangesResult {
  const { initialChanges, progression, onProgressionUpdate } = props
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>(initialChanges)

  /**
   * Apply a single change to the progression state.
   */
  const applyChange = useCallback(
    (change: PendingChange) => {
      // Apply the change to progression
      const updatedProgression = applyPendingChange(progression, change)
      onProgressionUpdate(updatedProgression)

      // Remove the applied change from pending
      setPendingChanges((prev) => prev.filter((c) => c.id !== change.id))
    },
    [progression, onProgressionUpdate]
  )

  /**
   * Reject a change - just remove it from pending without applying.
   */
  const rejectChange = useCallback((changeId: string) => {
    setPendingChanges((prev) => prev.filter((c) => c.id !== changeId))
  }, [])

  /**
   * Modify the weight of a pending change.
   */
  const modifyChange = useCallback((changeId: string, newWeight: number) => {
    setPendingChanges((prev) =>
      prev.map((c) => (c.id === changeId ? modifyPendingChangeWeight(c, newWeight) : c))
    )
  }, [])

  /**
   * Apply all pending changes at once.
   */
  const applyAllChanges = useCallback(() => {
    let currentProgression = progression
    for (const change of pendingChanges) {
      currentProgression = applyPendingChange(currentProgression, change)
    }
    onProgressionUpdate(currentProgression)
    setPendingChanges([])
  }, [pendingChanges, progression, onProgressionUpdate])

  /**
   * Clear all pending changes without applying.
   */
  const clearAllChanges = useCallback(() => {
    setPendingChanges([])
  }, [])

  return {
    pendingChanges,
    applyChange,
    rejectChange,
    modifyChange,
    applyAllChanges,
    clearAllChanges,
  }
}
