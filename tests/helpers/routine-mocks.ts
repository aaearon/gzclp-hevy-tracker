/**
 * Test Helper: Routine Mocks
 *
 * Factory functions for creating mock Hevy routines and related data
 * for testing the routine import functionality.
 */

import type { Routine, RoutineExerciseRead, RoutineSetRead, SetType } from '@/types/hevy'
import type { RoutineAssignment, AvailableRoutine } from '@/types/state'

// =============================================================================
// Set Factories
// =============================================================================

/**
 * Create a single normal set with the specified reps and weight.
 */
export function createNormalSet(reps: number, weight = 60): RoutineSetRead {
  return {
    index: 0,
    type: 'normal',
    weight_kg: weight,
    reps,
    rep_range: null,
    distance_meters: null,
    duration_seconds: null,
    rpe: null,
    custom_metric: null,
  }
}

/**
 * Create an array of normal sets with the same reps and weight.
 */
export function createNormalSets(count: number, reps: number, weight = 60): RoutineSetRead[] {
  return Array.from({ length: count }, (_, i) => ({
    ...createNormalSet(reps, weight),
    index: i,
  }))
}

/**
 * Create a set with a specific type.
 */
export function createSet(
  type: SetType,
  reps: number,
  weight: number | null = 60
): RoutineSetRead {
  return {
    index: 0,
    type,
    weight_kg: weight,
    reps,
    rep_range: null,
    distance_meters: null,
    duration_seconds: null,
    rpe: null,
    custom_metric: null,
  }
}

// =============================================================================
// Exercise Factories
// =============================================================================

/**
 * Create a routine exercise with the specified sets.
 */
export function createRoutineExercise(
  title: string,
  sets: RoutineSetRead[],
  templateId = `template-${title.toLowerCase().replace(/\s+/g, '-')}`
): RoutineExerciseRead {
  return {
    index: 0,
    title,
    rest_seconds: 180,
    notes: '',
    exercise_template_id: templateId,
    supersets_id: null,
    sets,
  }
}

/**
 * Create a T1 exercise at a specific stage.
 */
export function createT1Exercise(
  title: string,
  stage: 0 | 1 | 2,
  weight = 60,
  templateId?: string
): RoutineExerciseRead {
  const schemes: Record<0 | 1 | 2, { sets: number; reps: number }> = {
    0: { sets: 5, reps: 3 },
    1: { sets: 6, reps: 2 },
    2: { sets: 10, reps: 1 },
  }
  const { sets, reps } = schemes[stage]
  return createRoutineExercise(title, createNormalSets(sets, reps, weight), templateId)
}

/**
 * Create a T2 exercise at a specific stage.
 */
export function createT2Exercise(
  title: string,
  stage: 0 | 1 | 2,
  weight = 40,
  templateId?: string
): RoutineExerciseRead {
  const schemes: Record<0 | 1 | 2, { sets: number; reps: number }> = {
    0: { sets: 3, reps: 10 },
    1: { sets: 3, reps: 8 },
    2: { sets: 3, reps: 6 },
  }
  const { sets, reps } = schemes[stage]
  return createRoutineExercise(title, createNormalSets(sets, reps, weight), templateId)
}

/**
 * Create a T3 exercise with default 3x15 scheme.
 */
export function createT3Exercise(
  title: string,
  weight: number | null = 20,
  templateId?: string
): RoutineExerciseRead {
  return createRoutineExercise(title, createNormalSets(3, 15, weight ?? 0), templateId)
}

// =============================================================================
// Routine Factories
// =============================================================================

/**
 * Create a mock routine with the given exercises.
 */
export function createMockRoutine(
  title: string,
  exercises: RoutineExerciseRead[],
  id?: string
): Routine {
  const routineId = id ?? `routine-${title.toLowerCase().replace(/\s+/g, '-')}`
  const now = new Date().toISOString()
  return {
    id: routineId,
    title,
    folder_id: null,
    updated_at: now,
    created_at: now,
    exercises: exercises.map((ex, i) => ({ ...ex, index: i })),
  }
}

/**
 * Create a standard GZCLP A1 routine (Squat T1, Bench T2, 3 T3s).
 */
