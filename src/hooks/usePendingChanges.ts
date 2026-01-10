/**
 * usePendingChanges Hook
 *
 * Manages pending changes state - apply, reject, and modify operations.
 * [Task 4.2] Added undo reject functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { GZCLPDay, PendingChange, ProgressionState } from '@/types/state'
import { applyPendingChange, modifyPendingChangeWeight } from '@/lib/apply-changes'
import { DAY_CYCLE } from '@/lib/constants'

/** How long to keep rejected change available for undo (ms) */
const UNDO_TIMEOUT_MS = 5000

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
  /** Callback when a workout is completed (for updating stats) */
  onWorkoutComplete?: (workoutDate: string) => void
}

export interface UsePendingChangesResult {
  pendingChanges: PendingChange[]

  // Undo state [Task 4.2]
  recentlyRejected: PendingChange | null

  // Actions
  applyChange: (change: PendingChange) => void
  rejectChange: (changeId: string) => void
  modifyChange: (changeId: string, newWeight: number) => void
  applyAllChanges: () => void
  clearAllChanges: () => void
  undoReject: () => void
}

export function usePendingChanges(props: UsePendingChangesProps): UsePendingChangesResult {
  const { initialChanges, progression, onProgressionUpdate, currentDay, onDayAdvance, onRecordHistory, onWorkoutComplete } = props
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>(initialChanges)

  // Undo state [Task 4.2]
  const [recentlyRejected, setRecentlyRejected] = useState<PendingChange | null>(null)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount [Task 4.2]
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }
    }
  }, [])

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
   * Reject a change - store for potential undo [Task 4.2]
   */
  const rejectChange = useCallback((changeId: string) => {
    setPendingChanges((prev) => {
      const change = prev.find((c) => c.id === changeId)
      if (change) {
        // Store for undo
        setRecentlyRejected(change)

        // Clear previous timeout
        if (undoTimeoutRef.current) {
          clearTimeout(undoTimeoutRef.current)
        }

        // Set new timeout to clear after 5 seconds
        undoTimeoutRef.current = setTimeout(() => {
          setRecentlyRejected(null)
        }, UNDO_TIMEOUT_MS)
      }
      return prev.filter((c) => c.id !== changeId)
    })
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
    let mostRecentDate: string | null = null

    for (const change of pendingChanges) {
      currentProgression = applyPendingChange(currentProgression, change)
      // Record each change to history for charts
      onRecordHistory?.(change)
      // Track the most recent workout date
      if (!mostRecentDate || change.workoutDate > mostRecentDate) {
        mostRecentDate = change.workoutDate
      }
    }
    onProgressionUpdate(currentProgression)
    setPendingChanges([])

    // Advance to the next day in the GZCLP rotation
    const nextDay = DAY_CYCLE[currentDay]
    onDayAdvance(nextDay)

    // Update workout stats
    if (mostRecentDate) {
      onWorkoutComplete?.(mostRecentDate)
    }
  }, [pendingChanges, progression, onProgressionUpdate, currentDay, onDayAdvance, onRecordHistory, onWorkoutComplete])

  /**
   * Clear all pending changes without applying.
   */
  const clearAllChanges = useCallback(() => {
    setPendingChanges([])
  }, [])

  /**
   * Undo the last reject action [Task 4.2]
   */
  const undoReject = useCallback(() => {
    if (recentlyRejected) {
      // Restore the rejected change
      setPendingChanges((prev) => [...prev, recentlyRejected])

      // Clear the undo state
      setRecentlyRejected(null)

      // Cancel the timeout
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
        undoTimeoutRef.current = null
      }
    }
  }, [recentlyRejected])

  return {
    pendingChanges,
    recentlyRejected,
    applyChange,
    rejectChange,
    modifyChange,
    applyAllChanges,
    clearAllChanges,
    undoReject,
  }
}
