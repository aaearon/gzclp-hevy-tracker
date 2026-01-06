/**
 * usePendingChanges Hook
 *
 * Manages pending changes state - apply, reject, and modify operations.
 */

import { useState, useCallback } from 'react'
import type { GZCLPDay, PendingChange, ProgressionState } from '@/types/state'
import { applyPendingChange, modifyPendingChangeWeight } from '@/lib/apply-changes'
import { DAY_CYCLE } from '@/lib/constants'

export interface UsePendingChangesProps {
  initialChanges: PendingChange[]
  progression: Record<string, ProgressionState>
  onProgressionUpdate: (progression: Record<string, ProgressionState>) => void
  /** Current day in the GZCLP rotation */
  currentDay: GZCLPDay
  /** Callback to advance to the next day */
  onDayAdvance: (nextDay: GZCLPDay) => void
  /** Callback to record a change in progression history (for charts) */
  onRecordHistory?: (change: PendingChange) => void
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
  const { initialChanges, progression, onProgressionUpdate, currentDay, onDayAdvance, onRecordHistory } = props
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>(initialChanges)

  /**
   * Apply a single change to the progression state.
   */
  const applyChange = useCallback(
    (change: PendingChange) => {
      // Apply the change to progression
      const updatedProgression = applyPendingChange(progression, change)
      onProgressionUpdate(updatedProgression)

      // Record to history for charts
      onRecordHistory?.(change)

      // Remove the applied change from pending
      setPendingChanges((prev) => prev.filter((c) => c.id !== change.id))
    },
    [progression, onProgressionUpdate, onRecordHistory]
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
   * Apply all pending changes at once and advance to the next day.
   */
  const applyAllChanges = useCallback(() => {
    if (pendingChanges.length === 0) return

    let currentProgression = progression
    for (const change of pendingChanges) {
      currentProgression = applyPendingChange(currentProgression, change)
      // Record each change to history for charts
      onRecordHistory?.(change)
    }
    onProgressionUpdate(currentProgression)
    setPendingChanges([])

    // Advance to the next day in the GZCLP rotation
    const nextDay = DAY_CYCLE[currentDay]
    onDayAdvance(nextDay)
  }, [pendingChanges, progression, onProgressionUpdate, currentDay, onDayAdvance, onRecordHistory])

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
