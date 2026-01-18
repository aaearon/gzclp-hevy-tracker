/**
 * useProgression Hook
 *
 * Manages workout synchronization, analysis, and progression change generation.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { createHevyClient, HevyApiClientError } from '@/lib/hevy-client'
import {
  analyzeWorkout,
  sortWorkoutsChronologically,
  type WorkoutAnalysisResult,
} from '@/lib/workout-analysis'
import { createPendingChangesFromAnalysis } from '@/lib/progression'
import { deduplicateDiscrepancies } from '@/lib/discrepancy-utils'
import type {
  ExerciseConfig,
  GZCLPDay,
  ProgressionState,
  PendingChange,
  UserSettings,
  Tier,
} from '@/types/state'

// =============================================================================
// Types
// =============================================================================

export interface UseProgressionProps {
  apiKey: string
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  settings: UserSettings
  lastSync: string | null
  /** Mapping of GZCLP days to Hevy routine IDs - used to filter relevant workouts */
  hevyRoutineIds: {
    A1: string | null
    B1: string | null
    A2: string | null
    B2: string | null
  }
  /** IDs of workouts that have already been processed (prevents reprocessing) */
  processedWorkoutIds?: string[] | undefined
  /** Current day in the app state - used for day mismatch detection */
  currentDay?: GZCLPDay | undefined
}

export interface DiscrepancyInfo {
  exerciseId: string
  exerciseName: string
  /** Tier of the exercise (T1, T2, T3) for display clarity */
  tier: Tier
  storedWeight: number
  actualWeight: number
  workoutId: string
  workoutDate: string
}

export interface UseProgressionResult {
  // State
  isSyncing: boolean
  syncError: string | null
  lastSyncTime: string | null
  pendingChanges: PendingChange[]
  discrepancies: DiscrepancyInfo[]
  analysisResults: WorkoutAnalysisResult[]
  /** The most recent unprocessed workout day detected during sync (for auto day advancement) */
  detectedWorkoutDay: GZCLPDay | null

  // Actions
  syncWorkouts: () => Promise<void>
  clearError: () => void
  clearPendingChanges: () => void
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Find the GZCLP day that matches a workout's routine ID.
 * Returns null if the routine ID doesn't match any imported routine.
 *
 * IMPORTANT: Returns null for null/undefined routineId to prevent
 * false matches when a workout has no routine (e.g., "Just Workout" in Hevy)
 * and a GZCLP day hasn't been configured yet (null === null bug fix).
 */
function findDayByRoutineId(
  routineId: string | null | undefined,
  hevyRoutineIds: UseProgressionProps['hevyRoutineIds']
): GZCLPDay | null {
  // Guard: workouts without a routine (null/undefined) should never match
  if (!routineId) return null

  if (hevyRoutineIds.A1 === routineId) return 'A1'
  if (hevyRoutineIds.B1 === routineId) return 'B1'
  if (hevyRoutineIds.A2 === routineId) return 'A2'
  if (hevyRoutineIds.B2 === routineId) return 'B2'
  return null
}

export function useProgression(props: UseProgressionProps): UseProgressionResult {
  const { apiKey, exercises, progression, settings, lastSync, hevyRoutineIds, processedWorkoutIds = [], currentDay } = props

  // State
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(lastSync)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyInfo[]>([])
  const [analysisResults, setAnalysisResults] = useState<WorkoutAnalysisResult[]>([])
  const [detectedWorkoutDay, setDetectedWorkoutDay] = useState<GZCLPDay | null>(null)

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true)

  // AbortController for cancelling requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup: abort any pending requests and mark as unmounted
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  // Create client
  const client = useMemo(() => {
    if (!apiKey) return null
    return createHevyClient(apiKey)
  }, [apiKey])

