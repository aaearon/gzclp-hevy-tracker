/**
 * Unit Tests: Routine Builder
 *
 * Tests for building Hevy routine payloads from GZCLP program state.
 * [US4] User Story 4 - Update Hevy Routines
 *
 * Updated for role-based system (Feature 004).
 */

import { describe, it, expect } from 'vitest'
import {
  buildRoutineExercise,
  buildRoutineSet,
  buildRoutinePayload,
  buildDayRoutine,
  buildWarmupSets,
} from '@/lib/routine-builder'
import type { ExerciseConfig, ProgressionState, UserSettings, GZCLPDay } from '@/types/state'

describe('[US4] Routine Builder', () => {
  const defaultSettings: UserSettings = {
    weightUnit: 'kg',
    increments: { upper: 2.5, lower: 5 },
    restTimers: { t1: 180, t2: 120, t3: 60 },
  }

  // T3 schedule - all T3s on all days for backward compatibility with old tests
  const mockT3Schedule: Record<GZCLPDay, string[]> = {
    A1: ['ex-curl-t3', 'ex-row-t3', 'ex-legcurl-t3'],
    B1: ['ex-curl-t3', 'ex-row-t3', 'ex-legcurl-t3'],
    A2: ['ex-curl-t3', 'ex-row-t3', 'ex-legcurl-t3'],
    B2: ['ex-curl-t3', 'ex-row-t3', 'ex-legcurl-t3'],
  }

  // Role-based exercise configs
  const mockExercises: Record<string, ExerciseConfig> = {
    'ex-squat': {
      id: 'ex-squat',
      hevyTemplateId: 'hevy-squat',
      name: 'Squat (Barbell)',
      role: 'squat',
    },
    'ex-bench': {
      id: 'ex-bench',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press (Barbell)',
      role: 'bench',
    },
    'ex-ohp': {
      id: 'ex-ohp',
      hevyTemplateId: 'hevy-ohp',
      name: 'Overhead Press (Barbell)',
      role: 'ohp',
    },
    'ex-deadlift': {
      id: 'ex-deadlift',
      hevyTemplateId: 'hevy-deadlift',
      name: 'Deadlift (Barbell)',
      role: 'deadlift',
    },
    'ex-curl-t3': {
      id: 'ex-curl-t3',
      hevyTemplateId: 'hevy-curl',
      name: 'Bicep Curl',
      role: 't3',
    },
    'ex-row-t3': {
      id: 'ex-row-t3',
      hevyTemplateId: 'hevy-row',
      name: 'Cable Row',
      role: 't3',
    },
    'ex-legcurl-t3': {
      id: 'ex-legcurl-t3',
      hevyTemplateId: 'hevy-legcurl',
      name: 'Leg Curl',
      role: 't3',
    },
  }

  // Progression keyed by role-tier for main lifts (e.g., "squat-T1", "bench-T2")
  // and by exerciseId for T3s
  const mockProgression: Record<string, ProgressionState> = {
    // Squat progressions (T1 on A1, T2 on A2)
    'squat-T1': {
      exerciseId: 'ex-squat',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'squat-T2': {
      exerciseId: 'ex-squat',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    // Bench progressions (T1 on A2, T2 on A1)
    'bench-T1': {
      exerciseId: 'ex-bench',
      currentWeight: 80,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'bench-T2': {
      exerciseId: 'ex-bench',
      currentWeight: 80,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    // OHP progressions (T1 on B1, T2 on B2)
    'ohp-T1': {
      exerciseId: 'ex-ohp',
      currentWeight: 50,
      stage: 1,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ohp-T2': {
      exerciseId: 'ex-ohp',
      currentWeight: 50,
      stage: 1,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    // Deadlift progressions (T1 on B2, T2 on B1)
    'deadlift-T1': {
      exerciseId: 'ex-deadlift',
      currentWeight: 120,
      stage: 2,
      baseWeight: 120,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'deadlift-T2': {
      exerciseId: 'ex-deadlift',
      currentWeight: 120,
      stage: 2,
      baseWeight: 120,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    // T3 exercises use exerciseId as key
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

  describe('buildWarmupSets', () => {
    it('should build heavy warmup sets (50%, 70%, 85%) for 100kg', () => {
      const warmups = buildWarmupSets(100) // >40kg = heavy protocol

      // Heavy protocol: 50%, 70%, 85%
      expect(warmups).toHaveLength(3)
      expect(warmups[0]).toEqual({ type: 'warmup', weight_kg: 50, reps: 5 }) // 50%
      expect(warmups[1]).toEqual({ type: 'warmup', weight_kg: 70, reps: 3 }) // 70%
      expect(warmups[2]).toEqual({ type: 'warmup', weight_kg: 85, reps: 2 }) // 85%
    })

    it('should build light warmup sets (bar, 50%, 75%) for 30kg', () => {
      const warmups = buildWarmupSets(30) // ≤40kg = light protocol

      // Light protocol: bar, 50%, 75% (with deduplication)
      // 50% = 15 -> capped at 20 (same as bar), should be skipped
      // 75% = 22.5
      expect(warmups.some((w) => w.weight_kg === 20)).toBe(true) // Bar
      expect(warmups.filter((w) => w.weight_kg === 20)).toHaveLength(1) // No duplicates
    })

    it('should round warmup weights to nearest 2.5kg', () => {
      const warmups = buildWarmupSets(73) // >40kg = heavy protocol

      // Heavy protocol: 50% = 36.5 -> 37.5, 70% = 51.1 -> 50, 85% = 62.05 -> 62.5
      expect(warmups[0]?.weight_kg).toBe(37.5) // 50% rounded
      expect(warmups[1]?.weight_kg).toBe(50) // 70% rounded (51.1 -> 50)
      expect(warmups[2]?.weight_kg).toBe(62.5) // 85% rounded
    })

    it('should skip duplicate warmup weights at low working weight', () => {
      const warmups = buildWarmupSets(30) // Light protocol

      // 50% = 15 -> capped at 20 (same as bar), should be skipped
      // 75% = 22.5
      expect(warmups.some((w) => w.weight_kg === 20)).toBe(true) // Bar only once
      expect(warmups.filter((w) => w.weight_kg === 20)).toHaveLength(1) // No duplicates
    })

    it('should start with bar weight for light lifts (≤40kg)', () => {
      const warmups = buildWarmupSets(35) // Light protocol

      expect(warmups[0]).toEqual({ type: 'warmup', weight_kg: 20, reps: 10 })
    })

    it('should start with 50% for heavy lifts (>40kg)', () => {
      const warmups = buildWarmupSets(120) // Heavy protocol

      expect(warmups[0]).toEqual({ type: 'warmup', weight_kg: 60, reps: 5 }) // 50%
    })

    it('should cap warmup weights at minimum bar weight', () => {
      const warmups = buildWarmupSets(20) // Bar weight only, light protocol

      // All percentages would be below bar, should have at most 2 distinct sets
      expect(warmups.every((w) => w.weight_kg >= 20)).toBe(true)
    })

    it('should use warmup type for all sets', () => {
      const warmups = buildWarmupSets(100)

      expect(warmups.every((w) => w.type === 'warmup')).toBe(true)
    })
  })

  describe('buildRoutineExercise', () => {
    it('should build T1 stage 0 exercise (5x3) on A1 day with warmup sets', () => {
      // Squat is T1 on A1 at 100kg (heavy protocol: 50%, 70%, 85%)
      const exercise = buildRoutineExercise(
        mockExercises['ex-squat']!,
        mockProgression['squat-T1']!,
        defaultSettings,
        'A1'
      )

      expect(exercise.exercise_template_id).toBe('hevy-squat')
      expect(exercise.rest_seconds).toBe(180) // T1 rest
      // Heavy protocol: 3 warmup sets + 5 working sets = 8 total
      expect(exercise.sets).toHaveLength(8)
      // First 3 should be warmup sets
      expect(exercise.sets.slice(0, 3).every((s) => s.type === 'warmup')).toBe(true)
      // Last 5 should be working sets at 100kg
      const workingSets = exercise.sets.slice(3)
      expect(workingSets).toHaveLength(5)
      expect(workingSets.every((s) => s.weight_kg === 100 && s.reps === 3)).toBe(true)
    })

    it('should build T1 stage 1 exercise (6x2) on B1 day with warmup sets', () => {
      // OHP is T1 on B1, and it's at stage 1
      const exercise = buildRoutineExercise(
        mockExercises['ex-ohp']!,
        mockProgression['ohp-T1']!,
        defaultSettings,
        'B1'
      )

      // OHP at 50kg: warmups at 20, 25, 35, 42.5 = 4 warmups + 6 working = 10 total
      // (50% of 50 = 25, 70% = 35, 85% = 42.5)
      const warmupSets = exercise.sets.filter((s) => s.type === 'warmup')
      const workingSets = exercise.sets.filter((s) => s.type === 'normal')
      expect(warmupSets.length).toBeGreaterThan(0) // Has warmups
      expect(workingSets).toHaveLength(6) // 6x2
      expect(workingSets[0]?.reps).toBe(2)
    })

    it('should build T1 stage 2 exercise (10x1) on B2 day with warmup sets', () => {
      // Deadlift is T1 on B2, and it's at stage 2
      const exercise = buildRoutineExercise(
        mockExercises['ex-deadlift']!,
        mockProgression['deadlift-T1']!,
        defaultSettings,
        'B2'
      )

      // Deadlift at 120kg: 4 warmups + 10 working = 14 total
      const warmupSets = exercise.sets.filter((s) => s.type === 'warmup')
      const workingSets = exercise.sets.filter((s) => s.type === 'normal')
      expect(warmupSets.length).toBeGreaterThan(0) // Has warmups
      expect(workingSets).toHaveLength(10) // 10x1
      expect(workingSets[0]?.reps).toBe(1)
    })

    it('should build T2 stage 0 exercise (3x10) on A1 day', () => {
      // Bench is T2 on A1
      const exercise = buildRoutineExercise(
        mockExercises['ex-bench']!,
        mockProgression['bench-T2']!,
        defaultSettings,
        'A1'
      )

      expect(exercise.rest_seconds).toBe(120) // T2 rest
      expect(exercise.sets).toHaveLength(3) // 3x10
      expect(exercise.sets[0]?.reps).toBe(10)
    })

    it('should build T2 stage 1 exercise (3x8) on B2 day', () => {
      // OHP is T2 on B2, and it's at stage 1
      const exercise = buildRoutineExercise(
        mockExercises['ex-ohp']!,
        mockProgression['ohp-T2']!,
        defaultSettings,
        'B2'
      )

      expect(exercise.sets).toHaveLength(3) // 3x8
      expect(exercise.sets[0]?.reps).toBe(8)
    })

    it('should build T2 stage 2 exercise (3x6) on B1 day', () => {
      // Deadlift is T2 on B1, and it's at stage 2
      const exercise = buildRoutineExercise(
        mockExercises['ex-deadlift']!,
        mockProgression['deadlift-T2']!,
        defaultSettings,
        'B1'
      )

      expect(exercise.sets).toHaveLength(3) // 3x6
      expect(exercise.sets[0]?.reps).toBe(6)
    })

    it('should build T3 exercise (3x15)', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-curl-t3']!,
        mockProgression['ex-curl-t3']!,
        defaultSettings,
        'A1'
      )

      expect(exercise.rest_seconds).toBe(60) // T3 rest
      expect(exercise.sets).toHaveLength(3) // 3x15
      expect(exercise.sets[0]?.reps).toBe(15)
    })

    it('should NOT add warmup sets to T2 exercises', () => {
      // Bench is T2 on A1
      const exercise = buildRoutineExercise(
        mockExercises['ex-bench']!,
        mockProgression['bench-T2']!,
        defaultSettings,
        'A1'
      )

      // Should only have 3 working sets, no warmups
      expect(exercise.sets).toHaveLength(3)
      expect(exercise.sets.every((s) => s.type === 'normal')).toBe(true)
    })

    it('should NOT add warmup sets to T3 exercises', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-curl-t3']!,
        mockProgression['ex-curl-t3']!,
        defaultSettings,
        'A1'
      )

      // Should only have 3 working sets, no warmups
      expect(exercise.sets).toHaveLength(3)
      expect(exercise.sets.every((s) => s.type === 'normal')).toBe(true)
    })

    it('should use custom rest timers from settings', () => {
      const customSettings: UserSettings = {
        ...defaultSettings,
        restTimers: { t1: 240, t2: 150, t3: 90 },
      }

      const t1Exercise = buildRoutineExercise(
        mockExercises['ex-squat']!,
        mockProgression['squat-T1']!,
        customSettings,
        'A1'
      )
      const t2Exercise = buildRoutineExercise(
        mockExercises['ex-bench']!,
        mockProgression['bench-T2']!,
        customSettings,
        'A1'
      )
      const t3Exercise = buildRoutineExercise(
        mockExercises['ex-curl-t3']!,
        mockProgression['ex-curl-t3']!,
        customSettings,
        'A1'
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
        defaultSettings,
        mockT3Schedule
      )

      expect(routine.title).toBe('GZCLP Day A1')
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
        defaultSettings,
        mockT3Schedule
      )

      expect(routine.title).toBe('GZCLP Day B1')
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
        defaultSettings,
        mockT3Schedule
      )

      expect(routine.title).toBe('GZCLP Day A2')
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
        defaultSettings,
        mockT3Schedule
      )

      expect(routine.title).toBe('GZCLP Day B2')
      // First exercise should be T1 Deadlift
      expect(routine.exercises[0]?.exercise_template_id).toBe('hevy-deadlift')
      // Second should be T2 OHP
      expect(routine.exercises[1]?.exercise_template_id).toBe('hevy-ohp')
    })

    it('should include all T3 exercises on every day', () => {
      const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

      for (const day of days) {
        const routine = buildDayRoutine(day, mockExercises, mockProgression, defaultSettings, mockT3Schedule)
        // T3 exercises should be after T1 and T2
        const t3Exercises = routine.exercises.slice(2)
        expect(t3Exercises).toHaveLength(3)
      }
    })

    it('should handle missing T3 exercises gracefully', () => {
      const exercisesWithoutT3: Record<string, ExerciseConfig> = {
        'ex-squat': mockExercises['ex-squat']!,
        'ex-bench': mockExercises['ex-bench']!,
      }
      // Progression keyed by role-tier for main lifts
      const progressionWithoutT3: Record<string, ProgressionState> = {
        'squat-T1': mockProgression['squat-T1']!,
        'bench-T2': mockProgression['bench-T2']!,
      }

      const routine = buildDayRoutine(
        'A1',
        exercisesWithoutT3,
        progressionWithoutT3,
        defaultSettings,
        { A1: [], B1: [], A2: [], B2: [] } // Empty T3 schedule
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
        defaultSettings,
        mockT3Schedule
      )

      expect(payload.routine.title).toBe('GZCLP Day A1')
      expect(payload.routine.exercises).toBeDefined()
      expect(Array.isArray(payload.routine.exercises)).toBe(true)
    })

    it('should include folder_id when provided', () => {
      const payload = buildRoutinePayload(
        'A1',
        mockExercises,
        mockProgression,
        defaultSettings,
        mockT3Schedule,
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

  describe('Weight Handling', () => {
    it('should use kg weights directly (internal storage is always kg)', () => {
      const lbsSettings: UserSettings = {
        ...defaultSettings,
        weightUnit: 'lbs',
      }
      // Progression weights are ALWAYS stored in kg internally
      // (even when user prefers lbs for display)
      const kgProgression: ProgressionState = {
        ...mockProgression['squat-T1']!,
        currentWeight: 102, // 102 kg (equivalent to ~225 lbs)
      }

      const exercise = buildRoutineExercise(
        mockExercises['ex-squat']!,
        kgProgression,
        lbsSettings,
        'A1'
      )

      // Should use the kg weight directly (no conversion needed)
      // Working sets come after warmup sets (T1 has warmups prepended)
      const workingSets = exercise.sets.filter((s) => s.type === 'normal')
      expect(workingSets[0]?.weight_kg).toBe(102)
    })

    it('should pass through kg weights unchanged', () => {
      const exercise = buildRoutineExercise(
        mockExercises['ex-squat']!,
        mockProgression['squat-T1']!,
        defaultSettings,
        'A1'
      )

      // Working sets come after warmup sets (T1 has warmups prepended)
      const workingSets = exercise.sets.filter((s) => s.type === 'normal')
      expect(workingSets[0]?.weight_kg).toBe(100) // Unchanged
    })
  })
})
