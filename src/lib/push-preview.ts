/**
 * Push Preview
 *
 * Utilities for building a preview of changes before pushing to Hevy.
 * Fetches current Hevy routine state and compares with local progression.
 */

import type { HevyClient } from './hevy-client'
import type { Routine, RoutineExerciseRead } from '@/types/hevy'
import type {
  ExerciseConfig,
  GZCLPDay,
  ProgressionState,
  Stage,
  Tier,
  WeightUnit,
} from '@/types/state'
import { getExercisesForDay, getProgressionKey } from './role-utils'
import { convertWeight } from '@/utils/formatting'

// =============================================================================
// Types
// =============================================================================

/** Diff for a single exercise */
export interface ExerciseDiff {
  exerciseId: string
  name: string
  tier: Tier
  oldWeight: number | null // null if routine is new or exercise not found
  newWeight: number
  stage: Stage | null // null for T3
  isChanged: boolean
  progressionKey: string // Key for looking up/updating progression state
}

/** Action to perform for each exercise during selective sync */
export type SyncAction = 'push' | 'pull' | 'skip'

/** ExerciseDiff with user-selected action */
export interface SelectableExerciseDiff extends ExerciseDiff {
  action: SyncAction
}

/** DayDiff with selectable exercises */
export interface SelectableDayDiff extends Omit<DayDiff, 'exercises'> {
  exercises: SelectableExerciseDiff[]
}

/** Full preview with selection state and counts */
export interface SelectablePushPreview extends Omit<PushPreview, 'days'> {
  days: SelectableDayDiff[]
  pushCount: number
  pullCount: number
  skipCount: number
}

/** Diff for a day's routine */
export interface DayDiff {
  day: GZCLPDay
  routineName: string
  routineExists: boolean
  exercises: ExerciseDiff[]
  changeCount: number
}

/** Full preview for confirmation dialog */
export interface PushPreview {
  days: DayDiff[]
  totalChanges: number
  hasAnyRoutines: boolean
}

/** Current state fetched from Hevy */
export interface HevyRoutineState {
  routineId: string | null
  /** Map of exercise template ID to weight in kg */
  weights: Map<string, number>
}

// =============================================================================
// Constants
// =============================================================================

const GZCLP_DAYS: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

const DAY_NAMES: Record<GZCLPDay, string> = {
  A1: 'Day A1',
  B1: 'Day B1',
  A2: 'Day A2',
  B2: 'Day B2',
}

// =============================================================================
// Fetch Current Hevy State
// =============================================================================

/**
 * Extract the working weight from a routine exercise.
 * For exercises with warmup sets, this is typically the last/heaviest set.
 * For exercises without warmups, it's the first set weight.
 */
function extractWorkingWeight(exercise: RoutineExerciseRead): number | null {
  if (exercise.sets.length === 0) return null

  // Find the heaviest weight among the sets (working weight)
  let maxWeight: number | null = null
  for (const set of exercise.sets) {
    if (set.weight_kg !== null) {
      if (maxWeight === null || set.weight_kg > maxWeight) {
        maxWeight = set.weight_kg
      }
    }
  }
  return maxWeight
}

/**
 * Fetch current routine state from Hevy for a single routine.
 */
async function fetchRoutineState(
  client: HevyClient,
  routineId: string | null
): Promise<HevyRoutineState> {
  if (!routineId) {
    return { routineId: null, weights: new Map() }
  }

  try {
    const routine: Routine = await client.getRoutine(routineId)
    const weights = new Map<string, number>()

    for (const exercise of routine.exercises) {
      const weight = extractWorkingWeight(exercise)
      if (weight !== null) {
        weights.set(exercise.exercise_template_id, weight)
      }
    }

    return { routineId, weights }
  } catch {
    // If routine doesn't exist or API error, treat as non-existent
    return { routineId: null, weights: new Map() }
  }
}

/**
 * Fetch current state for all GZCLP routines from Hevy.
 */
export async function fetchCurrentHevyState(
  client: HevyClient,
  hevyRoutineIds: Record<GZCLPDay, string | null>
): Promise<Record<GZCLPDay, HevyRoutineState>> {
  const results = await Promise.all(
    GZCLP_DAYS.map(async (day) => {
      const state = await fetchRoutineState(client, hevyRoutineIds[day])
      return { day, state }
    })
  )

  const stateByDay: Record<GZCLPDay, HevyRoutineState> = {
    A1: { routineId: null, weights: new Map() },
    B1: { routineId: null, weights: new Map() },
    A2: { routineId: null, weights: new Map() },
    B2: { routineId: null, weights: new Map() },
  }

  for (const { day, state } of results) {
    stateByDay[day] = state
  }

  return stateByDay
}

