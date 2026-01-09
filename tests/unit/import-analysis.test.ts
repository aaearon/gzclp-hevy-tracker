/**
 * Unit Tests: Import Analysis
 *
 * Tests for analyzing workout performance and calculating GZCLP progression
 * suggestions for the import wizard.
 */

import { describe, it, expect } from 'vitest'
import {
  findMostRecentWorkoutForExercise,
  analyzeExercisePerformance,
  calculateImportProgression,
  analyzeExerciseForImport,
} from '@/lib/import-analysis'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types/hevy'
import type { Stage, Tier, MuscleGroupCategory, WeightUnit } from '@/types/state'
import type { WorkoutPerformance } from '@/types/import'

// =============================================================================
// Test Data Fixtures
// =============================================================================

function createMockWorkoutSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    index: 0,
    type: 'normal',
    weight_kg: 100,
    reps: 5,
    distance_meters: null,
    duration_seconds: null,
    rpe: null,
    custom_metric: null,
    ...overrides,
  }
}

function createMockWorkoutExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    index: 0,
    title: 'Squat',
    notes: '',
    exercise_template_id: 'template-1',
    supersets_id: null,
    sets: [
      createMockWorkoutSet({ index: 0, reps: 3 }),
      createMockWorkoutSet({ index: 1, reps: 3 }),
      createMockWorkoutSet({ index: 2, reps: 3 }),
      createMockWorkoutSet({ index: 3, reps: 3 }),
      createMockWorkoutSet({ index: 4, reps: 5 }),
    ],
    ...overrides,
  }
}

function createMockWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    title: 'Day A1',
    routine_id: 'routine-1',
    description: '',
    start_time: '2026-01-05T10:00:00Z',
    end_time: '2026-01-05T11:00:00Z',
    updated_at: '2026-01-05T11:00:00Z',
    created_at: '2026-01-05T10:00:00Z',
    exercises: [createMockWorkoutExercise()],
    ...overrides,
  }
}

// =============================================================================
// findMostRecentWorkoutForExercise
// =============================================================================

describe('findMostRecentWorkoutForExercise', () => {
  it('finds workout matching routine ID and exercise template', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-1',
        routine_id: 'routine-1',
        exercises: [createMockWorkoutExercise({ exercise_template_id: 'template-1' })],
      }),
    ]

    const result = findMostRecentWorkoutForExercise(workouts, 'routine-1', 'template-1')

    expect(result).not.toBeNull()
    expect(result?.workout.id).toBe('workout-1')
    expect(result?.exercise.exercise_template_id).toBe('template-1')
  })

  it('returns most recent when multiple workouts exist', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-old',
        routine_id: 'routine-1',
        start_time: '2026-01-01T10:00:00Z',
        exercises: [createMockWorkoutExercise({ exercise_template_id: 'template-1' })],
      }),
      createMockWorkout({
        id: 'workout-newer',
        routine_id: 'routine-1',
        start_time: '2026-01-05T10:00:00Z',
        exercises: [createMockWorkoutExercise({ exercise_template_id: 'template-1' })],
      }),
      createMockWorkout({
        id: 'workout-middle',
        routine_id: 'routine-1',
        start_time: '2026-01-03T10:00:00Z',
        exercises: [createMockWorkoutExercise({ exercise_template_id: 'template-1' })],
      }),
    ]

    const result = findMostRecentWorkoutForExercise(workouts, 'routine-1', 'template-1')

    expect(result).not.toBeNull()
    expect(result?.workout.id).toBe('workout-newer')
  })

  it('returns null when no matching workout found', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-1',
        routine_id: 'routine-1',
        exercises: [createMockWorkoutExercise({ exercise_template_id: 'template-other' })],
      }),
    ]

    const result = findMostRecentWorkoutForExercise(workouts, 'routine-1', 'template-1')

    expect(result).toBeNull()
  })

  it('ignores workouts from different routines', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-wrong-routine',
        routine_id: 'routine-other',
        start_time: '2026-01-10T10:00:00Z', // More recent but wrong routine
        exercises: [createMockWorkoutExercise({ exercise_template_id: 'template-1' })],
      }),
      createMockWorkout({
        id: 'workout-correct-routine',
        routine_id: 'routine-1',
        start_time: '2026-01-05T10:00:00Z',
        exercises: [createMockWorkoutExercise({ exercise_template_id: 'template-1' })],
      }),
    ]

    const result = findMostRecentWorkoutForExercise(workouts, 'routine-1', 'template-1')

    expect(result).not.toBeNull()
    expect(result?.workout.id).toBe('workout-correct-routine')
  })

  it('returns null when workouts array is empty', () => {
    const result = findMostRecentWorkoutForExercise([], 'routine-1', 'template-1')

    expect(result).toBeNull()
  })

  it('finds exercise among multiple exercises in workout', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-1',
        routine_id: 'routine-1',
        exercises: [
          createMockWorkoutExercise({ index: 0, exercise_template_id: 'template-squat' }),
          createMockWorkoutExercise({ index: 1, exercise_template_id: 'template-bench' }),
          createMockWorkoutExercise({ index: 2, exercise_template_id: 'template-curl' }),
        ],
      }),
    ]

    const result = findMostRecentWorkoutForExercise(workouts, 'routine-1', 'template-bench')

    expect(result).not.toBeNull()
    expect(result?.exercise.exercise_template_id).toBe('template-bench')
    expect(result?.exercise.index).toBe(1)
  })
})

