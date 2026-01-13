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
  /** Callback when all pending changes have been applied (for cleanup) */
  onAllChangesApplied?: () => void
  /** Callback to mark workout IDs as processed (prevents reprocessing on next sync) */
  onAddProcessedWorkoutIds?: (workoutIds: string[]) => void
  /** Callback when a change is rejected (to remove from localStorage) */
  onRejectChange?: (changeId: string, workoutId: string) => void
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
  const { initialChanges, progression, onProgressionUpdate, currentDay, onDayAdvance, onRecordHistory, onWorkoutComplete, onAllChangesApplied, onAddProcessedWorkoutIds, onRejectChange } = props
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>(initialChanges)

  // Track which change IDs we've "seen" from initialChanges to avoid re-adding rejected items
  const seenChangeIds = useRef(new Set(initialChanges.map((c) => c.id)))

  // Sync local state when external sources change
  // - When cleared: reset local state to empty (also reset seen IDs)
  // - When new changes arrive: merge them into local state (but not if user already rejected them)
  // This ensures pending changes from sync are immediately visible in ReviewModal
  // Uses functional state update to avoid stale closure issues
  useEffect(() => {
    if (initialChanges.length === 0) {
      // External sources cleared - reset local state and seen tracking
      setPendingChanges((currentPending) => {
        if (currentPending.length > 0) {
          seenChangeIds.current.clear()
          return []
        }
        return currentPending
      })
    } else {
      // Find truly NEW changes using functional update to access latest state
      setPendingChanges((currentPending) => {
        const existingIds = new Set(currentPending.map((c) => c.id))
        const newChanges = initialChanges.filter(
          (c) => !existingIds.has(c.id) && !seenChangeIds.current.has(c.id)
        )

        if (newChanges.length > 0) {
          // Mark new changes as seen
          newChanges.forEach((c) => seenChangeIds.current.add(c.id))
          return [...currentPending, ...newChanges]
        }
        return currentPending
      })
    }
  }, [initialChanges])

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
   * When this is the last pending change, also advance the day and update stats.
   */
  const applyChange = useCallback(
    (change: PendingChange) => {
      // Collect OLD lastWorkoutId that will be replaced (to prevent it from being "orphaned")
      const existingProgression = progression[change.progressionKey]
      const oldLastWorkoutId = existingProgression?.lastWorkoutId

      // Apply the change to progression
      const updatedProgression = applyPendingChange(progression, change)
      onProgressionUpdate(updatedProgression)

      // Mark both old and new workout IDs as processed to prevent reprocessing on future syncs
      const workoutIdsToAdd = oldLastWorkoutId
        ? [oldLastWorkoutId, change.workoutId]
        : [change.workoutId]
      onAddProcessedWorkoutIds?.(workoutIdsToAdd)

      // Record to history for charts
      onRecordHistory?.(change)

      // Check if this is the last pending change
      const remainingChanges = pendingChanges.filter((c) => c.id !== change.id)
      const isLastChange = remainingChanges.length === 0

      // Remove the applied change from pending
      setPendingChanges(remainingChanges)

      // When the last change is applied, advance day, update stats, and cleanup
      if (isLastChange) {
        const nextDay = DAY_CYCLE[currentDay]
        onDayAdvance(nextDay)
        onWorkoutComplete?.(change.workoutDate)
        onAllChangesApplied?.()
      }
    },
    [progression, onProgressionUpdate, onAddProcessedWorkoutIds, onRecordHistory, pendingChanges, currentDay, onDayAdvance, onWorkoutComplete, onAllChangesApplied]
  )

  /**
   * Reject a change - store for potential undo [Task 4.2]
   */
  const rejectChange = useCallback((changeId: string) => {
    setPendingChanges((prev) => {
      const change = prev.find((c) => c.id === changeId)
      if (change) {
        // Remove from localStorage and mark workout as processed to prevent re-appearance
        onRejectChange?.(changeId, change.workoutId)
        // Also add to processedWorkoutIds so this workout won't be re-synced
        onAddProcessedWorkoutIds?.([change.workoutId])

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
  }, [onRejectChange, onAddProcessedWorkoutIds])

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
    const workoutIds = new Set<string>()

    // Collect OLD lastWorkoutIds that will be replaced - these need to be marked as processed
    // to prevent them from being "orphaned" when overwritten with newer workout IDs
    for (const change of pendingChanges) {
      const existingProgression = progression[change.progressionKey]
      if (existingProgression?.lastWorkoutId) {
        workoutIds.add(existingProgression.lastWorkoutId)
      }
    }

    for (const change of pendingChanges) {
      currentProgression = applyPendingChange(currentProgression, change)
      // Record each change to history for charts
      onRecordHistory?.(change)
      // Collect new workout IDs
      workoutIds.add(change.workoutId)
      // Track the most recent workout date
      if (!mostRecentDate || change.workoutDate > mostRecentDate) {
        mostRecentDate = change.workoutDate
      }
    }
    onProgressionUpdate(currentProgression)

    // Mark all workouts (old AND new) as processed to prevent reprocessing on future syncs
    onAddProcessedWorkoutIds?.([...workoutIds])

    setPendingChanges([])

    // Advance to the next day in the GZCLP rotation
    const nextDay = DAY_CYCLE[currentDay]
    onDayAdvance(nextDay)

    // Update workout stats
    if (mostRecentDate) {
      onWorkoutComplete?.(mostRecentDate)
    }

    // Notify that all changes have been applied (for cleanup)
    onAllChangesApplied?.()
  }, [pendingChanges, progression, onProgressionUpdate, onAddProcessedWorkoutIds, currentDay, onDayAdvance, onRecordHistory, onWorkoutComplete, onAllChangesApplied])

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
