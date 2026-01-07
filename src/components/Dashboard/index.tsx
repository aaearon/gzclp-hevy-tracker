/**
 * Dashboard Component
 *
 * Main dashboard displaying all exercises, progression state, and pending changes.
 * Integrates sync functionality, discrepancy handling, review modal, and Hevy updates.
 *
 * [T057] Sync functionality and discrepancy handling
 * [T067] ReviewModal integration with pending changes indicator
 * [T077] Hevy update functionality
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useProgram } from '@/hooks/useProgram'
import { useProgression } from '@/hooks/useProgression'
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
import { MAIN_LIFT_ROLES } from '@/types/state'
import { MainLiftCard } from './MainLiftCard'
import { QuickStats } from './QuickStats'
import { CurrentWorkout } from './CurrentWorkout'
import { T3Overview } from './T3Overview'
import { PendingBadge } from './PendingBadge'
import { SyncButton } from './SyncButton'
import { SyncStatus } from './SyncStatus'
import { DiscrepancyAlert } from './DiscrepancyAlert'
import { UpdateHevyButton } from './UpdateHevyButton'
import { UpdateStatus } from './UpdateStatus'
import { ReviewModal } from '@/components/ReviewModal'
import { OfflineIndicator } from '@/components/common/OfflineIndicator'
import { TodaysWorkoutModal } from './TodaysWorkoutModal'
import { ProgressionChartContainer } from '@/components/ProgressionChart'
import { CollapsibleSection } from '@/components/common/CollapsibleSection'
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

  // Auto-sync on mount [GAP-18]
  // Using a ref to track if initial sync has been attempted
  const hasAutoSynced = useRef(false)

  // Use progression hook for sync functionality
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
    hevyRoutineIds: program.hevyRoutineIds,
  })

  // Auto-sync on mount [GAP-18]
  useEffect(() => {
    if (!hasAutoSynced.current && isOnline && !isSyncing && apiKey) {
      hasAutoSynced.current = true
      void syncWorkouts()
    }
    // Only run once on mount, intentionally not including dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Post-workout summary disabled - not adding value currently
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

  // Handle sync and persist timestamp
  const handleSync = useCallback(async () => {
    await syncWorkouts()
    setLastSync(new Date().toISOString())
  }, [syncWorkouts, setLastSync])

  // Handle discrepancy resolution - use actual weight (updates progression to match Hevy)
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
      // Also acknowledge so it doesn't reappear if user syncs again before doing another workout
      acknowledgeDiscrepancy(exerciseId, actualWeight, tier)
    },
    [progression, updateProgressionBatch, acknowledgeDiscrepancy]
  )

  // Handle discrepancy resolution - keep stored weight (acknowledge and hide)
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

  // Filter out acknowledged discrepancies (persisted in localStorage)
  const unresolvedDiscrepancies = useMemo(() => {
    return discrepancies.filter((d) => {
      // Check if this exact discrepancy has been acknowledged
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

    // Check if there are any actions to perform
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

      // Apply pull updates to local progression state
      if (pullUpdates.length > 0) {
        const updatedProgression = { ...progression }
        for (const { progressionKey, weight } of pullUpdates) {
          if (updatedProgression[progressionKey]) {
            updatedProgression[progressionKey] = {
              ...updatedProgression[progressionKey],
              currentWeight: weight,
              baseWeight: weight, // Reset base weight on pull
            }
          }
        }
        updateProgressionBatch(updatedProgression)
      }

      // Update stored routine IDs
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Indicator [T102] */}
      <OfflineIndicator
        isOnline={isOnline}
        isHevyReachable={isHevyReachable}
        onRetry={() => { void checkHevyConnection() }}
      />

      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GZCLP Tracker</h1>
            <SyncStatus lastSyncTime={lastSync} error={syncError} onDismissError={clearError} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Pending changes indicator */}
            {pendingChanges.length > 0 && (
              <button
                type="button"
                onClick={() => { setIsReviewModalOpen(true) }}
                className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[44px]"
              >
                <span>Review changes:</span>
                <PendingBadge count={pendingChanges.length} />
              </button>
            )}

            {/* Sync button */}
            <SyncButton onSync={handleSync} isSyncing={isSyncing} disabled={!apiKey || isOffline} />

            {/* Update Hevy button */}
            <UpdateHevyButton
              onClick={handleOpenPushDialog}
              isUpdating={isUpdatingHevy}
              disabled={!apiKey || isOffline}
            />

            {/* Settings button */}
            {onNavigateToSettings && (
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                aria-label="Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Update Status */}
      {(updateError !== null || updateSuccess) && (
        <div className="container mx-auto px-4 pt-4">
          <UpdateStatus
            status={updateError ? 'error' : updateSuccess ? 'success' : 'idle'}
            error={updateError}
            onDismiss={() => {
              setUpdateError(null)
              setUpdateSuccess(false)
            }}
          />
        </div>
      )}

      {/* Discrepancy Alert */}
      {unresolvedDiscrepancies.length > 0 && (
        <div className="container mx-auto px-4 pt-4">
          <DiscrepancyAlert
            discrepancies={unresolvedDiscrepancies}
            unit={settings.weightUnit}
            onUseActualWeight={handleUseActualWeight}
            onKeepStoredWeight={handleKeepStoredWeight}
            onDismiss={handleDismissDiscrepancies}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats [REQ-DASH-003] */}
        <QuickStats state={state} />

        <div className="space-y-8">
          {/* Current Workout - Prominent display at top */}
          <CurrentWorkout
            day={program.currentDay}
            exercises={exercises}
            progression={progression}
            weightUnit={settings.weightUnit}
            t3Schedule={t3Schedule}
            onStartWorkout={() => { setShowTodaysWorkout(true) }}
          />

          {/* Main Lifts Overview - T1/T2 Status [T036] */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Main Lifts</h2>
              <p className="text-sm text-gray-500">T1 and T2 progression status for all main lifts</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {MAIN_LIFT_ROLES.map((role) => (
                <MainLiftCard
                  key={role}
                  role={role}
                  progression={progression}
                  weightUnit={settings.weightUnit}
                  currentDay={program.currentDay}
                />
              ))}
            </div>
          </section>

          {/* T3 Overview - All accessories with schedule */}
          <T3Overview
            exercises={exercises}
            progression={progression}
            weightUnit={settings.weightUnit}
            t3Schedule={t3Schedule}
          />

          {/* Progression Charts [Feature 007] */}
          <CollapsibleSection title="Progression Charts" defaultOpen={false}>
            <ProgressionChartContainer
              exercises={exercises}
              progression={progression}
              progressionHistory={state.progressionHistory}
              unit={settings.weightUnit}
              workoutsPerWeek={program.workoutsPerWeek}
            />
          </CollapsibleSection>
        </div>
      </main>

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

      {/* Post-Workout Summary Panel disabled - not adding value currently */}

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
