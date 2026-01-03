/**
 * Unit Tests: Routine Builder
 *
 * Tests for building Hevy routine payloads from GZCLP program state.
 * [US4] User Story 4 - Update Hevy Routines
 */

import { describe, it, expect } from 'vitest'
import {
  buildRoutineExercise,
  buildRoutineSet,
  buildRoutinePayload,
  buildDayRoutine,
} from '@/lib/routine-builder'
import type { ExerciseConfig, ProgressionState, UserSettings, GZCLPDay } from '@/types/state'
import type { RoutineExerciseWrite, RoutineSetWrite } from '@/types/hevy'

describe('[US4] Routine Builder', () => {
  const defaultSettings: UserSettings = {
    weightUnit: 'kg',
    increments: { upper: 2.5, lower: 5 },
    restTimers: { t1: 180, t2: 120, t3: 60 },
  }

  const mockExercises: Record<string, ExerciseConfig> = {
    'ex-squat-t1': {
      id: 'ex-squat-t1',
      hevyTemplateId: 'hevy-squat',
      name: 'Squat (Barbell)',
      tier: 'T1',
      slot: 't1_squat',
      muscleGroup: 'lower',
    },
    'ex-bench-t1': {
      id: 'ex-bench-t1',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press (Barbell)',
      tier: 'T1',
      slot: 't1_bench',
      muscleGroup: 'upper',
    },
    'ex-ohp-t1': {
      id: 'ex-ohp-t1',
      hevyTemplateId: 'hevy-ohp',
      name: 'Overhead Press (Barbell)',
      tier: 'T1',
      slot: 't1_ohp',
      muscleGroup: 'upper',
    },
    'ex-deadlift-t1': {
      id: 'ex-deadlift-t1',
      hevyTemplateId: 'hevy-deadlift',
      name: 'Deadlift (Barbell)',
      tier: 'T1',
      slot: 't1_deadlift',
      muscleGroup: 'lower',
    },
    'ex-squat-t2': {
      id: 'ex-squat-t2',
      hevyTemplateId: 'hevy-squat',
      name: 'Squat (Barbell)',
      tier: 'T2',
      slot: 't2_squat',
      muscleGroup: 'lower',
    },
    'ex-bench-t2': {
      id: 'ex-bench-t2',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press (Barbell)',
      tier: 'T2',
      slot: 't2_bench',
      muscleGroup: 'upper',
    },
    'ex-ohp-t2': {
      id: 'ex-ohp-t2',
      hevyTemplateId: 'hevy-ohp',
      name: 'Overhead Press (Barbell)',
      tier: 'T2',
      slot: 't2_ohp',
      muscleGroup: 'upper',
    },
    'ex-deadlift-t2': {
      id: 'ex-deadlift-t2',
      hevyTemplateId: 'hevy-deadlift',
      name: 'Deadlift (Barbell)',
      tier: 'T2',
      slot: 't2_deadlift',
      muscleGroup: 'lower',
    },
    'ex-curl-t3': {
      id: 'ex-curl-t3',
      hevyTemplateId: 'hevy-curl',
      name: 'Bicep Curl',
      tier: 'T3',
      slot: 't3_1',
      muscleGroup: 'upper',
    },
    'ex-row-t3': {
      id: 'ex-row-t3',
      hevyTemplateId: 'hevy-row',
      name: 'Cable Row',
      tier: 'T3',
      slot: 't3_2',
      muscleGroup: 'upper',
    },
    'ex-legcurl-t3': {
      id: 'ex-legcurl-t3',
      hevyTemplateId: 'hevy-legcurl',
      name: 'Leg Curl',
      tier: 'T3',
      slot: 't3_3',
      muscleGroup: 'lower',
    },
  }

  const mockProgression: Record<string, ProgressionState> = {
    'ex-squat-t1': {
      exerciseId: 'ex-squat-t1',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-bench-t1': {
      exerciseId: 'ex-bench-t1',
      currentWeight: 80,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-ohp-t1': {
      exerciseId: 'ex-ohp-t1',
      currentWeight: 50,
      stage: 1,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-deadlift-t1': {
      exerciseId: 'ex-deadlift-t1',
      currentWeight: 120,
      stage: 2,
      baseWeight: 120,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-squat-t2': {
      exerciseId: 'ex-squat-t2',
      currentWeight: 80,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-bench-t2': {
      exerciseId: 'ex-bench-t2',
      currentWeight: 60,
      stage: 1,
      baseWeight: 60,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-ohp-t2': {
      exerciseId: 'ex-ohp-t2',
      currentWeight: 40,
      stage: 2,
      baseWeight: 40,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-deadlift-t2': {
      exerciseId: 'ex-deadlift-t2',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-curl-t3': {
      exerciseId: 'ex-curl-t3',
      currentWeight: 15,
      stage: 0,
      baseWeight: 15,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-row-t3': {
      exerciseId: 'ex-row-t3',
      currentWeight: 50,
      stage: 0,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-legcurl-t3': {
      exerciseId: 'ex-legcurl-t3',
      currentWeight: 40,
      stage: 0,
      baseWeight: 40,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
  }

  describe('buildRoutineSet', () => {
    it('should build a normal set with weight and reps', () => {
      const set = buildRoutineSet(100, 5)

      expect(set).toEqual({
        type: 'normal',
        weight_kg: 100,
        reps: 5,
      })
    })

    it('should handle zero weight correctly', () => {
      const set = buildRoutineSet(0, 10)

      expect(set.weight_kg).toBe(0)
      expect(set.reps).toBe(10)
    })

    it('should handle decimal weights', () => {
      const set = buildRoutineSet(47.5, 8)

      expect(set.weight_kg).toBe(47.5)
    })
  })

  describe('buildRoutineExercise', () => {
    it('should build T1 stage 0 exercise (5x3)', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-squat-t1']!,
        mockProgression['ex-squat-t1']!,
        defaultSettings
      )

      expect(exercise.exercise_template_id).toBe('hevy-squat')
      expect(exercise.rest_seconds).toBe(180) // T1 rest
      expect(exercise.sets).toHaveLength(5) // 5x3
      expect(exercise.sets[0]?.weight_kg).toBe(100)
      expect(exercise.sets[0]?.reps).toBe(3)
    })

    it('should build T1 stage 1 exercise (6x2)', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-ohp-t1']!,
        mockProgression['ex-ohp-t1']!,
        defaultSettings
      )

      expect(exercise.sets).toHaveLength(6) // 6x2
      expect(exercise.sets[0]?.reps).toBe(2)
    })

    it('should build T1 stage 2 exercise (10x1)', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-deadlift-t1']!,
        mockProgression['ex-deadlift-t1']!,
        defaultSettings
      )

      expect(exercise.sets).toHaveLength(10) // 10x1
      expect(exercise.sets[0]?.reps).toBe(1)
    })

    it('should build T2 stage 0 exercise (3x10)', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-squat-t2']!,
        mockProgression['ex-squat-t2']!,
        defaultSettings
      )

      expect(exercise.rest_seconds).toBe(120) // T2 rest
      expect(exercise.sets).toHaveLength(3) // 3x10
      expect(exercise.sets[0]?.reps).toBe(10)
    })

    it('should build T2 stage 1 exercise (3x8)', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-bench-t2']!,
        mockProgression['ex-bench-t2']!,
        defaultSettings
      )

      expect(exercise.sets).toHaveLength(3) // 3x8
      expect(exercise.sets[0]?.reps).toBe(8)
    })

    it('should build T2 stage 2 exercise (3x6)', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-ohp-t2']!,
        mockProgression['ex-ohp-t2']!,
        defaultSettings
      )

      expect(exercise.sets).toHaveLength(3) // 3x6
      expect(exercise.sets[0]?.reps).toBe(6)
    })

    it('should build T3 exercise (3x15)', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-curl-t3']!,
        mockProgression['ex-curl-t3']!,
        defaultSettings
      )

      expect(exercise.rest_seconds).toBe(60) // T3 rest
      expect(exercise.sets).toHaveLength(3) // 3x15
      expect(exercise.sets[0]?.reps).toBe(15)
    })

    it('should use custom rest timers from settings', () => {
      const customSettings: UserSettings = {
        ...defaultSettings,
        restTimers: { t1: 240, t2: 150, t3: 90 },
      }

      const t1Exercise = buildRoutineExercise(
        mockExercises['ex-squat-t1']!,
        mockProgression['ex-squat-t1']!,
        customSettings
      )
      const t2Exercise = buildRoutineExercise(
        mockExercises['ex-squat-t2']!,
        mockProgression['ex-squat-t2']!,
        customSettings
      )
      const t3Exercise = buildRoutineExercise(
        mockExercises['ex-curl-t3']!,
        mockProgression['ex-curl-t3']!,
        customSettings
      )

      expect(t1Exercise.rest_seconds).toBe(240)
      expect(t2Exercise.rest_seconds).toBe(150)
      expect(t3Exercise.rest_seconds).toBe(90)
    })
  })

  describe('buildDayRoutine', () => {
    it('should build A1 day with correct exercises (T1 Squat, T2 Bench, T3s)', () => {
      const routine = buildDayRoutine(
        'A1',
        mockExercises,
        mockProgression,
        defaultSettings
      )

      expect(routine.title).toBe('GZCLP A1')
      expect(routine.exercises).toHaveLength(5) // T1 + T2 + 3 T3s

      // First exercise should be T1 Squat
      expect(routine.exercises[0]?.exercise_template_id).toBe('hevy-squat')
      // Second should be T2 Bench
      expect(routine.exercises[1]?.exercise_template_id).toBe('hevy-bench')
    })

    it('should build B1 day with correct exercises (T1 OHP, T2 Deadlift, T3s)', () => {
      const routine = buildDayRoutine(
        'B1',
        mockExercises,
        mockProgression,
        defaultSettings
      )

      expect(routine.title).toBe('GZCLP B1')
      // First exercise should be T1 OHP
      expect(routine.exercises[0]?.exercise_template_id).toBe('hevy-ohp')
      // Second should be T2 Deadlift
      expect(routine.exercises[1]?.exercise_template_id).toBe('hevy-deadlift')
    })

    it('should build A2 day with correct exercises (T1 Bench, T2 Squat, T3s)', () => {
      const routine = buildDayRoutine(
        'A2',
        mockExercises,
        mockProgression,
        defaultSettings
      )

      expect(routine.title).toBe('GZCLP A2')
      // First exercise should be T1 Bench
      expect(routine.exercises[0]?.exercise_template_id).toBe('hevy-bench')
      // Second should be T2 Squat
      expect(routine.exercises[1]?.exercise_template_id).toBe('hevy-squat')
    })

    it('should build B2 day with correct exercises (T1 Deadlift, T2 OHP, T3s)', () => {
      const routine = buildDayRoutine(
        'B2',
        mockExercises,
        mockProgression,
        defaultSettings
      )

      expect(routine.title).toBe('GZCLP B2')
      // First exercise should be T1 Deadlift
      expect(routine.exercises[0]?.exercise_template_id).toBe('hevy-deadlift')
      // Second should be T2 OHP
      expect(routine.exercises[1]?.exercise_template_id).toBe('hevy-ohp')
    })

    it('should include all T3 exercises on every day', () => {
      const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

      for (const day of days) {
        const routine = buildDayRoutine(day, mockExercises, mockProgression, defaultSettings)
        // T3 exercises should be after T1 and T2
        const t3Exercises = routine.exercises.slice(2)
        expect(t3Exercises).toHaveLength(3)
      }
    })

    it('should handle missing T3 exercises gracefully', () => {
      const exercisesWithoutT3: Record<string, ExerciseConfig> = {
        'ex-squat-t1': mockExercises['ex-squat-t1']!,
        'ex-bench-t2': mockExercises['ex-bench-t2']!,
      }
      const progressionWithoutT3: Record<string, ProgressionState> = {
        'ex-squat-t1': mockProgression['ex-squat-t1']!,
        'ex-bench-t2': mockProgression['ex-bench-t2']!,
      }

      const routine = buildDayRoutine(
        'A1',
        exercisesWithoutT3,
        progressionWithoutT3,
        defaultSettings
      )

      // Should still build with T1 and T2 only
      expect(routine.exercises.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('buildRoutinePayload', () => {
    it('should create a valid create routine payload', () => {
      const payload = buildRoutinePayload(
        'A1',
        mockExercises,
        mockProgression,
        defaultSettings
      )

      expect(payload.routine.title).toBe('GZCLP A1')
      expect(payload.routine.exercises).toBeDefined()
      expect(Array.isArray(payload.routine.exercises)).toBe(true)
    })

    it('should include folder_id when provided', () => {
      const payload = buildRoutinePayload(
        'A1',
        mockExercises,
        mockProgression,
        defaultSettings,
        123
      )

      expect(payload.routine.folder_id).toBe(123)
    })

    it('should handle undefined folder_id', () => {
      const payload = buildRoutinePayload(
        'A1',
        mockExercises,
        mockProgression,
        defaultSettings
      )

      expect(payload.routine.folder_id).toBeNull()
    })
  })

  describe('Weight Conversion', () => {
    it('should store weights in kg even when settings are in lbs', () => {
      const lbsSettings: UserSettings = {
        ...defaultSettings,
        weightUnit: 'lbs',
      }
      // Progression stores weight in the user's unit (lbs in this case)
      // But Hevy API always expects kg
      const lbsProgression: Record<string, ProgressionState> = {
        'ex-squat-t1': {
          ...mockProgression['ex-squat-t1']!,
          currentWeight: 225, // 225 lbs
        },
      }

      const exercise = buildRoutineExercise(
        mockExercises['ex-squat-t1']!,
        lbsProgression['ex-squat-t1']!,
        lbsSettings
      )

      // Should convert to kg (225 lbs = ~102 kg)
      // The exact conversion: 225 / 2.20462 = ~102.06
      // Rounded to nearest 2.5 = 102.5
      expect(exercise.sets[0]?.weight_kg).toBeCloseTo(102, 0)
    })

    it('should pass through kg weights unchanged', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-squat-t1']!,
        mockProgression['ex-squat-t1']!,
        defaultSettings
      )

      expect(exercise.sets[0]?.weight_kg).toBe(100) // Unchanged
    })
  })
})