// =============================================================================
// Build Preview
// =============================================================================

/**
 * Build the diff for a single day.
 */
function buildDayDiff(
  day: GZCLPDay,
  hevyState: HevyRoutineState,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  t3Schedule: Record<GZCLPDay, string[]>,
  weightUnit: WeightUnit
): DayDiff {
  const dayExercises = getExercisesForDay(exercises, day, t3Schedule)
  const exerciseDiffs: ExerciseDiff[] = []
  const routineExists = hevyState.routineId !== null

  // Helper to add exercise diff
  const addExerciseDiff = (
    exercise: ExerciseConfig,
    tier: Tier
  ): void => {
    const progressionKey = getProgressionKey(exercise.id, exercise.role, tier)
    const progressionState = progression[progressionKey]

    if (!progressionState) return // No progression data for this exercise

    // Get new weight (local progression) - always stored in user's preferred unit
    const newWeight = progressionState.currentWeight

    // Get old weight from Hevy (stored in kg) - convert to user's unit
    const hevyWeightKg = hevyState.weights.get(exercise.hevyTemplateId) ?? null
    const oldWeight = hevyWeightKg !== null
      ? convertWeight(hevyWeightKg, 'kg', weightUnit)
      : null

    // Check if changed (with small epsilon for floating point comparison)
    const isChanged = oldWeight === null || Math.abs(newWeight - oldWeight) > 0.01

    exerciseDiffs.push({
      exerciseId: exercise.id,
      name: exercise.name,
      tier,
      oldWeight,
      newWeight,
      stage: tier !== 'T3' ? progressionState.stage : null,
      isChanged,
      progressionKey,
    })
  }

  // Add T1 exercise
  if (dayExercises.t1) {
    addExerciseDiff(dayExercises.t1, 'T1')
  }

  // Add T2 exercise
  if (dayExercises.t2) {
    addExerciseDiff(dayExercises.t2, 'T2')
  }

  // Add T3 exercises
  for (const t3Exercise of dayExercises.t3) {
    addExerciseDiff(t3Exercise, 'T3')
  }

  const changeCount = exerciseDiffs.filter((d) => d.isChanged).length

  return {
    day,
    routineName: DAY_NAMES[day],
    routineExists,
    exercises: exerciseDiffs,
    changeCount,
  }
}

/**
 * Build the complete push preview comparing local state to Hevy state.
 */
export function buildPushPreview(
  hevyState: Record<GZCLPDay, HevyRoutineState>,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  t3Schedule: Record<GZCLPDay, string[]>,
  weightUnit: WeightUnit
): PushPreview {
  const days = GZCLP_DAYS.map((day) =>
    buildDayDiff(day, hevyState[day], exercises, progression, t3Schedule, weightUnit)
  )

  const totalChanges = days.reduce((sum, day) => sum + day.changeCount, 0)
  const hasAnyRoutines = days.some((day) => day.routineExists)

  return {
    days,
    totalChanges,
    hasAnyRoutines,
  }
}

/**
 * Build a selectable push preview with default actions.
 * Changed exercises default to 'push', unchanged default to 'skip'.
 */
export function buildSelectablePushPreview(
  hevyState: Record<GZCLPDay, HevyRoutineState>,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  t3Schedule: Record<GZCLPDay, string[]>,
  weightUnit: WeightUnit
): SelectablePushPreview {
  const basePreview = buildPushPreview(hevyState, exercises, progression, t3Schedule, weightUnit)

  let pushCount = 0
  const pullCount = 0
  let skipCount = 0

  const selectableDays: SelectableDayDiff[] = basePreview.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => {
      // Default action: push if changed, skip if unchanged
      const action: SyncAction = ex.isChanged ? 'push' : 'skip'
      if (action === 'push') pushCount++
      else skipCount++

      return { ...ex, action }
    }),
  }))

  return {
    ...basePreview,
    days: selectableDays,
    pushCount,
    pullCount,
    skipCount,
  }
}

/**
 * Update a selectable preview with a new action for an exercise.
 * Returns a new preview with updated counts.
 */
export function updatePreviewAction(
  preview: SelectablePushPreview,
  progressionKey: string,
  newAction: SyncAction
): SelectablePushPreview {
  let pushCount = 0
  let pullCount = 0
  let skipCount = 0

  const updatedDays: SelectableDayDiff[] = preview.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => {
      const action = ex.progressionKey === progressionKey ? newAction : ex.action
      if (action === 'push') pushCount++
      else if (action === 'pull') pullCount++
      else skipCount++

      return { ...ex, action }
    }),
  }))

  return {
    ...preview,
    days: updatedDays,
    pushCount,
    pullCount,
    skipCount,
  }
}