  /**
   * Sync workouts from Hevy and generate pending changes.
   */
  const syncWorkouts = useCallback(async () => {
    if (!client) {
      setSyncError('Not connected to Hevy API')
      return
    }

    // Abort any previous request
    abortControllerRef.current?.abort()

    // Create new controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsSyncing(true)
    setSyncError(null)

    try {
      // Fetch workouts from Hevy (first page for now)
      const response = await client.getWorkouts({ page: 1, pageSize: 10 }, controller.signal)

      // Check if still mounted before processing
      if (!isMountedRef.current) return

      const workouts = response.workouts

      // Sort chronologically (oldest first) for proper processing
      const sortedWorkouts = sortWorkoutsChronologically(workouts)

      // Filter to only workouts from imported routines
      // This prevents false discrepancies from other routines in the user's Hevy account
      const relevantWorkouts = sortedWorkouts.filter((workout) => {
        const matchedDay = findDayByRoutineId(workout.routine_id, hevyRoutineIds)
        return matchedDay !== null
      })

      // Build set of already-processed workout IDs from:
      // 1. The global processedWorkoutIds array (persisted, prevents reprocessing after lastWorkoutId updates)
      // 2. Current lastWorkoutId values (backwards compatibility for existing users)
      const processedWorkoutIdSet = new Set<string>(processedWorkoutIds)
      for (const [key, prog] of Object.entries(progression)) {
        if (prog.lastWorkoutId) {
          processedWorkoutIdSet.add(prog.lastWorkoutId)
          // Debug: log which progression entries have lastWorkoutId set
          console.debug(`[syncWorkouts] Progression "${key}" has lastWorkoutId: ${prog.lastWorkoutId}`)
        }
      }

      // Filter out already-processed workouts
      const unprocessedWorkouts = relevantWorkouts.filter(
        (workout) => !processedWorkoutIdSet.has(workout.id)
      )

      // Debug: log filtering results
      if (relevantWorkouts.length !== unprocessedWorkouts.length) {
        const filtered = relevantWorkouts.filter((w) => processedWorkoutIdSet.has(w.id))
        console.debug(
          `[syncWorkouts] Filtered out ${String(filtered.length)} already-processed workouts:`,
          filtered.map((w) => ({ id: w.id, title: w.title }))
        )
      }
      console.debug(
        `[syncWorkouts] Processing ${String(unprocessedWorkouts.length)} unprocessed workouts:`,
        unprocessedWorkouts.map((w) => ({ id: w.id, title: w.title }))
      )

      // Find the most recent workout day for auto day advancement
      // This handles two cases:
      // 1. New unprocessed workouts - advance based on the workout
      // 2. All workouts processed but day not advanced (bug recovery) - detect mismatch and fix
      let mostRecentWorkoutDay: GZCLPDay | null = null

      if (unprocessedWorkouts.length > 0) {
        // Case 1: New unprocessed workouts - use the most recent one
        const sortedByRecent = [...unprocessedWorkouts].sort(
          (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )
        const mostRecent = sortedByRecent[0]
        if (mostRecent) {
          mostRecentWorkoutDay = findDayByRoutineId(mostRecent.routine_id, hevyRoutineIds)
          console.debug(`[syncWorkouts] Most recent unprocessed workout day: ${mostRecentWorkoutDay}`)
        }
      } else if (relevantWorkouts.length > 0 && currentDay) {
        // Case 2: All workouts already processed - check if day needs correction
        // Find the most recent relevant workout (already processed)
        const sortedByRecent = [...relevantWorkouts].sort(
          (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )
        const mostRecent = sortedByRecent[0]
        const mostRecentProcessedDay = mostRecent ? findDayByRoutineId(mostRecent.routine_id, hevyRoutineIds) : null

        // If currentDay matches the most recent workout's day, it means day wasn't advanced
        // This happens due to the previous bug where day advancement was tied to pending changes
        if (mostRecentProcessedDay && currentDay === mostRecentProcessedDay) {
          console.debug(`[syncWorkouts] Day mismatch detected: currentDay=${currentDay} matches last workout day. Triggering advancement.`)
          mostRecentWorkoutDay = mostRecentProcessedDay
        }
      }

      // Analyze each workout with its matched day for accurate tier derivation
      const allAnalysisResults: WorkoutAnalysisResult[] = []
      const allDiscrepancies: DiscrepancyInfo[] = []

      for (const workout of unprocessedWorkouts) {
        const matchedDay = findDayByRoutineId(workout.routine_id, hevyRoutineIds)
        const results = analyzeWorkout(workout, exercises, progression, matchedDay ?? undefined)
        allAnalysisResults.push(...results)

        // Collect discrepancies
        for (const result of results) {
          if (result.discrepancy) {
            allDiscrepancies.push({
              exerciseId: result.exerciseId,
              exerciseName: result.exerciseName,
              tier: result.tier,
              storedWeight: result.discrepancy.storedWeight,
              actualWeight: result.discrepancy.actualWeight,
              workoutId: result.workoutId,
              workoutDate: result.workoutDate,
            })
          }
        }
      }

      // Generate pending changes from analysis results
      const changes = createPendingChangesFromAnalysis(
        allAnalysisResults,
        exercises,
        progression,
        settings.weightUnit
      )

      // Check if still mounted before updating state
      if (!isMountedRef.current) return

      // Update state
      setAnalysisResults(allAnalysisResults)
      setDiscrepancies(deduplicateDiscrepancies(allDiscrepancies))
      setPendingChanges(changes)
      setLastSyncTime(new Date().toISOString())
      setDetectedWorkoutDay(mostRecentWorkoutDay)

    } catch (error) {
      // Don't update state if unmounted or request was cancelled
      if (!isMountedRef.current) return

      if (error instanceof HevyApiClientError) {
        // Silently ignore cancellation errors
        if (error.message === 'Request cancelled') return
        setSyncError(error.message)
      } else if (error instanceof Error) {
        setSyncError(error.message)
      } else {
        setSyncError('Failed to sync workouts')
      }
    } finally {
      // Always update syncing state if still mounted
      if (isMountedRef.current) {
        setIsSyncing(false)
      }
    }
  }, [client, exercises, progression, settings.weightUnit, hevyRoutineIds, processedWorkoutIds])

  /**
   * Clear sync error.
   */
  const clearError = useCallback(() => {
    setSyncError(null)
  }, [])

  /**
   * Clear pending changes.
   */
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([])
    setDiscrepancies([])
    setAnalysisResults([])
  }, [])

  return {
    isSyncing,
    syncError,
    lastSyncTime,
    pendingChanges,
    discrepancies,
    analysisResults,
    detectedWorkoutDay,
    syncWorkouts,
    clearError,
    clearPendingChanges,
  }
}
