/**
 * Role Utilities
 *
 * Tier derivation and role-based utilities for the simplified GZCLP model.
 * Tier is derived from role + current day rather than being stored.
 */

import type { ExerciseConfig, ExerciseRole, GZCLPDay, MainLiftRole, ProgressionKey, Tier } from '@/types/state'
import { MAIN_LIFT_ROLES } from '@/types/state'

// =============================================================================
// Tier Mappings
// =============================================================================

/** Which main lift is T1 on each day */
export const T1_MAPPING: Record<GZCLPDay, MainLiftRole> = {
  A1: 'squat',
  B1: 'ohp',
  A2: 'bench',
  B2: 'deadlift',
}

/** Which main lift is T2 on each day */
export const T2_MAPPING: Record<GZCLPDay, MainLiftRole> = {
  A1: 'bench',
  B1: 'deadlift',
  A2: 'squat',
  B2: 'ohp',
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a role is a main lift role (exclusive, one exercise each).
 */
export function isMainLiftRole(role: ExerciseRole): role is MainLiftRole {
  return MAIN_LIFT_ROLES.includes(role as MainLiftRole)
}

// =============================================================================
// Progression Key Generation
// =============================================================================

/**
 * Generate the progression storage key for an exercise.
 *
 * @param exerciseId - The exercise's unique ID (uuid)
 * @param role - The exercise's role (if assigned)
 * @param tier - The current tier context (T1/T2/T3)
 * @returns The key to use in the progression record
 *
 * @example
 * getProgressionKey("uuid-123", "squat", "T1") // returns "squat-T1"
 * getProgressionKey("uuid-456", "squat", "T2") // returns "squat-T2"
 * getProgressionKey("uuid-789", "t3", "T3")    // returns "uuid-789"
 * getProgressionKey("uuid-000", undefined, "T3") // returns "uuid-000"
 */
export function getProgressionKey(
  exerciseId: string,
  role: ExerciseRole | undefined,
  tier: Tier
): ProgressionKey {
  // Main lifts with T1/T2 context use role-tier key
  if (role && isMainLiftRole(role) && (tier === 'T1' || tier === 'T2')) {
    return `${role}-${tier}`
  }
  // T3 exercises and non-main-lifts use exerciseId
  return exerciseId
}

// =============================================================================
// Tier Derivation
// =============================================================================

/**
 * Get the tier (T1/T2/T3) for an exercise role on a specific day.
 *
 * @param role - The exercise role
 * @param day - The GZCLP workout day
 * @returns The tier, or null if not scheduled (warmup/cooldown or main lift not on this day)
 */
export function getTierForDay(role: ExerciseRole, day: GZCLPDay): Tier | null {
  // Warmup and cooldown have no tier
  if (role === 'warmup' || role === 'cooldown') {
    return null
  }

  // T3 is always T3
  if (role === 't3') {
    return 'T3'
  }

  // Main lifts: check if T1 or T2 for this day
  if (T1_MAPPING[day] === role) {
    return 'T1'
  }
  if (T2_MAPPING[day] === role) {
    return 'T2'
  }

  // Main lift not scheduled for this day
  return null
}

// =============================================================================
// Exercise Grouping
// =============================================================================

export interface DayExercises {
  t1: ExerciseConfig | null
  t2: ExerciseConfig | null
  t3: ExerciseConfig[]
  warmup: ExerciseConfig[]
  cooldown: ExerciseConfig[]
}

/**
 * Group exercises by their derived tier/role for a specific day.
 *
 * @param exercises - Record of all exercises keyed by ID
 * @param day - The GZCLP workout day
 * @param t3Schedule - Per-day T3 schedule mapping days to exercise IDs
 * @returns Grouped exercises for display
 */
export function getExercisesForDay(
  exercises: Record<string, ExerciseConfig>,
  day: GZCLPDay,
  t3Schedule: Record<GZCLPDay, string[]>
): DayExercises {
  const result: DayExercises = {
    t1: null,
    t2: null,
    t3: [],
    warmup: [],
    cooldown: [],
  }

  const dayT3Ids = t3Schedule[day] ?? []

  for (const exercise of Object.values(exercises)) {
    const { role } = exercise
    if (!role) continue

    if (role === 'warmup') {
      result.warmup.push(exercise)
    } else if (role === 'cooldown') {
      result.cooldown.push(exercise)
    } else if (role === 't3') {
      // Only include T3s scheduled for this specific day
      if (dayT3Ids.includes(exercise.id)) {
        result.t3.push(exercise)
      }
    } else {
      // Main lift - check if T1 or T2 for this day
      const tier = getTierForDay(role, day)
      if (tier === 'T1') {
        result.t1 = exercise
      } else if (tier === 'T2') {
        result.t2 = exercise
      }
    }
  }

  return result
}

/**
 * Get the main lift role that is T1 for a given day.
 */
export function getT1RoleForDay(day: GZCLPDay): MainLiftRole {
  return T1_MAPPING[day]
}

/**
 * Get the main lift role that is T2 for a given day.
 */
export function getT2RoleForDay(day: GZCLPDay): MainLiftRole {
  return T2_MAPPING[day]
}
