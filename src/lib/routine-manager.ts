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
import { buildRoutinePayload, buildDayRoutine } from './routine-builder'
import { GZCLP_DAYS } from './constants'

// =============================================================================
// Constants
// =============================================================================

/**
 * Standard GZCLP routine names.
 */
export const GZCLP_ROUTINE_NAMES: Record<GZCLPDay, string> = {
  A1: 'GZCLP A1',
  B1: 'GZCLP B1',
  A2: 'GZCLP A2',
  B2: 'GZCLP B2',
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
  folderId?: number
): Promise<Routine> {
  const payload = buildRoutinePayload(
    day,
    exercises,
    progression,
    settings,
    folderId
  )

  return client.createRoutine(payload)
}

// =============================================================================
// Routine Update
// =============================================================================

/**
 * Update an existing GZCLP routine in Hevy.
 */
export async function updateGZCLPRoutine(
  client: HevyClient,
  routineId: string,
  day: GZCLPDay,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings
): Promise<Routine> {
  const routine = buildDayRoutine(day, exercises, progression, settings)

  const updatePayload: UpdateRoutineRequest = {
    routine: {
      title: routine.title,
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
 */
export async function ensureGZCLPRoutines(
  client: HevyClient,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings,
  folderId?: number
): Promise<RoutineIds> {
  // First, fetch all existing routines
  const existingRoutines = await client.getAllRoutines()
  const found = findGZCLPRoutines(existingRoutines)

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
        settings
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
        folderId
      )
      result[day] = created.id
    }
  }

  return result
}