export function createGZCLPA1Routine(
  stages: { t1: 0 | 1 | 2; t2: 0 | 1 | 2 } = { t1: 0, t2: 0 },
  weights: { t1: number; t2: number; t3: number } = { t1: 60, t2: 40, t3: 20 }
): Routine {
  return createMockRoutine('GZCLP A1', [
    createT1Exercise('Squat', stages.t1, weights.t1),
    createT2Exercise('Bench Press', stages.t2, weights.t2),
    createT3Exercise('Lat Pulldown', weights.t3),
    createT3Exercise('Cable Row', weights.t3),
    createT3Exercise('Leg Curl', weights.t3),
  ])
}

/**
 * Create a standard GZCLP B1 routine (OHP T1, Deadlift T2, 3 T3s).
 */
export function createGZCLPB1Routine(
  stages: { t1: 0 | 1 | 2; t2: 0 | 1 | 2 } = { t1: 0, t2: 0 },
  weights: { t1: number; t2: number; t3: number } = { t1: 40, t2: 80, t3: 20 }
): Routine {
  return createMockRoutine('GZCLP B1', [
    createT1Exercise('Overhead Press', stages.t1, weights.t1),
    createT2Exercise('Deadlift', stages.t2, weights.t2),
    createT3Exercise('Lat Pulldown', weights.t3),
    createT3Exercise('Cable Row', weights.t3),
    createT3Exercise('Leg Curl', weights.t3),
  ])
}

/**
 * Create a standard GZCLP A2 routine (Bench T1, Squat T2, 3 T3s).
 */
export function createGZCLPA2Routine(
  stages: { t1: 0 | 1 | 2; t2: 0 | 1 | 2 } = { t1: 0, t2: 0 },
  weights: { t1: number; t2: number; t3: number } = { t1: 50, t2: 50, t3: 20 }
): Routine {
  return createMockRoutine('GZCLP A2', [
    createT1Exercise('Bench Press', stages.t1, weights.t1),
    createT2Exercise('Squat', stages.t2, weights.t2),
    createT3Exercise('Lat Pulldown', weights.t3),
    createT3Exercise('Cable Row', weights.t3),
    createT3Exercise('Leg Curl', weights.t3),
  ])
}

/**
 * Create a standard GZCLP B2 routine (Deadlift T1, OHP T2, 3 T3s).
 */
export function createGZCLPB2Routine(
  stages: { t1: 0 | 1 | 2; t2: 0 | 1 | 2 } = { t1: 0, t2: 0 },
  weights: { t1: number; t2: number; t3: number } = { t1: 100, t2: 35, t3: 20 }
): Routine {
  return createMockRoutine('GZCLP B2', [
    createT1Exercise('Deadlift', stages.t1, weights.t1),
    createT2Exercise('Overhead Press', stages.t2, weights.t2),
    createT3Exercise('Lat Pulldown', weights.t3),
    createT3Exercise('Cable Row', weights.t3),
    createT3Exercise('Leg Curl', weights.t3),
  ])
}

// =============================================================================
// AvailableRoutine Factories
// =============================================================================

/**
 * Convert a Routine to an AvailableRoutine summary.
 */
export function toAvailableRoutineMock(routine: Routine): AvailableRoutine {
  return {
    id: routine.id,
    title: routine.title,
    exerciseCount: routine.exercises.length,
    exercisePreview: routine.exercises.slice(0, 3).map((ex) => ex.title),
    updatedAt: routine.updated_at,
  }
}

// =============================================================================
// Assignment Factories
// =============================================================================

/**
 * Create an empty routine assignment.
 */
export function createEmptyAssignment(): RoutineAssignment {
  return {
    A1: null,
    B1: null,
    A2: null,
    B2: null,
  }
}

/**
 * Create a full routine assignment with all 4 days.
 */
export function createFullAssignment(routineIds: {
  A1: string
  B1: string
  A2: string
  B2: string
}): RoutineAssignment {
  return routineIds
}

/**
 * Create a partial routine assignment.
 */
export function createPartialAssignment(
  assignments: Partial<RoutineAssignment>
): RoutineAssignment {
  return {
    A1: null,
    B1: null,
    A2: null,
    B2: null,
    ...assignments,
  }
}
