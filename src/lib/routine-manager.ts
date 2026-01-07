/**
 * Routine Manager
 *
 * Manages GZCLP routines in Hevy - finding, creating, and updating.
 * Handles the sync between local progression state and Hevy routines.
 */

import type { Routine, UpdateRoutineRequest } from '@/types/hevy'
import type {
  ExerciseConfig,
  GZCLPDay,
  ProgressionState,
  UserSettings,
} from '@/types/state'
import type { HevyClient } from './hevy-client'
import type { SelectablePushPreview, HevyRoutineState } from './push-preview'
import type { SelectiveWeightOverride } from './routine-builder'
import { buildRoutinePayload, buildDayRoutine, buildSelectiveRoutinePayload } from './routine-builder'
import { GZCLP_DAYS } from './constants'

// =============================================================================
// Constants
// =============================================================================

/**
 * Standard GZCLP routine names.
 */
export const GZCLP_ROUTINE_NAMES: Record<GZCLPDay, string> = {
  A1: 'GZCLP Day A1',
  B1: 'GZCLP Day B1',
  A2: 'GZCLP Day A2',
  B2: 'GZCLP Day B2',
}

// =============================================================================
// Types
// =============================================================================

export interface RoutineIds {
  A1: string | null
  B1: string | null
  A2: string | null
  B2: string | null
}

// =============================================================================
// Routine Detection
// =============================================================================

/**
 * Find existing GZCLP routines by name.
 * Returns routine IDs for each day that exists, null if not found.
 */
export function findGZCLPRoutines(routines: Routine[]): RoutineIds {
  const result: RoutineIds = {
    A1: null,
    B1: null,
    A2: null,
    B2: null,
  }

  for (const routine of routines) {
    for (const day of GZCLP_DAYS) {
      if (routine.title === GZCLP_ROUTINE_NAMES[day]) {
        result[day] = routine.id
      }
    }
  }

  return result
}

// =============================================================================
// Routine Creation
// =============================================================================

/**
 * Create a new GZCLP routine in Hevy.
 */
export async function createGZCLPRoutine(
  client: HevyClient,
  day: GZCLPDay,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings,
  t3Schedule?: Record<GZCLPDay, string[]>,
  folderId?: number
): Promise<Routine> {
  const payload = buildRoutinePayload(
    day,
    exercises,
    progression,
    settings,
    t3Schedule,
    folderId
  )

  return client.createRoutine(payload)
}

// =============================================================================
// Routine Update
// =============================================================================

/**
 * Update an existing GZCLP routine in Hevy.
 * Preserves the original routine name - only updates exercises.
 */
export async function updateGZCLPRoutine(
  client: HevyClient,
  routineId: string,
  day: GZCLPDay,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings,
  t3Schedule?: Record<GZCLPDay, string[]>
): Promise<Routine> {
  // Fetch existing routine to preserve its original title
  const existingRoutine = await client.getRoutine(routineId)
  const routine = buildDayRoutine(day, exercises, progression, settings, t3Schedule)

  const updatePayload: UpdateRoutineRequest = {
    routine: {
      title: existingRoutine.title, // Preserve original name
      exercises: routine.exercises,
    },
  }

  return client.updateRoutine(routineId, updatePayload)
}

// =============================================================================
// Ensure All Routines
// =============================================================================

/**
 * Ensure all 4 GZCLP routines exist and are up to date.
 * Creates missing routines and updates existing ones.
 *
 * @param existingRoutineIds - Optional pre-existing routine IDs from import.
 *                             If provided, these take precedence over name-based search.
 * @param t3Schedule - Per-day T3 schedule mapping days to exercise IDs.
 */
export async function ensureGZCLPRoutines(
  client: HevyClient,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings,
  existingRoutineIds?: RoutineIds,
  t3Schedule?: Record<GZCLPDay, string[]>,
  folderId?: number
): Promise<RoutineIds> {
  // Use provided IDs first, fall back to name-based search
  let found: RoutineIds
  if (existingRoutineIds && Object.values(existingRoutineIds).some(id => id !== null)) {
    // Use the IDs from the import process
    found = existingRoutineIds
  } else {
    // Fall back to searching by standard GZCLP names
    const existingRoutines = await client.getAllRoutines()
    found = findGZCLPRoutines(existingRoutines)
  }

  const result: RoutineIds = {
    A1: null,
    B1: null,
    A2: null,
    B2: null,
  }

  // Process each day
  for (const day of GZCLP_DAYS) {
    const existingId = found[day]

    if (existingId) {
      // Update existing routine
      const updated = await updateGZCLPRoutine(
        client,
        existingId,
        day,
        exercises,
        progression,
        settings,
        t3Schedule
      )
      result[day] = updated.id
    } else {
      // Create new routine
      const created = await createGZCLPRoutine(
        client,
        day,
        exercises,
        progression,
        settings,
        t3Schedule,
        folderId
      )
      result[day] = created.id
    }
  }

  return result
}