// =============================================================================
// analyzeExercisePerformance
// =============================================================================

describe('analyzeExercisePerformance', () => {
  it('extracts correct reps from normal sets only', () => {
    const exercise = createMockWorkoutExercise({
      sets: [
        createMockWorkoutSet({ index: 0, type: 'warmup', reps: 10 }),
        createMockWorkoutSet({ index: 1, type: 'warmup', reps: 5 }),
        createMockWorkoutSet({ index: 2, type: 'normal', reps: 3 }),
        createMockWorkoutSet({ index: 3, type: 'normal', reps: 3 }),
        createMockWorkoutSet({ index: 4, type: 'normal', reps: 3 }),
        createMockWorkoutSet({ index: 5, type: 'normal', reps: 3 }),
        createMockWorkoutSet({ index: 6, type: 'normal', reps: 5 }),
      ],
    })
    const workout = createMockWorkout({ exercises: [exercise] })

    const result = analyzeExercisePerformance(exercise, workout)

    expect(result.reps).toEqual([3, 3, 3, 3, 5]) // Warmups excluded
    expect(result.totalSets).toBe(5)
  })

  it('extracts correct working weight', () => {
    const exercise = createMockWorkoutExercise({
      sets: [
        createMockWorkoutSet({ index: 0, type: 'warmup', weight_kg: 60 }),
        createMockWorkoutSet({ index: 1, type: 'normal', weight_kg: 100 }),
        createMockWorkoutSet({ index: 2, type: 'normal', weight_kg: 100 }),
        createMockWorkoutSet({ index: 3, type: 'normal', weight_kg: 100 }),
      ],
    })
    const workout = createMockWorkout({ exercises: [exercise] })

    const result = analyzeExercisePerformance(exercise, workout)

    expect(result.weight).toBe(100) // First normal set weight
  })

  it('includes workout date and ID', () => {
    const exercise = createMockWorkoutExercise()
    const workout = createMockWorkout({
      id: 'workout-abc',
      start_time: '2026-01-08T14:30:00Z',
    })

    const result = analyzeExercisePerformance(exercise, workout)

    expect(result.workoutId).toBe('workout-abc')
    expect(result.workoutDate).toBe('2026-01-08T14:30:00Z')
  })

  it('handles sets with null reps as 0', () => {
    const exercise = createMockWorkoutExercise({
      sets: [
        createMockWorkoutSet({ index: 0, type: 'normal', reps: 3 }),
        createMockWorkoutSet({ index: 1, type: 'normal', reps: null }),
        createMockWorkoutSet({ index: 2, type: 'normal', reps: 2 }),
      ],
    })
    const workout = createMockWorkout({ exercises: [exercise] })

    const result = analyzeExercisePerformance(exercise, workout)

    expect(result.reps).toEqual([3, 0, 2])
  })

  it('handles sets with null weight as 0', () => {
    const exercise = createMockWorkoutExercise({
      sets: [
        createMockWorkoutSet({ index: 0, type: 'normal', weight_kg: null, reps: 3 }),
      ],
    })
    const workout = createMockWorkout({ exercises: [exercise] })

    const result = analyzeExercisePerformance(exercise, workout)

    expect(result.weight).toBe(0)
  })

  it('includes dropsets in rep count', () => {
    const exercise = createMockWorkoutExercise({
      sets: [
        createMockWorkoutSet({ index: 0, type: 'normal', reps: 10 }),
        createMockWorkoutSet({ index: 1, type: 'dropset', reps: 8 }),
        createMockWorkoutSet({ index: 2, type: 'dropset', reps: 6 }),
      ],
    })
    const workout = createMockWorkout({ exercises: [exercise] })

    const result = analyzeExercisePerformance(exercise, workout)

    expect(result.reps).toEqual([10, 8, 6])
    expect(result.totalSets).toBe(3)
  })
})

