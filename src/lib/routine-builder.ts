/**
 * Routine Builder
 *
 * Builds Hevy routine payloads from GZCLP program state.
 * Creates RoutineExerciseWrite payloads with correct weights, sets, and rest timers.
 */

import type {
  CreateRoutineRequest,
  RoutineExerciseWrite,
  RoutineSetWrite,
} from '@/types/hevy'
import type {
  ExerciseConfig,
  GZCLPDay,
  GZCLPSlot,
  ProgressionState,
  UserSettings,
} from '@/types/state'
import {
  DAY_EXERCISES,
  T1_SCHEMES,
  T2_SCHEMES,
  T3_SCHEME,
  T3_SLOTS,
} from './constants'

// =============================================================================
// Constants
// =============================================================================

const LBS_TO_KG = 1 / 2.20462

// =============================================================================
// Weight Conversion
// =============================================================================

/**
 * Convert weight to kilograms for Hevy API.
 * Hevy API always expects weights in kg.
 */
function toKilograms(weight: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'kg') {
    return weight
  }
  return Math.round(weight * LBS_TO_KG * 10) / 10 // Round to 1 decimal
}

// =============================================================================
// Set Builder
// =============================================================================

/**
 * Build a single routine set.
 */
export function buildRoutineSet(weightKg: number, reps: number): RoutineSetWrite {
  return {
    type: 'normal',
    weight_kg: weightKg,
    reps,
  }
}

// =============================================================================
// Exercise Builder
// =============================================================================

/**
 * Build a routine exercise with correct sets based on tier and stage.
 */
export function buildRoutineExercise(
  exercise: ExerciseConfig,
  progression: ProgressionState,
  settings: UserSettings
): RoutineExerciseWrite {
  const { tier } = exercise
  const { currentWeight, stage } = progression

  // Convert weight to kg for Hevy API
  const weightKg = toKilograms(currentWeight, settings.weightUnit)

  // Get rest timer based on tier
  const restSeconds = settings.restTimers[tier.toLowerCase() as 't1' | 't2' | 't3']

  // Get rep scheme based on tier and stage
  let numSets: number
  let reps: number

  switch (tier) {
    case 'T1':
      numSets = T1_SCHEMES[stage].sets
      reps = T1_SCHEMES[stage].reps
      break
    case 'T2':
      numSets = T2_SCHEMES[stage].sets
      reps = T2_SCHEMES[stage].reps
      break
    case 'T3':
      numSets = T3_SCHEME.sets
      reps = T3_SCHEME.reps
      break
    default:
      throw new Error(`Unknown tier: ${tier}`)
  }

  // Build sets array
  const sets: RoutineSetWrite[] = []
  for (let i = 0; i < numSets; i++) {
    sets.push(buildRoutineSet(weightKg, reps))
  }

  return {
    exercise_template_id: exercise.hevyTemplateId,
    rest_seconds: restSeconds,
    sets,
  }
}

// =============================================================================
// Day Routine Builder
// =============================================================================

/**
 * Find exercise config by slot.
 */
function findExerciseBySlot(
  slot: GZCLPSlot,
  exercises: Record<string, ExerciseConfig>
): ExerciseConfig | undefined {
  return Object.values(exercises).find((ex) => ex.slot === slot)
}

/**
 * Build a complete day routine (A1, B1, A2, or B2).
 */
export function buildDayRoutine(
  day: GZCLPDay,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings
): { title: string; exercises: RoutineExerciseWrite[] } {
  const dayConfig = DAY_EXERCISES[day]
  const routineExercises: RoutineExerciseWrite[] = []

  // Add T1 exercise
  const t1Exercise = findExerciseBySlot(dayConfig.t1, exercises)
  if (t1Exercise && progression[t1Exercise.id]) {
    routineExercises.push(
      buildRoutineExercise(t1Exercise, progression[t1Exercise.id]!, settings)
    )
  }

  // Add T2 exercise
  const t2Exercise = findExerciseBySlot(dayConfig.t2, exercises)
  if (t2Exercise && progression[t2Exercise.id]) {
    routineExercises.push(
      buildRoutineExercise(t2Exercise, progression[t2Exercise.id]!, settings)
    )
  }

  // Add all T3 exercises
  for (const slot of T3_SLOTS) {
    const t3Exercise = findExerciseBySlot(slot, exercises)
    if (t3Exercise && progression[t3Exercise.id]) {
      routineExercises.push(
        buildRoutineExercise(t3Exercise, progression[t3Exercise.id]!, settings)
      )
    }
  }

  return {
    title: `GZCLP ${day}`,
    exercises: routineExercises,
  }
}

// =============================================================================
// Full Routine Payload Builder
// =============================================================================

/**
 * Build a complete routine creation payload for the Hevy API.
 */
export function buildRoutinePayload(
  day: GZCLPDay,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings,
  folderId?: number
): CreateRoutineRequest {
  const routine = buildDayRoutine(day, exercises, progression, settings)

  return {
    routine: {
      title: routine.title,
      folder_id: folderId ?? null,
      exercises: routine.exercises,
    },
  }
}
