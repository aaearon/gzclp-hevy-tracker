/**
 * Test Helper: Workout Mocks
 *
 * Factory functions for creating mock Hevy workouts for testing
 * the weeks calculation functionality.
 */

import type { Workout, WorkoutExercise, WorkoutSet } from '@/types/hevy'

// =============================================================================
// Set Factories
// =============================================================================

/**
 * Create a workout set with default values.
 */
export function createWorkoutSet(
  reps: number,
  weight = 60,
  index = 0
): WorkoutSet {
  return {
    index,
    type: 'normal',
    weight_kg: weight,
    reps,
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
 * Create a workout exercise with sets.
 */
export function createWorkoutExercise(
  title: string,
  sets: WorkoutSet[],
  templateId = `template-${title.toLowerCase().replace(/\s+/g, '-')}`
): WorkoutExercise {
  return {
    index: 0,
    title,
    notes: '',
    exercise_template_id: templateId,
    supersets_id: null,
    sets,
  }
}

// =============================================================================
// Workout Factories
// =============================================================================

/**
 * Create a mock workout with the specified routine ID.
 */
export function createMockWorkout(
  routineId: string,
  options: {
    id?: string
    title?: string
    date?: string
    exercises?: WorkoutExercise[]
  } = {}
): Workout {
  const id = options.id ?? `workout-${Math.random().toString(36).slice(2, 9)}`
  const date = options.date ?? new Date().toISOString()

  return {
    id,
    title: options.title ?? 'Mock Workout',
    routine_id: routineId,
    description: '',
    start_time: date,
    end_time: date,
    updated_at: date,
    created_at: date,
    exercises: options.exercises ?? [],
  }
}

/**
 * Create multiple workouts for a single routine ID.
 */
export function createMockWorkoutsForRoutine(
  count: number,
  routineId: string,
  startDate?: Date
): Workout[] {
  const baseDate = startDate ?? new Date()

  return Array.from({ length: count }, (_, i) => {
    const workoutDate = new Date(baseDate)
    workoutDate.setDate(workoutDate.getDate() - i * 2) // Space workouts 2 days apart

    return createMockWorkout(routineId, {
      id: `workout-${routineId}-${i}`,
      title: `Workout ${i + 1}`,
      date: workoutDate.toISOString(),
    })
  })
}

/**
 * Create workouts distributed across multiple routine IDs.
 * Useful for testing weeks calculation with 4 GZCLP routines.
 */
export function createMockWorkoutsForRoutines(
  countPerRoutine: number,
  routineIds: string[]
): Workout[] {
  const allWorkouts: Workout[] = []

  for (const routineId of routineIds) {
    allWorkouts.push(...createMockWorkoutsForRoutine(countPerRoutine, routineId))
  }

  return allWorkouts
}

/**
 * Create a set of 4 workouts (one per GZCLP day) representing a single week.
 */
export function createMockWeekOfWorkouts(
  weekNumber: number,
  routineIds: { A1: string; B1: string; A2: string; B2: string },
  baseDate?: Date
): Workout[] {
  const base = baseDate ?? new Date()
  const weekOffset = (weekNumber - 1) * 7

  return [
    createMockWorkout(routineIds.A1, {
      id: `workout-week${weekNumber}-a1`,
      title: `Week ${weekNumber} - Day A1`,
      date: new Date(base.getTime() - (weekOffset + 0) * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createMockWorkout(routineIds.B1, {
      id: `workout-week${weekNumber}-b1`,
      title: `Week ${weekNumber} - Day B1`,
      date: new Date(base.getTime() - (weekOffset + 2) * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createMockWorkout(routineIds.A2, {
      id: `workout-week${weekNumber}-a2`,
      title: `Week ${weekNumber} - Day A2`,
      date: new Date(base.getTime() - (weekOffset + 4) * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createMockWorkout(routineIds.B2, {
      id: `workout-week${weekNumber}-b2`,
      title: `Week ${weekNumber} - Day B2`,
      date: new Date(base.getTime() - (weekOffset + 6) * 24 * 60 * 60 * 1000).toISOString(),
    }),
  ]
}

/**
 * Create workouts for multiple weeks of the program.
 */
export function createMockProgramWorkouts(
  weeks: number,
  routineIds: { A1: string; B1: string; A2: string; B2: string },
  baseDate?: Date
): Workout[] {
  const allWorkouts: Workout[] = []

  for (let week = 1; week <= weeks; week++) {
    allWorkouts.push(...createMockWeekOfWorkouts(week, routineIds, baseDate))
  }

  return allWorkouts
}
