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
import { ensureGZCLPRoutines } from '@/lib/routine-manager'
import type { ExerciseConfig, GZCLPDay, Tier, ProgressionState, WorkoutSummaryData } from '@/types/state'
import { MAIN_LIFT_ROLES } from '@/types/state'
import { TIERS } from '@/lib/constants'
import { getExercisesForDay } from '@/lib/role-utils'
import { buildSummaryFromChanges, getMostRecentWorkoutDate } from '@/utils/summary'
import { TierSection } from './TierSection'
import { MainLiftCard } from './MainLiftCard'
import { QuickStats } from './QuickStats'
import { NextWorkout } from './NextWorkout'
import { PendingBadge } from './PendingBadge'
import { SyncButton } from './SyncButton'
import { SyncStatus } from './SyncStatus'
import { DiscrepancyAlert } from './DiscrepancyAlert'
import { UpdateHevyButton } from './UpdateHevyButton'
import { UpdateStatus } from './UpdateStatus'
import { ReviewModal } from '@/components/ReviewModal'
import { PostWorkoutSummary } from '@/components/PostWorkoutSummary'
import { OfflineIndicator } from '@/components/common/OfflineIndicator'
import { TodaysWorkoutModal } from './TodaysWorkoutModal'

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
  } = useProgram()
  const { exercises, progression, settings, program, lastSync, apiKey, pendingChanges: storedPendingChanges, t3Schedule } = state

  // Local state for modals and updates
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isUpdatingHevy, setIsUpdatingHevy] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [resolvedDiscrepancies, setResolvedDiscrepancies] = useState<Set<string>>(new Set())

  // Post-workout summary panel state [GAP-02]
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState<WorkoutSummaryData | null>(null)
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

  // Show post-workout summary when new changes are detected [GAP-02]
  useEffect(() => {
    if (syncPendingChanges.length === 0) return

    // Check if there are any new changes (not previously seen)
    const newChanges = syncPendingChanges.filter(
      (c) => !previousChangeIds.current.has(c.id)
    )

    if (newChanges.length > 0) {
      // Build and show the summary
      const workoutDate = getMostRecentWorkoutDate(newChanges)
      const summary = buildSummaryFromChanges(
        newChanges,
        `Day ${program.currentDay}`,
        workoutDate
      )
      setSummaryData(summary)
      setShowSummary(true)

      // Track these change IDs as seen
      newChanges.forEach((c) => previousChangeIds.current.add(c.id))
    }
  }, [syncPendingChanges, program.currentDay])

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

  // Handle discrepancy resolution - use actual weight
  const handleUseActualWeight = useCallback(
    (exerciseId: string, actualWeight: number) => {
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
      setResolvedDiscrepancies((prev) => new Set([...prev, exerciseId]))
    },
    [progression, updateProgressionBatch]
  )

  // Handle discrepancy resolution - keep stored weight
  const handleKeepStoredWeight = useCallback(
    (exerciseId: string) => {
      setResolvedDiscrepancies((prev) => new Set([...prev, exerciseId]))
    },
    []
  )

  // Handle dismissing all discrepancies
  const handleDismissDiscrepancies = useCallback(() => {
    const allIds = discrepancies.map((d) => d.exerciseId)
    setResolvedDiscrepancies((prev) => new Set([...prev, ...allIds]))
  }, [discrepancies])

  // Filter out resolved discrepancies
  const unresolvedDiscrepancies = useMemo(() => {
    return discrepancies.filter((d) => !resolvedDiscrepancies.has(d.exerciseId))
  }, [discrepancies, resolvedDiscrepancies])

  // Handle updating Hevy routines
  const handleUpdateHevy = useCallback(async () => {
    if (!hevyClient) {
      setUpdateError('Not connected to Hevy API')
      return
    }

    setIsUpdatingHevy(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      const routineIds = await ensureGZCLPRoutines(
        hevyClient,
        exercises,
        progression,
        settings
      )
      // Only set non-null routine IDs
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
        setUpdateError('Failed to update Hevy routines')
      }
    } finally {
      setIsUpdatingHevy(false)
    }
  }, [hevyClient, exercises, progression, settings, setHevyRoutineIds])

  // Get exercises for current day using role-based grouping
  const dayExercises = getExercisesForDay(exercises, program.currentDay, t3Schedule)

  // Create exercisesByTier for TierSection compatibility
  const exercisesByTier: Record<Tier, ExerciseConfig[]> = {
    T1: dayExercises.t1 ? [dayExercises.t1] : [],
    T2: dayExercises.t2 ? [dayExercises.t2] : [],
    T3: dayExercises.t3,
  }

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
            {/* Start Workout button [GAP-15] */}
            <button
              type="button"
              onClick={() => { setShowTodaysWorkout(true) }}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
              data-testid="start-workout-button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Workout
            </button>

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
              onClick={handleUpdateHevy}
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

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Next Workout - Sidebar on larger screens */}
          <div className="lg:order-2 lg:col-span-1">
            <NextWorkout
              day={program.currentDay}
              exercises={exercises}
              progression={progression}
              weightUnit={settings.weightUnit}
              t3Schedule={t3Schedule}
            />
          </div>

          {/* Exercise Sections - Main content */}
          <div className="space-y-8 lg:order-1 lg:col-span-2">
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

            {/* Today's Workout - Current Day Exercises (T1, T2, T3) */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Workout ({program.currentDay})</h2>
                <p className="text-sm text-gray-500">Exercises for the current day</p>
              </div>
              {TIERS.map((tier) => (
                <TierSection
                  key={tier}
                  tier={tier}
                  exercises={exercisesByTier[tier]}
                  progression={progression}
                  weightUnit={settings.weightUnit}
                  pendingChanges={pendingChanges.filter((c) => c.tier === tier)}
                />
              ))}
            </section>
          </div>
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

      {/* Post-Workout Summary Panel [GAP-02] */}
      <PostWorkoutSummary
        isOpen={showSummary}
        onClose={() => { setShowSummary(false) }}
        onReviewChanges={() => {
          setShowSummary(false)
          setIsReviewModalOpen(true)
        }}
        summary={summaryData}
        unit={settings.weightUnit}
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
    </div>
  )
}

// Re-export sub-components for direct imports if needed
export { ExerciseCard } from './ExerciseCard'
export { MainLiftCard } from './MainLiftCard'
export { QuickStats } from './QuickStats'
export { TierSection } from './TierSection'
export { NextWorkout } from './NextWorkout'
export { PendingBadge } from './PendingBadge'
export { UpdateHevyButton } from './UpdateHevyButton'
export { UpdateStatus } from './UpdateStatus'
