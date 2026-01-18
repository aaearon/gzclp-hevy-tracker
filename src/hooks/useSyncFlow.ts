/**
 * useSyncFlow Hook
 *
 * Orchestrates workout synchronization with Hevy, including auto-sync on mount.
 * [Task 3.2] Extracted from Dashboard/index.tsx to reduce component size.
 */

import { useRef, useCallback, useEffect } from 'react'
import { useProgression, type DiscrepancyInfo } from './useProgression'
import { DAY_CYCLE } from '@/lib/constants'
import type {
  ExerciseConfig,
  GZCLPDay,
  PendingChange,
  ProgressionState,
  UserSettings,
} from '@/types/state'

// =============================================================================
// Types
// =============================================================================

export interface UseSyncFlowOptions {
  apiKey: string
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  settings: UserSettings
  lastSync: string | null
  hevyRoutineIds: Record<GZCLPDay, string | null>
  isOnline: boolean
  onLastSyncUpdate: (timestamp: string) => void
  /** Called to record each workout to progression history for charts */
  onRecordHistory?: (change: PendingChange) => void
  /** IDs of workouts that have already been processed (prevents reprocessing) */
  processedWorkoutIds?: string[]
  /** Called to advance to the next day when a workout is detected */
  onDayAdvance?: (nextDay: GZCLPDay) => void
  /** Current day in the app state - used for day mismatch detection */
  currentDay?: GZCLPDay | undefined
}

export interface UseSyncFlowReturn {
  isSyncing: boolean
  syncError: string | null
  syncPendingChanges: PendingChange[]
  discrepancies: DiscrepancyInfo[]
  handleSync: () => Promise<void>
  clearError: () => void
  /** Clear sync pending changes after they've been applied */
  clearSyncPendingChanges: () => void
}

// =============================================================================
// Hook
// =============================================================================

export function useSyncFlow(options: UseSyncFlowOptions): UseSyncFlowReturn {
  const {
    apiKey,
    exercises,
    progression,
    settings,
    lastSync,
    hevyRoutineIds,
    isOnline,
    onLastSyncUpdate,
    onRecordHistory,
    processedWorkoutIds,
    onDayAdvance,
    currentDay,
  } = options

  // Track whether auto-sync has already been triggered
  const hasAutoSynced = useRef(false)
  // Track which changes have been recorded to history
  const recordedChangeIds = useRef(new Set<string>())
  // Track whether we've already advanced for the current detected day
  const lastAdvancedDay = useRef<GZCLPDay | null>(null)

  // Use the progression hook for actual sync functionality
  const {
    isSyncing,
    syncError,
    pendingChanges: syncPendingChanges,
    discrepancies,
    detectedWorkoutDay,
    syncWorkouts,
    clearError,
    clearPendingChanges: clearSyncPendingChanges,
  } = useProgression({
    apiKey,
    exercises,
    progression,
    settings,
    lastSync,
    hevyRoutineIds,
    processedWorkoutIds,
    currentDay,
  })

  // Auto-sync on mount when conditions are met
  useEffect(() => {
    if (!hasAutoSynced.current && isOnline && !isSyncing && apiKey) {
      hasAutoSynced.current = true
      void syncWorkouts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-advance day when a new workout is detected
  // This decouples day advancement from applying pending changes
  useEffect(() => {
    if (!detectedWorkoutDay || !onDayAdvance) return
    // Only advance if this is a new detection (not the same day we already advanced for)
    if (lastAdvancedDay.current === detectedWorkoutDay) return

    const nextDay = DAY_CYCLE[detectedWorkoutDay]
    console.debug(`[useSyncFlow] Auto-advancing day: ${detectedWorkoutDay} -> ${nextDay}`)
    lastAdvancedDay.current = detectedWorkoutDay
    onDayAdvance(nextDay)
  }, [detectedWorkoutDay, onDayAdvance])

  // Record sync results to progression history for charts
  // This runs whenever new pending changes come from sync
  useEffect(() => {
    if (!onRecordHistory || syncPendingChanges.length === 0) return

    for (const change of syncPendingChanges) {
      // Only record each change once
      if (!recordedChangeIds.current.has(change.id)) {
        recordedChangeIds.current.add(change.id)
        onRecordHistory(change)
      }
    }
  }, [syncPendingChanges, onRecordHistory])

  // Handle manual sync and update timestamp
  const handleSync = useCallback(async () => {
    try {
      await syncWorkouts()
      onLastSyncUpdate(new Date().toISOString())
    } catch (error) {
      // Errors from syncWorkouts are already handled in useProgression
      // This catch is a safety net for any unexpected errors
      console.error('Sync failed:', error)
    }
  }, [syncWorkouts, onLastSyncUpdate])

  return {
    isSyncing,
    syncError,
    syncPendingChanges,
    discrepancies,
    handleSync,
    clearError,
    clearSyncPendingChanges,
  }
}