// =============================================================================
// calculateImportProgression
// =============================================================================

describe('calculateImportProgression', () => {
  describe('T1 progression', () => {
    it('suggests +2.5kg for lower body success at stage 0', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 100,
        reps: [3, 3, 3, 3, 5], // 5x3+ success
        totalSets: 5,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T1' as Tier,
        'lower' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('progress')
      expect(result.suggestedWeight).toBe(105) // +5kg for lower body
      expect(result.success).toBe(true)
      expect(result.suggestedStage).toBe(0)
    })

    it('suggests +2.5kg for upper body success at stage 0', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 60,
        reps: [3, 3, 3, 3, 5],
        totalSets: 5,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T1' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('progress')
      expect(result.suggestedWeight).toBe(62.5) // +2.5kg for upper body
      expect(result.success).toBe(true)
    })

    it('suggests stage change on failure at stage 0', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 100,
        reps: [3, 3, 3, 2, 2], // Failed last two sets
        totalSets: 5,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T1' as Tier,
        'lower' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('stage_change')
      expect(result.suggestedWeight).toBe(100) // Same weight
      expect(result.suggestedStage).toBe(1) // Move to stage 1 (6x2+)
      expect(result.success).toBe(false)
    })

    it('suggests stage change on failure at stage 1', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 100,
        reps: [2, 2, 2, 2, 1, 1], // Failed at 6x2
        totalSets: 6,
      }

      const result = calculateImportProgression(
        performance,
        1 as Stage,
        'T1' as Tier,
        'lower' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('stage_change')
      expect(result.suggestedWeight).toBe(100)
      expect(result.suggestedStage).toBe(2) // Move to stage 2 (10x1+)
      expect(result.success).toBe(false)
    })

    it('suggests deload on failure at stage 2', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 100,
        reps: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // Failed at 10x1
        totalSets: 10,
      }

      const result = calculateImportProgression(
        performance,
        2 as Stage,
        'T1' as Tier,
        'lower' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('deload')
      expect(result.suggestedWeight).toBe(85) // 85% of 100, rounded
      expect(result.suggestedStage).toBe(0) // Back to stage 0
      expect(result.success).toBe(false)
    })

    it('tracks AMRAP reps correctly', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 100,
        reps: [3, 3, 3, 3, 8], // AMRAP set is 8 reps
        totalSets: 5,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T1' as Tier,
        'lower' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.amrapReps).toBe(8)
    })

    it('uses lbs increments correctly', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 225,
        reps: [3, 3, 3, 3, 5],
        totalSets: 5,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T1' as Tier,
        'lower' as MuscleGroupCategory,
        'lbs' as WeightUnit
      )

      expect(result.suggestedWeight).toBe(235) // +10lbs for lower body
    })
  })

  describe('T2 progression', () => {
    it('suggests weight increase on success', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 60,
        reps: [10, 10, 10], // 3x10 success
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T2' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('progress')
      expect(result.suggestedWeight).toBe(62.5)
      expect(result.suggestedStage).toBe(0)
      expect(result.success).toBe(true)
    })

    it('suggests stage change on failure', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 60,
        reps: [10, 8, 7], // Failed to hit 3x10
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T2' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('stage_change')
      expect(result.suggestedWeight).toBe(60)
      expect(result.suggestedStage).toBe(1) // Move to 3x8
      expect(result.success).toBe(false)
    })

    it('suggests deload at stage 2 failure', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 80,
        reps: [6, 5, 4], // Failed 3x6
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        2 as Stage,
        'T2' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('deload')
      expect(result.suggestedWeight).toBe(67.5) // 85% of 80, rounded to 2.5
      expect(result.suggestedStage).toBe(0) // Back to stage 0 (3x10)
      expect(result.success).toBe(false)
    })

    it('progresses correctly at stage 1 (3x8)', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 70,
        reps: [8, 8, 8], // 3x8 success
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        1 as Stage,
        'T2' as Tier,
        'lower' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('progress')
      expect(result.suggestedWeight).toBe(75) // +5kg for lower body
      expect(result.suggestedStage).toBe(1)
      expect(result.success).toBe(true)
    })
  })

  describe('T3 progression', () => {
    it('suggests +2.5kg when AMRAP >= 25', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 10,
        reps: [15, 15, 25], // AMRAP hit 25
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T3' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('progress')
      expect(result.suggestedWeight).toBe(12.5)
      expect(result.success).toBe(true)
      expect(result.amrapReps).toBe(25)
    })

    it('suggests repeat when AMRAP < 25', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 10,
        reps: [15, 15, 20], // AMRAP only 20
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T3' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('repeat')
      expect(result.suggestedWeight).toBe(10) // Same weight
      expect(result.success).toBe(false)
      expect(result.amrapReps).toBe(20)
    })

    it('never suggests deload', () => {
      // Even with very poor performance, T3 should repeat, not deload
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 15,
        reps: [10, 8, 5], // Very poor performance
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T3' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('repeat')
      expect(result.type).not.toBe('deload')
      expect(result.suggestedWeight).toBe(15)
    })

    it('T3 always stays at stage 0', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 10,
        reps: [15, 15, 30],
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T3' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.suggestedStage).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty reps array', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 100,
        reps: [],
        totalSets: 0,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T1' as Tier,
        'lower' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.success).toBe(false)
      expect(result.type).toBe('stage_change')
    })

    it('handles insufficient sets', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 100,
        reps: [3, 3, 3], // Only 3 sets, need 5 for T1 stage 0
        totalSets: 3,
      }

      const result = calculateImportProgression(
        performance,
        0 as Stage,
        'T1' as Tier,
        'lower' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.success).toBe(false)
    })

    it('deload respects minimum bar weight', () => {
      const performance: WorkoutPerformance = {
        workoutId: 'w1',
        workoutDate: '2026-01-05T10:00:00Z',
        weight: 22.5, // Very light weight
        reps: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Failed at 10x1
        totalSets: 10,
      }

      const result = calculateImportProgression(
        performance,
        2 as Stage,
        'T1' as Tier,
        'upper' as MuscleGroupCategory,
        'kg' as WeightUnit
      )

      expect(result.type).toBe('deload')
      // 85% of 22.5 = 19.125, rounded would be less than bar weight
      // Should be minimum bar weight (20kg)
      expect(result.suggestedWeight).toBe(20)
    })
  })
})

