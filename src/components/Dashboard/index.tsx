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
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { createHevyClient } from '@/lib/hevy-client'
import { syncGZCLPRoutines } from '@/lib/routine-manager'
import {
  fetchCurrentHevyState,
  buildSelectablePushPreview,
  updatePreviewAction,
  type SelectablePushPreview,
  type SyncAction,
  type HevyRoutineState,
} from '@/lib/push-preview'
import type { GZCLPDay, ProgressionState } from '@/types/state'
import { DashboardHeader } from './DashboardHeader'
import { DashboardAlerts } from './DashboardAlerts'
import { DashboardContent } from './DashboardContent'
import { ReviewModal } from '@/components/ReviewModal'
import { OfflineIndicator } from '@/components/common/OfflineIndicator'
import { TodaysWorkoutModal } from './TodaysWorkoutModal'
import { PushConfirmDialog } from './PushConfirmDialog'

interface DashboardProps {
  onNavigateToSettings?: () => void
}

export function Dashboard({ onNavigateToSettings }: DashboardProps = {}) {
  const {
    state,
    updateProgressionBatch,
    setLastSync,
    setHevyRoutineIds,
    setCurrentDay,
    recordHistoryEntry,
    acknowledgeDiscrepancy,
  } = useProgram()
  const { exercises, progression, settings, program, lastSync, apiKey, pendingChanges: storedPendingChanges, t3Schedule } = state
  // Fallback for pre-migration states that don't have acknowledgedDiscrepancies
  const acknowledgedDiscrepancies = state.acknowledgedDiscrepancies ?? []

  // Local state for modals and updates
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isUpdatingHevy, setIsUpdatingHevy] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Push confirmation dialog state
  const [isPushDialogOpen, setIsPushDialogOpen] = useState(false)
  const [pushPreviewLoading, setPushPreviewLoading] = useState(false)
  const [pushPreviewError, setPushPreviewError] = useState<string | null>(null)
  const [pushPreview, setPushPreview] = useState<SelectablePushPreview | null>(null)
  const [hevyState, setHevyState] = useState<Record<GZCLPDay, HevyRoutineState> | null>(null)

  // Track seen change IDs to avoid re-processing
  const previousChangeIds = useRef<Set<string>>(new Set())

  // Today's Workout modal state [GAP-15]
  const [showTodaysWorkout, setShowTodaysWorkout] = useState(false)

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
  })

  // Handle progression updates from pending changes
  const handleProgressionUpdate = useCallback(
    (newProgression: Record<string, ProgressionState>) => {
      updateProgressionBatch(newProgression)
    },
    [updateProgressionBatch]
  )

  // Handle day advancement after applying all changes
  const handleDayAdvance = useCallback(
    (nextDay: GZCLPDay) => {
      setCurrentDay(nextDay)
    },
    [setCurrentDay]
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
    applyChange,
    rejectChange,
    modifyChange,
    applyAllChanges,
  } = usePendingChanges({
    initialChanges: mergedPendingChanges,
    progression,
    onProgressionUpdate: handleProgressionUpdate,
    currentDay: program.currentDay,
    onDayAdvance: handleDayAdvance,
    onRecordHistory: recordHistoryEntry,
  })

  // Create Hevy client
  const hevyClient = useMemo(() => {
    if (!apiKey) return null
    return createHevyClient(apiKey)
  }, [apiKey])

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

  // Handle opening push confirmation dialog
  const handleOpenPushDialog = useCallback(async () => {
    if (!hevyClient) {
      setUpdateError('Not connected to Hevy API')
      return
    }

    setIsPushDialogOpen(true)
    setPushPreviewLoading(true)
    setPushPreviewError(null)
    setPushPreview(null)
    setHevyState(null)

    try {
      const fetchedHevyState = await fetchCurrentHevyState(hevyClient, program.hevyRoutineIds)
      setHevyState(fetchedHevyState)
      const preview = buildSelectablePushPreview(
        fetchedHevyState,
        exercises,
        progression,
        t3Schedule,
        settings.weightUnit
      )
      setPushPreview(preview)
    } catch (error) {
      if (error instanceof Error) {
        setPushPreviewError(error.message)
      } else {
        setPushPreviewError('Failed to fetch current routines from Hevy')
      }
    } finally {
      setPushPreviewLoading(false)
    }
  }, [hevyClient, program.hevyRoutineIds, exercises, progression, t3Schedule, settings.weightUnit])

  // Handle closing push dialog
  const handleClosePushDialog = useCallback(() => {
    setIsPushDialogOpen(false)
    setPushPreview(null)
    setPushPreviewError(null)
    setHevyState(null)
  }, [])

  // Handle action change in push dialog
  const handleActionChange = useCallback((progressionKey: string, action: SyncAction) => {
    setPushPreview((prev) => {
      if (!prev) return null
      return updatePreviewAction(prev, progressionKey, action)
    })
  }, [])

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

  // Handle confirming push with selective sync
  const handleConfirmPush = useCallback(async () => {
    if (!hevyClient || !pushPreview || !hevyState) {
      setUpdateError('Missing data for sync')
      handleClosePushDialog()
      return
    }

    if (pushPreview.pushCount === 0 && pushPreview.pullCount === 0) {
      handleClosePushDialog()
      return
    }

    handleClosePushDialog()
    setIsUpdatingHevy(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      const { routineIds, pullUpdates } = await syncGZCLPRoutines(
        hevyClient,
        exercises,
        progression,
        settings,
        pushPreview,
        hevyState,
        program.hevyRoutineIds,
        t3Schedule
      )

      if (pullUpdates.length > 0) {
        const updatedProgression = { ...progression }
        for (const { progressionKey, weight } of pullUpdates) {
          if (updatedProgression[progressionKey]) {
            updatedProgression[progressionKey] = {
              ...updatedProgression[progressionKey],
              currentWeight: weight,
              baseWeight: weight,
            }
          }
        }
        updateProgressionBatch(updatedProgression)
      }

      const updates: { A1?: string; B1?: string; A2?: string; B2?: string } = {}
      if (routineIds.A1) updates.A1 = routineIds.A1
      if (routineIds.B1) updates.B1 = routineIds.B1
      if (routineIds.A2) updates.A2 = routineIds.A2
      if (routineIds.B2) updates.B2 = routineIds.B2
      setHevyRoutineIds(updates)
      setUpdateSuccess(true)
    } catch (error) {
      if (error instanceof Error) {
        setUpdateError(error.message)
      } else {
        setUpdateError('Failed to sync with Hevy')
      }
    } finally {
      setIsUpdatingHevy(false)
    }
  }, [
    hevyClient,
    pushPreview,
    hevyState,
    exercises,
    progression,
    settings,
    program.hevyRoutineIds,
    t3Schedule,
    handleClosePushDialog,
    updateProgressionBatch,
    setHevyRoutineIds,
  ])

  // Disable sync/update when offline
  const isOffline = !isOnline || !isHevyReachable

  // Callbacks for header
  const handleDismissUpdateStatus = useCallback(() => {
    setUpdateError(null)
    setUpdateSuccess(false)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
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
        onSync={() => { void handleSync() }}
        onOpenPushDialog={() => { void handleOpenPushDialog() }}
        onOpenReviewModal={() => { setIsReviewModalOpen(true) }}
        onDismissError={clearError}
        {...(onNavigateToSettings ? { onNavigateToSettings } : {})}
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
      <DashboardContent
        state={state}
        onStartWorkout={() => { setShowTodaysWorkout(true) }}
      />

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
      />

      {/* Today's Workout Modal [GAP-15] */}
      <TodaysWorkoutModal
        isOpen={showTodaysWorkout}
        onClose={() => { setShowTodaysWorkout(false) }}
        day={program.currentDay}
        exercises={exercises}
        progression={progression}
        weightUnit={settings.weightUnit}
        t3Schedule={t3Schedule}
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
export { UpdateHevyButton } from './UpdateHevyButton'
export { UpdateStatus } from './UpdateStatus'
export { DashboardHeader } from './DashboardHeader'
export { DashboardAlerts } from './DashboardAlerts'
export { DashboardContent } from './DashboardContent'
