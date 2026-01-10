/**
 * Dashboard Component
 *
 * Main dashboard displaying all exercises, progression state, and pending changes.
 * Integrates sync functionality, discrepancy handling, review modal, and Hevy updates.
 *
 * [T057] Sync functionality and discrepancy handling
 * [T067] ReviewModal integration with pending changes indicator
 * [T077] Hevy update functionality
 * [Task 3.1] Component decomposition - extracted DashboardHeader, DashboardAlerts, DashboardContent
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useProgram } from '@/hooks/useProgram'
import { useSyncFlow } from '@/hooks/useSyncFlow'
import { usePendingChanges } from '@/hooks/usePendingChanges'
import { usePushDialog } from '@/hooks/usePushDialog'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { createHevyClient } from '@/lib/hevy-client'
import { importProgressionHistory, backfillAmrapRecords, applyAmrapBackfill } from '@/lib/history-importer'
import type { GZCLPDay, ProgressionState } from '@/types/state'
import { DashboardHeader } from './DashboardHeader'
import { DashboardAlerts } from './DashboardAlerts'
import { DashboardContent } from './DashboardContent'
import { ReviewModal } from '@/components/ReviewModal'
import { OfflineIndicator } from '@/components/common/OfflineIndicator'
import { PushConfirmDialog } from './PushConfirmDialog'

export function Dashboard() {
  const {
    state,
    updateProgressionBatch,
    setLastSync,
    setNeedsPush,
    setHevyRoutineIds,
    setCurrentDay,
    recordHistoryEntry,
    setProgressionHistory,
    acknowledgeDiscrepancy,
    setTotalWorkouts,
    setMostRecentWorkoutDate,
  } = useProgram()
  const { exercises, progression, settings, program, lastSync, apiKey, pendingChanges: storedPendingChanges, t3Schedule, progressionHistory } = state
  // Fallback for pre-migration states that don't have acknowledgedDiscrepancies
  const acknowledgedDiscrepancies = state.acknowledgedDiscrepancies ?? []

  // Local state for modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  // Track seen change IDs to avoid re-processing
  const previousChangeIds = useRef<Set<string>>(new Set())

  // Online status for offline detection [T102]
  const { isOnline, isHevyReachable, checkHevyConnection } = useOnlineStatus()

  // Check Hevy connection when coming back online
  useEffect(() => {
    if (isOnline) {
      void checkHevyConnection()
    }
  }, [isOnline, checkHevyConnection])

  // Use sync flow hook for sync orchestration [Task 3.2]
  const {
    isSyncing,
    syncError,
    syncPendingChanges,
    discrepancies,
    handleSync,
    clearError,
  } = useSyncFlow({
    apiKey,
    exercises,
    progression,
    settings,
    lastSync,
    hevyRoutineIds: program.hevyRoutineIds,
    isOnline,
    onLastSyncUpdate: setLastSync,
    onRecordHistory: recordHistoryEntry, // Record to history immediately on sync
  })

  // Handle progression updates from pending changes
  const handleProgressionUpdate = useCallback(
    (newProgression: Record<string, ProgressionState>) => {
      updateProgressionBatch(newProgression)
      // Mark that local state now differs from Hevy and needs to be pushed
      setNeedsPush(true)
    },
    [updateProgressionBatch, setNeedsPush]
  )

  // Handle day advancement after applying all changes
  const handleDayAdvance = useCallback(
    (nextDay: GZCLPDay) => {
      setCurrentDay(nextDay)
    },
    [setCurrentDay]
  )

  // Handle workout completion - update stats
  const handleWorkoutComplete = useCallback(
    (workoutDate: string) => {
      setTotalWorkouts(state.totalWorkouts + 1)
      setMostRecentWorkoutDate(workoutDate)
    },
    [state.totalWorkouts, setTotalWorkouts, setMostRecentWorkoutDate]
  )

  // Merge stored pending changes with sync-generated ones
  const mergedPendingChanges = useMemo(() => {
    const existingIds = new Set(storedPendingChanges.map((c) => c.id))
    const newFromSync = syncPendingChanges.filter((c) => !existingIds.has(c.id))
    return [...storedPendingChanges, ...newFromSync]
  }, [storedPendingChanges, syncPendingChanges])

  // Track seen changes to avoid re-processing on future syncs
  useEffect(() => {
    if (syncPendingChanges.length === 0) return
    syncPendingChanges.forEach((c) => previousChangeIds.current.add(c.id))
  }, [syncPendingChanges])

  // Use pending changes hook
  const {
    pendingChanges,
    recentlyRejected,
    applyChange,
    rejectChange,
    modifyChange,
    applyAllChanges,
    undoReject,
  } = usePendingChanges({
    initialChanges: mergedPendingChanges,
    progression,
    onProgressionUpdate: handleProgressionUpdate,
    currentDay: program.currentDay,
    onDayAdvance: handleDayAdvance,
    onRecordHistory: recordHistoryEntry,
    onWorkoutComplete: handleWorkoutComplete,
  })

  // Create Hevy client
  const hevyClient = useMemo(() => {
    if (!apiKey) return null
    return createHevyClient(apiKey)
  }, [apiKey])

  // Auto-import progression history if empty (for users who set up before this feature)
  const hasImportedHistory = useRef(false)
  useEffect(() => {
    // Only run once, when history is empty and we have all required data
    if (hasImportedHistory.current) return
    if (!apiKey || !hevyClient) return
    if (Object.keys(exercises).length === 0) return
    if (Object.keys(progressionHistory).length > 0) return // Already has history

    const routineIdsConfigured = Object.values(program.hevyRoutineIds).some((id) => id !== null)
    if (!routineIdsConfigured) return

    hasImportedHistory.current = true

    // Import historical data in background
    void (async () => {
      try {
        const result = await importProgressionHistory(
          hevyClient,
          exercises,
          program.hevyRoutineIds
        )
        if (result.entryCount > 0) {
          setProgressionHistory(result.history)
        }
      } catch {
        // Silently fail - charts will just be empty
      }
    })()
  }, [apiKey, hevyClient, exercises, progressionHistory, program.hevyRoutineIds, setProgressionHistory])

  // Auto-backfill AMRAP records if they're missing dates (for migration/new feature)
  const hasBackfilledAmrap = useRef(false)
  useEffect(() => {
    // Only run once
    if (hasBackfilledAmrap.current) return
    if (!apiKey || !hevyClient) return
    if (Object.keys(exercises).length === 0) return
    if (Object.keys(progression).length === 0) return

    // Check if we need to backfill (has amrapRecord but no amrapRecordDate)
    const needsBackfill = Object.values(progression).some(
      (p) => p.amrapRecord > 0 && !p.amrapRecordDate
    )
    if (!needsBackfill) return

    const routineIdsConfigured = Object.values(program.hevyRoutineIds).some((id) => id !== null)
    if (!routineIdsConfigured) return

    hasBackfilledAmrap.current = true

    // Backfill AMRAP records in background
    void (async () => {
      try {
        const result = await backfillAmrapRecords(
          hevyClient,
          exercises,
          program.hevyRoutineIds
        )
        if (result.records.length > 0) {
          const updatedProgression = applyAmrapBackfill(progression, result.records)
          updateProgressionBatch(updatedProgression)
        }
      } catch {
        // Silently fail - tooltips will just show "unknown"
      }
    })()
  }, [apiKey, hevyClient, exercises, progression, program.hevyRoutineIds, updateProgressionBatch])

  // Use push dialog hook for push confirmation dialog [Task 3.3]
  const {
    isOpen: isPushDialogOpen,
    isLoading: pushPreviewLoading,
    previewError: pushPreviewError,
    preview: pushPreview,
    isUpdating: isUpdatingHevy,
    updateError,
    updateSuccess,
    open: handleOpenPushDialog,
    close: handleClosePushDialog,
    confirm: handleConfirmPush,
    changeAction: handleActionChange,
    dismissUpdateStatus: handleDismissUpdateStatus,
  } = usePushDialog({
    hevyClient,
    exercises,
    progression,
    settings,
    hevyRoutineIds: program.hevyRoutineIds,
    t3Schedule,
    onProgressionUpdate: handleProgressionUpdate,
    onRoutineIdsUpdate: setHevyRoutineIds,
    onNeedsPushUpdate: setNeedsPush,
  })

  // Handle discrepancy resolution - use actual weight
  const handleUseActualWeight = useCallback(
    (exerciseId: string, actualWeight: number, tier: import('@/types/state').Tier) => {
      const existingProgression = progression[exerciseId]
      if (existingProgression) {
        updateProgressionBatch({
          ...progression,
          [exerciseId]: {
            ...existingProgression,
            currentWeight: actualWeight,
            baseWeight: actualWeight,
          },
        })
      }
      acknowledgeDiscrepancy(exerciseId, actualWeight, tier)
    },
    [progression, updateProgressionBatch, acknowledgeDiscrepancy]
  )

  // Handle discrepancy resolution - keep stored weight
  const handleKeepStoredWeight = useCallback(
    (exerciseId: string, actualWeight: number, tier: import('@/types/state').Tier) => {
      acknowledgeDiscrepancy(exerciseId, actualWeight, tier)
    },
    [acknowledgeDiscrepancy]
  )

  // Handle dismissing all discrepancies
  const handleDismissDiscrepancies = useCallback(() => {
    for (const d of discrepancies) {
      acknowledgeDiscrepancy(d.exerciseId, d.actualWeight, d.tier)
    }
  }, [discrepancies, acknowledgeDiscrepancy])

  // Filter out acknowledged discrepancies
  const unresolvedDiscrepancies = useMemo(() => {
    return discrepancies.filter((d) => {
      const isAcknowledged = acknowledgedDiscrepancies.some(
        (ack) =>
          ack.exerciseId === d.exerciseId &&
          ack.acknowledgedWeight === d.actualWeight &&
          ack.tier === d.tier
      )
      return !isAcknowledged
    })
  }, [discrepancies, acknowledgedDiscrepancies])

  // Disable sync/update when offline
  const isOffline = !isOnline || !isHevyReachable

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Offline Indicator [T102] */}
      <OfflineIndicator
        isOnline={isOnline}
        isHevyReachable={isHevyReachable}
        onRetry={() => { void checkHevyConnection() }}
      />

      {/* Header */}
      <DashboardHeader
        lastSync={lastSync}
        syncError={syncError}
        pendingChangesCount={pendingChanges.length}
        isSyncing={isSyncing}
        isUpdating={isUpdatingHevy}
        isOffline={isOffline}
        hasApiKey={!!apiKey}
        needsPush={state.needsPush}
        onSync={() => { void handleSync() }}
        onPush={() => { void handleOpenPushDialog() }}
        onOpenReviewModal={() => { setIsReviewModalOpen(true) }}
        onDismissError={clearError}
      />

      {/* Alerts Section */}
      <DashboardAlerts
        updateError={updateError}
        updateSuccess={updateSuccess}
        discrepancies={unresolvedDiscrepancies}
        weightUnit={settings.weightUnit}
        onDismissUpdate={handleDismissUpdateStatus}
        onUseActualWeight={handleUseActualWeight}
        onKeepStoredWeight={handleKeepStoredWeight}
        onDismissDiscrepancies={handleDismissDiscrepancies}
      />

      {/* Main Content */}
      <DashboardContent state={state} />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        pendingChanges={pendingChanges}
        unit={settings.weightUnit}
        onApply={applyChange}
        onApplyAll={applyAllChanges}
        onReject={rejectChange}
        onModify={modifyChange}
        onClose={() => { setIsReviewModalOpen(false) }}
        recentlyRejected={recentlyRejected}
        onUndoReject={undoReject}
      />

      {/* Push Confirmation Dialog */}
      <PushConfirmDialog
        isOpen={isPushDialogOpen}
        isLoading={pushPreviewLoading}
        error={pushPreviewError}
        preview={pushPreview}
        weightUnit={settings.weightUnit}
        onConfirm={() => { void handleConfirmPush() }}
        onCancel={handleClosePushDialog}
        onRetry={() => { void handleOpenPushDialog() }}
        onActionChange={handleActionChange}
      />
    </div>
  )
}

// Re-export sub-components for direct imports if needed
export { ExerciseCard } from './ExerciseCard'
export { MainLiftCard } from './MainLiftCard'
export { QuickStats } from './QuickStats'
export { CurrentWorkout } from './CurrentWorkout'
export { T3Overview } from './T3Overview'
export { TierSection } from './TierSection'
export { PendingBadge } from './PendingBadge'
export { UpdateStatus } from './UpdateStatus'
export { DashboardHeader } from './DashboardHeader'
export { DashboardAlerts } from './DashboardAlerts'
export { DashboardContent } from './DashboardContent'