// =============================================================================
// analyzeExerciseForImport
// =============================================================================

describe('analyzeExerciseForImport', () => {
  it('returns complete analysis for exercise with workout data', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-1',
        routine_id: 'routine-1',
        start_time: '2026-01-05T10:00:00Z',
        exercises: [
          createMockWorkoutExercise({
            exercise_template_id: 'template-squat',
            sets: [
              createMockWorkoutSet({ index: 0, type: 'normal', weight_kg: 100, reps: 3 }),
              createMockWorkoutSet({ index: 1, type: 'normal', weight_kg: 100, reps: 3 }),
              createMockWorkoutSet({ index: 2, type: 'normal', weight_kg: 100, reps: 3 }),
              createMockWorkoutSet({ index: 3, type: 'normal', weight_kg: 100, reps: 3 }),
              createMockWorkoutSet({ index: 4, type: 'normal', weight_kg: 100, reps: 5 }),
            ],
          }),
        ],
      }),
    ]

    const result = analyzeExerciseForImport(
      workouts,
      'routine-1',
      'template-squat',
      0 as Stage,
      'T1' as Tier,
      'lower' as MuscleGroupCategory,
      'kg' as WeightUnit
    )

    expect(result.hasWorkoutData).toBe(true)
    expect(result.performance).not.toBeNull()
    expect(result.suggestion).not.toBeNull()
    expect(result.tier).toBe('T1')

    // Check performance data
    expect(result.performance?.weight).toBe(100)
    expect(result.performance?.reps).toEqual([3, 3, 3, 3, 5])
    expect(result.performance?.workoutId).toBe('workout-1')

    // Check suggestion (should progress since all sets hit)
    expect(result.suggestion?.type).toBe('progress')
    expect(result.suggestion?.suggestedWeight).toBe(105)
    expect(result.suggestion?.success).toBe(true)
  })

  it('returns hasWorkoutData=false when no workout found', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-1',
        routine_id: 'routine-other', // Different routine
        exercises: [createMockWorkoutExercise({ exercise_template_id: 'template-squat' })],
      }),
    ]

    const result = analyzeExerciseForImport(
      workouts,
      'routine-1',
      'template-squat',
      0 as Stage,
      'T1' as Tier,
      'lower' as MuscleGroupCategory,
      'kg' as WeightUnit
    )

    expect(result.hasWorkoutData).toBe(false)
    expect(result.performance).toBeNull()
    expect(result.suggestion).toBeNull()
    expect(result.tier).toBe('T1')
  })

  it('integrates performance and progression correctly', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-1',
        routine_id: 'routine-1',
        exercises: [
          createMockWorkoutExercise({
            exercise_template_id: 'template-bench',
            sets: [
              createMockWorkoutSet({ index: 0, type: 'normal', weight_kg: 50, reps: 10 }),
              createMockWorkoutSet({ index: 1, type: 'normal', weight_kg: 50, reps: 10 }),
              createMockWorkoutSet({ index: 2, type: 'normal', weight_kg: 50, reps: 8 }), // Failed
            ],
          }),
        ],
      }),
    ]

    const result = analyzeExerciseForImport(
      workouts,
      'routine-1',
      'template-bench',
      0 as Stage,
      'T2' as Tier,
      'upper' as MuscleGroupCategory,
      'kg' as WeightUnit
    )

    expect(result.hasWorkoutData).toBe(true)
    expect(result.performance?.weight).toBe(50)
    expect(result.performance?.reps).toEqual([10, 10, 8])

    // Should suggest stage change since 3x10 failed
    expect(result.suggestion?.type).toBe('stage_change')
    expect(result.suggestion?.suggestedWeight).toBe(50)
    expect(result.suggestion?.suggestedStage).toBe(1) // Move to 3x8
    expect(result.suggestion?.success).toBe(false)
  })

  it('handles empty workouts array', () => {
    const result = analyzeExerciseForImport(
      [],
      'routine-1',
      'template-squat',
      0 as Stage,
      'T1' as Tier,
      'lower' as MuscleGroupCategory,
      'kg' as WeightUnit
    )

    expect(result.hasWorkoutData).toBe(false)
    expect(result.performance).toBeNull()
    expect(result.suggestion).toBeNull()
  })

  it('uses most recent workout when multiple exist', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        id: 'workout-old',
        routine_id: 'routine-1',
        start_time: '2026-01-01T10:00:00Z',
        exercises: [
          createMockWorkoutExercise({
            exercise_template_id: 'template-squat',
            sets: [
              createMockWorkoutSet({ weight_kg: 80, reps: 3 }),
              createMockWorkoutSet({ weight_kg: 80, reps: 3 }),
              createMockWorkoutSet({ weight_kg: 80, reps: 3 }),
              createMockWorkoutSet({ weight_kg: 80, reps: 3 }),
              createMockWorkoutSet({ weight_kg: 80, reps: 5 }),
            ],
          }),
        ],
      }),
      createMockWorkout({
        id: 'workout-new',
        routine_id: 'routine-1',
        start_time: '2026-01-05T10:00:00Z',
        exercises: [
          createMockWorkoutExercise({
            exercise_template_id: 'template-squat',
            sets: [
              createMockWorkoutSet({ weight_kg: 100, reps: 3 }),
              createMockWorkoutSet({ weight_kg: 100, reps: 3 }),
              createMockWorkoutSet({ weight_kg: 100, reps: 3 }),
              createMockWorkoutSet({ weight_kg: 100, reps: 3 }),
              createMockWorkoutSet({ weight_kg: 100, reps: 5 }),
            ],
          }),
        ],
      }),
    ]

    const result = analyzeExerciseForImport(
      workouts,
      'routine-1',
      'template-squat',
      0 as Stage,
      'T1' as Tier,
      'lower' as MuscleGroupCategory,
      'kg' as WeightUnit
    )

    expect(result.hasWorkoutData).toBe(true)
    expect(result.performance?.weight).toBe(100) // From newer workout
    expect(result.performance?.workoutId).toBe('workout-new')
  })

  it('provides correct tier in result', () => {
    const workouts: Workout[] = [
      createMockWorkout({
        routine_id: 'routine-1',
        exercises: [
          createMockWorkoutExercise({
            exercise_template_id: 'template-curl',
            sets: [
              createMockWorkoutSet({ weight_kg: 10, reps: 15 }),
              createMockWorkoutSet({ weight_kg: 10, reps: 15 }),
              createMockWorkoutSet({ weight_kg: 10, reps: 20 }),
            ],
          }),
        ],
      }),
    ]

    const result = analyzeExerciseForImport(
      workouts,
      'routine-1',
      'template-curl',
      0 as Stage,
      'T3' as Tier,
      'upper' as MuscleGroupCategory,
      'kg' as WeightUnit
    )

    expect(result.tier).toBe('T3')
    expect(result.suggestion?.type).toBe('repeat') // AMRAP < 25
  })
})
