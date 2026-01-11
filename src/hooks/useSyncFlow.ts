/**
 * useSyncFlow Hook
 *
 * Orchestrates workout synchronization with Hevy, including auto-sync on mount.
 * [Task 3.2] Extracted from Dashboard/index.tsx to reduce component size.
 */

import { useRef, useCallback, useEffect } from 'react'
import { useProgression, type DiscrepancyInfo } from './useProgression'
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
}

export interface UseSyncFlowReturn {
  isSyncing: boolean
  syncError: string | null
  syncPendingChanges: PendingChange[]
  discrepancies: DiscrepancyInfo[]
  handleSync: () => Promise<void>
  clearError: () => void
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
  } = options

  // Track whether auto-sync has already been triggered
  const hasAutoSynced = useRef(false)
  // Track which changes have been recorded to history
  const recordedChangeIds = useRef(new Set<string>())

  // Use the progression hook for actual sync functionality
  const {
    isSyncing,
    syncError,
    pendingChanges: syncPendingChanges,
    discrepancies,
    syncWorkouts,
    clearError,
  } = useProgression({
    apiKey,
    exercises,
    progression,
    settings,
    lastSync,
    hevyRoutineIds,
  })

  // Auto-sync on mount when conditions are met
  useEffect(() => {
    if (!hasAutoSynced.current && isOnline && !isSyncing && apiKey) {
      hasAutoSynced.current = true
      void syncWorkouts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  }
}
