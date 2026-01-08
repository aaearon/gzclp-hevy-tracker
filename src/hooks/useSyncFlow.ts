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
  } = options

  // Track whether auto-sync has already been triggered
  const hasAutoSynced = useRef(false)

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

  // Handle manual sync and update timestamp
  const handleSync = useCallback(async () => {
    await syncWorkouts()
    onLastSyncUpdate(new Date().toISOString())
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
