/**
 * Unit Tests: Workout Analysis
 *
 * Tests for analyzing Hevy workout data and extracting progression info.
 * [US2] User Story 2 - Sync Workouts and Calculate Progression
 *
 * Updated for role-based system (Feature 004).
 */

import { describe, it, expect } from 'vitest'
import {
  analyzeWorkout,
  extractRepsFromSets,
  matchWorkoutToExercises,
} from '@/lib/workout-analysis'
import type { Workout, WorkoutSet } from '@/types/hevy'
import type { ExerciseConfig } from '@/types/state'

describe('[US2] Workout Analysis', () => {
  // Role-based exercise configs
  const mockExercises: Record<string, ExerciseConfig> = {
    'ex-001': {
      id: 'ex-001',
      hevyTemplateId: 'hevy-squat',
      name: 'Squat (Barbell)',
      role: 'squat',
    },
    'ex-002': {
      id: 'ex-002',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press (Barbell)',
      role: 'bench',
    },
    'ex-003': {
      id: 'ex-003',
      hevyTemplateId: 'hevy-curl',
      name: 'Bicep Curl',
      role: 't3',
    },
  }

  const createMockWorkout = (exercises: {
    templateId: string
    sets: { reps: number | null; weight: number | null; type?: string }[]
  }[]): Workout => ({
    id: 'workout-001',
    title: 'GZCLP Day A1',
    routine_id: 'routine-001',
    description: '',
    start_time: '2026-01-02T10:00:00Z',
    end_time: '2026-01-02T11:00:00Z',
    updated_at: '2026-01-02T11:00:00Z',
    created_at: '2026-01-02T10:00:00Z',
    exercises: exercises.map((ex, index) => ({
      index,
      title: 'Exercise',
      notes: '',
      exercise_template_id: ex.templateId,
      supersets_id: null,
      sets: ex.sets.map((set, setIndex) => ({
        index: setIndex,
        type: (set.type ?? 'normal') as 'normal' | 'warmup' | 'failure' | 'dropset',
        weight_kg: set.weight,
        reps: set.reps,
        distance_meters: null,
        duration_seconds: null,
        rpe: null,
        custom_metric: null,
      })),
    })),
  })

  describe('Matching Workouts to Exercises', () => {
    it('should match workout exercises to configured exercises', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-squat', sets: [{ reps: 5, weight: 100 }] },
        { templateId: 'hevy-bench', sets: [{ reps: 10, weight: 60 }] },
      ])

      const matches = matchWorkoutToExercises(workout, mockExercises)

      expect(matches).toHaveLength(2)
      expect(matches[0]?.exerciseId).toBe('ex-001')
      expect(matches[1]?.exerciseId).toBe('ex-002')
    })

    it('should ignore exercises not in configuration', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-unknown', sets: [{ reps: 5, weight: 100 }] },
        { templateId: 'hevy-squat', sets: [{ reps: 5, weight: 100 }] },
      ])

      const matches = matchWorkoutToExercises(workout, mockExercises)

      expect(matches).toHaveLength(1)
      expect(matches[0]?.exerciseId).toBe('ex-001')
    })

    it('should handle workout with no matching exercises', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-unknown1', sets: [{ reps: 5, weight: 100 }] },
        { templateId: 'hevy-unknown2', sets: [{ reps: 5, weight: 100 }] },
      ])

      const matches = matchWorkoutToExercises(workout, mockExercises)

      expect(matches).toHaveLength(0)
    })
  })

  describe('Extracting Reps from Sets', () => {
    it('should extract reps from normal sets only', () => {
      const sets: WorkoutSet[] = [
        { index: 0, type: 'warmup', reps: 10, weight_kg: 50, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
        { index: 1, type: 'normal', reps: 5, weight_kg: 100, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
        { index: 2, type: 'normal', reps: 5, weight_kg: 100, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
        { index: 3, type: 'normal', reps: 5, weight_kg: 100, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
      ]

      const reps = extractRepsFromSets(sets)

      expect(reps).toEqual([5, 5, 5]) // Warmup excluded
    })

    it('should handle null reps as 0 (failed set)', () => {
      const sets: WorkoutSet[] = [
        { index: 0, type: 'normal', reps: 5, weight_kg: 100, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
        { index: 1, type: 'normal', reps: null, weight_kg: 100, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
        { index: 2, type: 'normal', reps: 3, weight_kg: 100, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
      ]

      const reps = extractRepsFromSets(sets)

      expect(reps).toEqual([5, 0, 3])
    })

    it('should include dropsets in rep count', () => {
      const sets: WorkoutSet[] = [
        { index: 0, type: 'normal', reps: 10, weight_kg: 100, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
        { index: 1, type: 'dropset', reps: 8, weight_kg: 80, distance_meters: null, duration_seconds: null, rpe: null, custom_metric: null },
      ]

      const reps = extractRepsFromSets(sets)

      expect(reps).toEqual([10, 8])
    })
  })

  describe('Extra Sets Beyond Prescribed', () => {
    it('should only use prescribed number of sets for T1', () => {
      const workout = createMockWorkout([
        {
          templateId: 'hevy-squat',
          sets: [
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 5, weight: 100 },
            { reps: 8, weight: 80 }, // Extra set
            { reps: 5, weight: 80 }, // Extra set
          ],
        },
      ])

      // Pass day to properly determine tier
      const result = analyzeWorkout(workout, mockExercises, {}, 'A1')

      // Should include all reps recorded
      expect(result[0]?.reps).toEqual([3, 3, 3, 3, 5, 8, 5])
      // Tier should be T1 for squat on A1
      expect(result[0]?.tier).toBe('T1')
    })
  })

  describe('Skipped Workout Days', () => {
    it('should process workouts in chronological order', () => {
      const workout1 = createMockWorkout([
        { templateId: 'hevy-squat', sets: [{ reps: 5, weight: 100 }] },
      ])
      workout1.start_time = '2026-01-01T10:00:00Z'

      const workout2 = createMockWorkout([
        { templateId: 'hevy-squat', sets: [{ reps: 5, weight: 105 }] },
      ])
      workout2.start_time = '2026-01-03T10:00:00Z' // Gap - skipped day

      // Both should be analyzed independently, pass day for tier determination
      const result1 = analyzeWorkout(workout1, mockExercises, {}, 'A1')
      const result2 = analyzeWorkout(workout2, mockExercises, {}, 'A1')

      expect(result1[0]?.weight).toBe(100)
      expect(result2[0]?.weight).toBe(105)
    })
  })

  describe('Partial Workout', () => {
    it('should handle workout with only some configured exercises', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-squat', sets: [{ reps: 5, weight: 100 }] },
        // Missing bench and curl
      ])

      // Pass day for tier determination
      const result = analyzeWorkout(workout, mockExercises, {}, 'A1')

      expect(result).toHaveLength(1)
      expect(result[0]?.exerciseId).toBe('ex-001')
    })
  })

  describe('Discrepancy Detection', () => {
    it('should detect weight mismatch between workout and stored progression', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-squat', sets: [{ reps: 5, weight: 110 }] },
      ])

      // Use role-tier key for main lifts (squat on A1 = T1)
      const storedProgression = {
        'squat-T1': {
          exerciseId: 'squat',
          currentWeight: 100, // Stored says 100, workout used 110
          stage: 0,
          baseWeight: 100,
          amrapRecord: 0,
        },
      }

      // Pass day for tier determination
      const result = analyzeWorkout(workout, mockExercises, storedProgression, 'A1')

      expect(result[0]?.discrepancy).toBeDefined()
      expect(result[0]?.discrepancy?.storedWeight).toBe(100)
      expect(result[0]?.discrepancy?.actualWeight).toBe(110)
    })

    it('should not flag discrepancy when weights match', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-squat', sets: [{ reps: 5, weight: 100 }] },
      ])

      // Use role-tier key for main lifts (squat on A1 = T1)
      const storedProgression = {
        'squat-T1': {
          exerciseId: 'squat',
          currentWeight: 100, // Matches
          stage: 0,
          baseWeight: 100,
          amrapRecord: 0,
        },
      }

      // Pass day for tier determination
      const result = analyzeWorkout(workout, mockExercises, storedProgression, 'A1')

      expect(result[0]?.discrepancy).toBeUndefined()
    })
  })

  describe('Role-based tier determination', () => {
    it('should determine T1 tier for squat on A1 day', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-squat', sets: [{ reps: 5, weight: 100 }] },
      ])

      const result = analyzeWorkout(workout, mockExercises, {}, 'A1')

      expect(result[0]?.tier).toBe('T1')
    })

    it('should determine T2 tier for bench on A1 day', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-bench', sets: [{ reps: 10, weight: 60 }] },
      ])

      const result = analyzeWorkout(workout, mockExercises, {}, 'A1')

      expect(result[0]?.tier).toBe('T2')
    })

    it('should determine T3 tier for t3 role exercises', () => {
      const workout = createMockWorkout([
        { templateId: 'hevy-curl', sets: [{ reps: 15, weight: 10 }] },
      ])

      const result = analyzeWorkout(workout, mockExercises, {}, 'A1')

      expect(result[0]?.tier).toBe('T3')
    })
  })
})
