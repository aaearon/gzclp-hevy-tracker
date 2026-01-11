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
import { T1_SCHEMES, T2_SCHEMES, T3_SCHEME } from './constants'
import { getT1RoleForDay, getT2RoleForDay, getTierForDay, getProgressionKey } from './role-utils'
import { calculateWarmupSets } from './warmup'

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
 * Build warmup sets for T1 exercises in Hevy API format.
 *
 * Uses shared calculateWarmupSets utility and transforms to RoutineSetWrite format.
 */
export function buildWarmupSets(workingWeightKg: number): RoutineSetWrite[] {
  return calculateWarmupSets(workingWeightKg).map((set) => ({
    type: 'warmup' as const,
    weight_kg: set.weight,
    reps: set.reps,
  }))
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
 * Get T3 exercises scheduled for a specific day.
 */
function getT3ExercisesForDay(
  exercises: Record<string, ExerciseConfig>,
  t3Schedule: Record<GZCLPDay, string[]>,
  day: GZCLPDay
): ExerciseConfig[] {
  const scheduledIds = t3Schedule[day]
  return scheduledIds
    .map((id) => exercises[id])
    .filter((ex): ex is ExerciseConfig => ex?.role === 't3')
}

/**
 * Build a complete day routine (A1, B1, A2, or B2).
 */
export function buildDayRoutine(
  day: GZCLPDay,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings,
  t3Schedule?: Record<GZCLPDay, string[]>
): { title: string; exercises: RoutineExerciseWrite[] } {
  const routineExercises: RoutineExerciseWrite[] = []

  // Get T1 and T2 roles for this day
  const t1Role = getT1RoleForDay(day)
  const t2Role = getT2RoleForDay(day)

  // Add T1 exercise
  const t1Exercise = findExerciseByRole(t1Role, exercises)
  const t1ProgressionKey = t1Exercise ? getProgressionKey(t1Exercise.id, t1Exercise.role, 'T1') : null
  const t1Progression = t1ProgressionKey ? progression[t1ProgressionKey] : undefined
  if (t1Exercise && t1Progression) {
    routineExercises.push(
      buildRoutineExercise(t1Exercise, t1Progression, settings, day)
    )
  }

  // Add T2 exercise
  const t2Exercise = findExerciseByRole(t2Role, exercises)
  const t2ProgressionKey = t2Exercise ? getProgressionKey(t2Exercise.id, t2Exercise.role, 'T2') : null
  const t2Progression = t2ProgressionKey ? progression[t2ProgressionKey] : undefined
  if (t2Exercise && t2Progression) {
    routineExercises.push(
      buildRoutineExercise(t2Exercise, t2Progression, settings, day)
    )
  }

  // Add T3 exercises scheduled for this day
  if (t3Schedule) {
    const t3Exercises = getT3ExercisesForDay(exercises, t3Schedule, day)
    for (const t3Exercise of t3Exercises) {
      const t3ProgressionKey = getProgressionKey(t3Exercise.id, t3Exercise.role, 'T3')
      const t3Progression = progression[t3ProgressionKey]
      if (t3Progression) {
        routineExercises.push(
          buildRoutineExercise(t3Exercise, t3Progression, settings, day)
        )
      }
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
  t3Schedule?: Record<GZCLPDay, string[]>,
  folderId?: number,
  notes?: string
): CreateRoutineRequest {
  const routine = buildDayRoutine(day, exercises, progression, settings, t3Schedule)

  const routineData: CreateRoutineRequest['routine'] = {
    title: routine.title,
    folder_id: folderId ?? null,
    exercises: routine.exercises,
  }
  if (notes !== undefined) {
    routineData.notes = notes
  }
  return { routine: routineData }
}

// =============================================================================
// Selective Routine Building
// =============================================================================

/**
 * Weight override for exercises that should keep Hevy's weight.
 */
export interface SelectiveWeightOverride {
  progressionKey: string
  weightKg: number // Weight in kg (from Hevy)
}

/**
 * Build a routine payload with selective weight overrides.
 * Exercises with overrides use the provided weight instead of local progression.
 * This is used for skip/pull actions where we want to preserve Hevy's weight.
 */
export function buildSelectiveRoutinePayload(
  day: GZCLPDay,
  exercises: Record<string, ExerciseConfig>,
  progression: Record<string, ProgressionState>,
  settings: UserSettings,
  overrides: SelectiveWeightOverride[],
  t3Schedule?: Record<GZCLPDay, string[]>,
  folderId?: number,
  notes?: string
): CreateRoutineRequest {
  // Build a temporary progression with overridden weights
  const effectiveProgression: Record<string, ProgressionState> = {}

  // Create override lookup
  const overrideMap = new Map<string, number>()
  for (const override of overrides) {
    overrideMap.set(override.progressionKey, override.weightKg)
  }

  // Copy progression, applying overrides
  for (const [key, state] of Object.entries(progression)) {
    const overrideWeightKg = overrideMap.get(key)
    if (overrideWeightKg !== undefined) {
      // Convert kg back to user's unit for the progression state
      const overrideWeight =
        settings.weightUnit === 'kg'
          ? overrideWeightKg
          : Math.round(overrideWeightKg / LBS_TO_KG * 10) / 10
      effectiveProgression[key] = {
        ...state,
        currentWeight: overrideWeight,
      }
    } else {
      effectiveProgression[key] = state
    }
  }

  return buildRoutinePayload(day, exercises, effectiveProgression, settings, t3Schedule, folderId, notes)
}
