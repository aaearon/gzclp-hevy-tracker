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
  ExerciseRole,
  GZCLPDay,
  ProgressionState,
  Tier,
  UserSettings,
} from '@/types/state'
import { T1_SCHEMES, T2_SCHEMES, T3_SCHEME, WARMUP_CONFIG } from './constants'
import { getT1RoleForDay, getT2RoleForDay, getTierForDay } from './role-utils'

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
// Warmup Set Builder
// =============================================================================

/**
 * Round weight to nearest increment.
 */
function roundToNearest(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment
}

/**
 * Build warmup sets for T1 exercises.
 * Protocol: Bar only (20kg) x10, 50% x5, 70% x3, 85% x2
 * Smart filtering: skip duplicate weights.
 */
export function buildWarmupSets(workingWeightKg: number): RoutineSetWrite[] {
  const BAR_WEIGHT = WARMUP_CONFIG.minWeight
  const sets: RoutineSetWrite[] = []

  for (let i = 0; i < WARMUP_CONFIG.percentages.length; i++) {
    const pct = WARMUP_CONFIG.percentages[i]
    if (pct === undefined) continue
    const weight =
      pct === 0 ? BAR_WEIGHT : Math.max(BAR_WEIGHT, roundToNearest(workingWeightKg * pct, 2.5))

    // Smart filtering: skip if weight equals previous set (avoid duplicates)
    const lastSet = sets[sets.length - 1]
    if (lastSet?.weight_kg === weight) {
      continue
    }

    const reps = WARMUP_CONFIG.reps[i]
    if (reps !== undefined) {
      sets.push({ type: 'warmup', weight_kg: weight, reps })
    }
  }

  return sets
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
 * Derive tier from exercise role and workout day.
 */
function deriveTier(role: ExerciseRole | undefined, day: GZCLPDay): Tier {
  if (!role) return 'T3'
  const tier = getTierForDay(role, day)
  return tier ?? 'T3'
}

/**
 * Build a routine exercise with correct sets based on tier and stage.
 */
export function buildRoutineExercise(
  exercise: ExerciseConfig,
  progression: ProgressionState,
  settings: UserSettings,
  day: GZCLPDay
): RoutineExerciseWrite {
  // Derive tier from role + day
  const tier = deriveTier(exercise.role, day)
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
      throw new Error(`Unknown tier: ${String(tier as unknown)}`)
  }

  // Build working sets
  const workingSets: RoutineSetWrite[] = []
  for (let i = 0; i < numSets; i++) {
    workingSets.push(buildRoutineSet(weightKg, reps))
  }

  // Prepend warmup sets for T1 only
  const sets = tier === 'T1' ? [...buildWarmupSets(weightKg), ...workingSets] : workingSets

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
 * Find exercise config by role.
 */
function findExerciseByRole(
  role: ExerciseRole,
  exercises: Record<string, ExerciseConfig>
): ExerciseConfig | undefined {
  return Object.values(exercises).find((ex) => ex.role === role)
}

/**
 * Get all T3 exercises.
 */
function getT3Exercises(exercises: Record<string, ExerciseConfig>): ExerciseConfig[] {
  return Object.values(exercises).filter((ex) => ex.role === 't3')
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
  const routineExercises: RoutineExerciseWrite[] = []

  // Get T1 and T2 roles for this day
  const t1Role = getT1RoleForDay(day)
  const t2Role = getT2RoleForDay(day)

  // Add T1 exercise
  const t1Exercise = findExerciseByRole(t1Role, exercises)
  const t1Progression = t1Exercise ? progression[t1Exercise.id] : undefined
  if (t1Exercise && t1Progression) {
    routineExercises.push(
      buildRoutineExercise(t1Exercise, t1Progression, settings, day)
    )
  }

  // Add T2 exercise
  const t2Exercise = findExerciseByRole(t2Role, exercises)
  const t2Progression = t2Exercise ? progression[t2Exercise.id] : undefined
  if (t2Exercise && t2Progression) {
    routineExercises.push(
      buildRoutineExercise(t2Exercise, t2Progression, settings, day)
    )
  }

  // Add all T3 exercises
  const t3Exercises = getT3Exercises(exercises)
  for (const t3Exercise of t3Exercises) {
    const t3Progression = progression[t3Exercise.id]
    if (t3Progression) {
      routineExercises.push(
        buildRoutineExercise(t3Exercise, t3Progression, settings, day)
      )
    }
  }

  return {
    title: `GZCLP Day ${day}`,
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
