/**
 * Dashboard Component
 *
 * Main dashboard displaying all exercises, progression state, and pending changes.
 * Integrates sync functionality, review modal, and Hevy updates.
 *
 * Note: Discrepancy handling has been consolidated into ReviewModal -
 * discrepancy info is now shown inline on pending change cards.
 *
 * [T057] Sync functionality
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
import { useToast } from '@/contexts/ToastContext'
import { createHevyClient } from '@/lib/hevy-client'
import { DAY_CYCLE } from '@/lib/constants'
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
    setTotalWorkouts,
    setMostRecentWorkoutDate,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    addProcessedWorkoutIds,
  } = useProgram()
  const { exercises, progression, settings, program, lastSync, apiKey, pendingChanges: storedPendingChanges, t3Schedule, processedWorkoutIds } = state

  // Toast notifications for visual feedback
  const { showToast } = useToast()

  // Local state for modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  // Track seen change IDs to avoid re-processing
  const previousChangeIds = useRef<Set<string>>(new Set())
  // Track previous syncing state for "all caught up" detection
  const wasSyncing = useRef(false)

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
    handleSync,
    clearError,
    clearSyncPendingChanges,
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
    processedWorkoutIds,
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

  // Persist new sync changes to localStorage and show toast notification
  // This ensures pending changes survive page refresh
  useEffect(() => {
    if (syncPendingChanges.length === 0) return

    // Find changes that are new (not already seen and not in stored)
    const storedIds = new Set(storedPendingChanges.map((c) => c.id))
    const newChanges = syncPendingChanges.filter(
      (c) => !previousChangeIds.current.has(c.id) && !storedIds.has(c.id)
    )

    if (newChanges.length > 0) {
      // Persist new changes to localStorage
      for (const change of newChanges) {
        addPendingChange(change)
      }

      // Show toast notification for new workout detected
      showToast({
        type: 'info',
        message: `Found ${String(newChanges.length)} exercise${newChanges.length > 1 ? 's' : ''} to progress`,
        action: {
          label: 'Review',
          onClick: () => { setIsReviewModalOpen(true) },
        },
      })
    }

    // Track all seen changes
    syncPendingChanges.forEach((c) => previousChangeIds.current.add(c.id))
  }, [syncPendingChanges, storedPendingChanges, addPendingChange, showToast])

  // Show "all caught up" toast when sync completes with no new changes
  useEffect(() => {
    // Detect sync completion: was syncing, now not syncing
    if (wasSyncing.current && !isSyncing && !syncError) {
      // Check if there are no pending changes after sync
      if (syncPendingChanges.length === 0 && storedPendingChanges.length === 0) {
        showToast({
          type: 'success',
          message: 'All caught up! No new workouts found.',
        })
      }
    }
    wasSyncing.current = isSyncing
  }, [isSyncing, syncError, syncPendingChanges.length, storedPendingChanges.length, showToast])

  // Callback when all changes are applied (either via applyAll or last individual apply)
  const handleAllChangesApplied = useCallback(() => {
    clearPendingChanges() // Clear from localStorage
    clearSyncPendingChanges() // Clear sync state to prevent re-population
  }, [clearPendingChanges, clearSyncPendingChanges])

  // Callback when a change is rejected - remove from localStorage
  const handleRejectChange = useCallback((changeId: string, _workoutId: string) => {
    removePendingChange(changeId)
  }, [removePendingChange])

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
    onAllChangesApplied: handleAllChangesApplied,
    onAddProcessedWorkoutIds: addProcessedWorkoutIds,
    onRejectChange: handleRejectChange,
  })

  // Wrap applyAllChanges to show success toast
  // Note: Cleanup (clearing localStorage and sync state) is handled by onAllChangesApplied callback
  const handleApplyAllChanges = useCallback(() => {
    const nextDay = DAY_CYCLE[program.currentDay]
    applyAllChanges()
    showToast({
      type: 'success',
      message: `Changes applied! Next workout: ${nextDay}`,
    })
    setIsReviewModalOpen(false)
  }, [applyAllChanges, program.currentDay, showToast])

  // Create Hevy client
  const hevyClient = useMemo(() => {
    if (!apiKey) return null
    return createHevyClient(apiKey)
  }, [apiKey])

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

  // Note: Discrepancy handling has been moved to ReviewModal
  // Discrepancy info is now shown inline on pending change cards

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
        onDismissUpdate={handleDismissUpdateStatus}
      />

      {/* Main Content */}
      <DashboardContent state={state} />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        pendingChanges={pendingChanges}
        unit={settings.weightUnit}
        onApply={applyChange}
        onApplyAll={handleApplyAllChanges}
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