// =============================================================================
// Selective Sync
// =============================================================================

/**
 * Result of selective sync operation.
 */
export interface SelectiveSyncResult {
  routineIds: RoutineIds
  /** Exercises marked 'pull' - local state should be updated with these weights */
  pullUpdates: PullUpdate[]
}

/**
 * Weight update to apply to local state after pull.
 */
export interface PullUpdate {
  progressionKey: string
  weight: number // In user's preferred unit
}

/**
 * Sync GZCLP routines with selective push/pull/skip per exercise.
 *
 * - Push: Updates Hevy with local weight
 * - Pull: Keeps Hevy weight (returns for local state update)
 * - Skip: Keeps Hevy weight (no local update)
 *
 * @param preview - Selectable push preview with user actions
 * @param hevyState - Current Hevy routine state (weights in kg)
 */
export async function syncGZCLPRoutines(
  client: HevyClient,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings,
  preview: SelectablePushPreview,
  hevyState: Record<GZCLPDay, HevyRoutineState>,
  existingRoutineIds?: RoutineIds,
  t3Schedule?: Record<GZCLPDay, string[]>,
  folderId?: number
): Promise<SelectiveSyncResult> {
  // Use provided IDs first, fall back to name-based search
  let found: RoutineIds
  if (existingRoutineIds && Object.values(existingRoutineIds).some(id => id !== null)) {
    found = existingRoutineIds
  } else {
    const existingRoutines = await client.getAllRoutines()
    found = findGZCLPRoutines(existingRoutines)
  }

  const result: RoutineIds = {
    A1: null,
    B1: null,
    A2: null,
    B2: null,
  }
  const pullUpdates: PullUpdate[] = []

  for (const day of GZCLP_DAYS) {
    const dayPreview = preview.days.find(d => d.day === day)
    if (!dayPreview) continue

    const existingId = found[day]

    // Collect overrides for skip/pull exercises (use Hevy weight)
    const overrides: SelectiveWeightOverride[] = []

    for (const ex of dayPreview.exercises) {
      if (ex.action === 'skip' || ex.action === 'pull') {
        // Get Hevy weight in kg for this exercise
        const exercise = exercises[ex.exerciseId]
        if (exercise) {
          const hevyWeightKg = hevyState[day].weights.get(exercise.hevyTemplateId)
          if (hevyWeightKg !== undefined) {
            overrides.push({
              progressionKey: ex.progressionKey,
              weightKg: hevyWeightKg,
            })
          }
        }
      }

      // Collect pull updates for local state
      if (ex.action === 'pull' && ex.oldWeight !== null) {
        pullUpdates.push({
          progressionKey: ex.progressionKey,
          weight: ex.oldWeight, // Already in user's unit
        })
      }
    }

    // Check if this day has any pushes
    const dayHasPushes = dayPreview.exercises.some(ex => ex.action === 'push')

    if (!existingId) {
      // Create new routine (always needed if routine doesn't exist)
      const payload = buildSelectiveRoutinePayload(
        day,
        exercises,
        progression,
        settings,
        overrides,
        t3Schedule,
        folderId
      )
      const created = await client.createRoutine(payload)
      result[day] = created.id
    } else if (dayHasPushes) {
      // Update existing routine only if this day has pushes
      // Fetch existing title to preserve it
      const existingRoutine = await client.getRoutine(existingId)

      // Build routine with overrides for skip/pull exercises
      const payload = buildSelectiveRoutinePayload(
        day,
        exercises,
        progression,
        settings,
        overrides,
        t3Schedule
      )

      const updatePayload: UpdateRoutineRequest = {
        routine: {
          title: existingRoutine.title,
          exercises: payload.routine.exercises,
        },
      }

      const updated = await client.updateRoutine(existingId, updatePayload)
      result[day] = updated.id
    } else {
      // No pushes on this day, keep existing routine ID
      result[day] = existingId
    }
  }

  return { routineIds: result, pullUpdates }
}
