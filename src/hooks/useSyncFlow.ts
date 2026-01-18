/**
 * useSyncFlow Hook
 *
 * Orchestrates workout synchronization with Hevy, including auto-sync on mount.
 * [Task 3.2] Extracted from Dashboard/index.tsx to reduce component size.
 */

import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { useProgression, type DiscrepancyInfo } from './useProgression'
import { DAY_CYCLE } from '@/lib/constants'
import type {
  ExerciseConfig,
  ExerciseHistory,
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
  /** Progression history - used to derive processed workout IDs */
  progressionHistory: Record<string, ExerciseHistory>
  /** Called to advance to the next day when a workout is detected */
  onDayAdvance?: (nextDay: GZCLPDay) => void
  /** Current day in the app state - used for day mismatch detection */
  currentDay?: GZCLPDay | undefined
  /** Current total workouts count */
  totalWorkouts?: number
  /** Called to update total workouts when new workouts are synced */
  onTotalWorkoutsUpdate?: (total: number) => void
  /** Called to auto-apply changes that don't require review */
  onAutoApplyChange?: (change: PendingChange) => void
}

export interface UseSyncFlowReturn {
  isSyncing: boolean
  syncError: string | null
  /** Only changes that require user review (have discrepancies) */
  syncPendingChanges: PendingChange[]
  discrepancies: DiscrepancyInfo[]
  /** Number of changes that were auto-applied during sync */
  autoAppliedCount: number
  /** Actual changes that were auto-applied (for detailed toast messages) */
  autoAppliedChanges: PendingChange[]
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
    progressionHistory,
    onDayAdvance,
    currentDay,
    totalWorkouts = 0,
    onTotalWorkoutsUpdate,
    onAutoApplyChange,
  } = options

  // Track whether auto-sync has already been triggered
  const hasAutoSynced = useRef(false)
  // Track which changes have been recorded to history
  const recordedChangeIds = useRef(new Set<string>())
  // Track whether we've already advanced for the current detected day
  const lastAdvancedDay = useRef<GZCLPDay | null>(null)
  // Track last processed workout count to avoid double-counting
  const lastNewWorkoutsCount = useRef(0)
  // Track which changes have been auto-applied
  const autoAppliedChangeIds = useRef(new Set<string>())

  // State for auto-apply tracking
  const [autoAppliedCount, setAutoAppliedCount] = useState(0)
  const [autoAppliedChanges, setAutoAppliedChanges] = useState<PendingChange[]>([])

  // Use the progression hook for actual sync functionality
  const {
    isSyncing,
    syncError,
    pendingChanges: syncPendingChanges,
    discrepancies,
    detectedWorkoutDay,
    newWorkoutsCount,
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
    progressionHistory,
    currentDay,
  })

  // Categorize changes into auto-apply vs conflicts
  // Changes require review only if they have a discrepancy (user lifted different weight than expected)
  // Deloads are deterministic GZCLP behavior and auto-apply with toast notification
  const { autoApplyChanges, conflictingChanges } = useMemo(() => {
    const autoApply: PendingChange[] = []
    const conflicts: PendingChange[] = []

    for (const change of syncPendingChanges) {
      // Skip already auto-applied changes
      if (autoAppliedChangeIds.current.has(change.id)) {
        continue
      }

      // Requires review only if has discrepancy (actual weight !== stored weight)
      // Deloads without discrepancy are auto-applied
      const hasDiscrepancy = Boolean(change.discrepancy)

      if (hasDiscrepancy) {
        conflicts.push(change)
      } else {
        autoApply.push(change)
      }
    }

    return { autoApplyChanges: autoApply, conflictingChanges: conflicts }
  }, [syncPendingChanges])

  // Auto-apply non-conflicting changes
  // Note: Processed workout IDs are now derived from progressionHistory,
  // so we don't need to track them separately
  useEffect(() => {
    if (autoApplyChanges.length === 0 || !onAutoApplyChange) return

    const newlyApplied: PendingChange[] = []

    for (const change of autoApplyChanges) {
      // Skip if already auto-applied
      if (autoAppliedChangeIds.current.has(change.id)) continue

      console.debug(`[useSyncFlow] Auto-applying change: ${change.exerciseName} (${change.tier})`)
      autoAppliedChangeIds.current.add(change.id)
      onAutoApplyChange(change)
      newlyApplied.push(change)
    }

    // Update auto-applied count and changes
    if (newlyApplied.length > 0) {
      setAutoAppliedCount(autoAppliedChangeIds.current.size)
      setAutoAppliedChanges((prev) => [...prev, ...newlyApplied])
    }
  }, [autoApplyChanges, onAutoApplyChange])

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

  // Update total workouts count when new workouts are synced
  // This derives the count from sync rather than manual increment on apply
  useEffect(() => {
    if (newWorkoutsCount <= 0 || !onTotalWorkoutsUpdate) return
    // Only update if the count changed (avoid duplicate updates)
    if (lastNewWorkoutsCount.current === newWorkoutsCount) return

    lastNewWorkoutsCount.current = newWorkoutsCount
    const newTotal = totalWorkouts + newWorkoutsCount
    console.debug(`[useSyncFlow] Updating totalWorkouts: ${totalWorkouts} + ${newWorkoutsCount} = ${newTotal}`)
    onTotalWorkoutsUpdate(newTotal)
  }, [newWorkoutsCount, totalWorkouts, onTotalWorkoutsUpdate])

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
    syncPendingChanges: conflictingChanges, // Only return changes that need review
    discrepancies,
    autoAppliedCount,
    autoAppliedChanges,
    handleSync,
    clearError,
    clearSyncPendingChanges,
  }
}
