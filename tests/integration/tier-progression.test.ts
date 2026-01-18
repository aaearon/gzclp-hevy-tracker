/**
 * Integration Tests: Tier Progression
 *
 * End-to-end tests verifying that T1 and T2 progressions are completely independent.
 * [US1] User Story 1 - Independent Progression Tracking (MVP)
 */

import { describe, it, expect } from 'vitest'
import { analyzeWorkout } from '@/lib/workout-analysis'
import { createPendingChangesFromAnalysis } from '@/lib/progression'
import { getProgressionKey } from '@/lib/role-utils'
import type { Workout } from '@/types/hevy'
import type { ExerciseConfig, ProgressionState, GZCLPDay } from '@/types/state'

describe('[US1] End-to-End Tier Progression Independence', () => {
  // Exercise configs for all main lifts
  const exercises: Record<string, ExerciseConfig> = {
    'squat-uuid': {
      id: 'squat-uuid',
      hevyTemplateId: 'hevy-squat',
      name: 'Squat (Barbell)',
      role: 'squat',
    },
    'bench-uuid': {
      id: 'bench-uuid',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press (Barbell)',
      role: 'bench',
    },
    'ohp-uuid': {
      id: 'ohp-uuid',
      hevyTemplateId: 'hevy-ohp',
      name: 'Overhead Press (Barbell)',
      role: 'ohp',
    },
    'deadlift-uuid': {
      id: 'deadlift-uuid',
      hevyTemplateId: 'hevy-deadlift',
      name: 'Deadlift (Barbell)',
      role: 'deadlift',
    },
  }

  // Initial progression state with 8 entries (T1+T2 for each main lift)
  const createInitialProgression = (): Record<string, ProgressionState> => ({
    'squat-T1': {
      exerciseId: 'squat',
      currentWeight: 100,
      stage: 0,
      baseWeight: 60,
      amrapRecord: 0,
    },
    'squat-T2': {
      exerciseId: 'squat',
      currentWeight: 70,
      stage: 0,
      baseWeight: 42,
      amrapRecord: 0,
    },
    'bench-T1': {
      exerciseId: 'bench',
      currentWeight: 60,
      stage: 0,
      baseWeight: 40,
      amrapRecord: 0,
    },
    'bench-T2': {
      exerciseId: 'bench',
      currentWeight: 42,
      stage: 0,
      baseWeight: 28,
      amrapRecord: 0,
    },
    'ohp-T1': {
      exerciseId: 'ohp',
      currentWeight: 40,
      stage: 0,
      baseWeight: 20,
      amrapRecord: 0,
    },
    'ohp-T2': {
      exerciseId: 'ohp',
      currentWeight: 28,
      stage: 0,
      baseWeight: 14,
      amrapRecord: 0,
    },
    'deadlift-T1': {
      exerciseId: 'deadlift',
      currentWeight: 120,
      stage: 0,
      baseWeight: 80,
      amrapRecord: 0,
    },
    'deadlift-T2': {
      exerciseId: 'deadlift',
      currentWeight: 84,
      stage: 0,
      baseWeight: 56,
      amrapRecord: 0,
    },
  })

  // Helper to create workout
  const createWorkout = (
    exercises: { templateId: string; sets: { reps: number; weight: number }[] }[],
    workoutId = 'workout-001',
    date = '2026-01-02T10:00:00Z'
  ): Workout => ({
    id: workoutId,
    title: 'GZCLP Workout',
    routine_id: 'routine-001',
    description: '',
    start_time: date,
    end_time: date,
    updated_at: date,
    created_at: date,
    exercises: exercises.map((ex, index) => ({
      index,
      title: 'Exercise',
      notes: '',
      exercise_template_id: ex.templateId,
      supersets_id: null,
      sets: ex.sets.map((set, setIndex) => ({
        index: setIndex,
        type: 'normal' as const,
        weight_kg: set.weight,
        reps: set.reps,
        distance_meters: null,
        duration_seconds: null,
        rpe: null,
        custom_metric: null,
      })),
    })),
  })

  describe('Complete workout simulation', () => {
    it('successful T1 workout generates progress for T1 only', () => {
      const progression = createInitialProgression()

      // Day A1: T1 Squat success
      const workout = createWorkout([
        {
          templateId: 'hevy-squat',
          sets: [
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 5, weight: 100 }, // AMRAP with extra reps
          ],
        },
      ])

      const results = analyzeWorkout(workout, exercises, progression, 'A1')
      const changes = createPendingChangesFromAnalysis(results, exercises, progression, 'kg', 'A1')

      // Should generate one change for squat-T1
      expect(changes).toHaveLength(1)
      expect(changes[0]?.tier).toBe('T1')
      expect(changes[0]?.type).toBe('progress')
      expect(changes[0]?.newWeight).toBe(105) // +5kg for lower body

      // Verify squat-T2 is completely unchanged
      const t2State = progression['squat-T2']
      expect(t2State?.currentWeight).toBe(70)
      expect(t2State?.stage).toBe(0)
    })

    it('failed T1 workout generates stage change for T1 only', () => {
      const progression = createInitialProgression()

      // Day A1: T1 Squat failure
      const workout = createWorkout([
        {
          templateId: 'hevy-squat',
          sets: [
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 2, weight: 100 }, // Failed
            { reps: 2, weight: 100 }, // Failed
            { reps: 2, weight: 100 }, // Failed
          ],
        },
      ])

      const results = analyzeWorkout(workout, exercises, progression, 'A1')
      const changes = createPendingChangesFromAnalysis(results, exercises, progression, 'kg', 'A1')

      // Should generate stage change for squat-T1
      expect(changes).toHaveLength(1)
      expect(changes[0]?.tier).toBe('T1')
      expect(changes[0]?.type).toBe('stage_change')
      expect(changes[0]?.newStage).toBe(1)
      expect(changes[0]?.currentWeight).toBe(100)
      expect(changes[0]?.newWeight).toBe(100) // Weight stays same on stage change

      // Verify squat-T2 is completely unchanged
      const t2State = progression['squat-T2']
      expect(t2State?.currentWeight).toBe(70)
      expect(t2State?.stage).toBe(0)
    })

    it('T2 workout on different day uses correct T2 state', () => {
      const progression = createInitialProgression()

      // Day A2: T2 Squat success
      const workout = createWorkout([
        {
          templateId: 'hevy-squat',
          sets: [
            { reps: 10, weight: 70 },
            { reps: 10, weight: 70 },
            { reps: 10, weight: 70 },
          ],
        },
      ])

      const results = analyzeWorkout(workout, exercises, progression, 'A2')
      const changes = createPendingChangesFromAnalysis(results, exercises, progression, 'kg', 'A2')

      // Should generate progress for squat-T2
      expect(changes).toHaveLength(1)
      expect(changes[0]?.tier).toBe('T2')
      expect(changes[0]?.type).toBe('progress')
      expect(changes[0]?.currentWeight).toBe(70)
      expect(changes[0]?.newWeight).toBe(75) // +5kg for lower body

      // Verify squat-T1 is completely unchanged
      const t1State = progression['squat-T1']
      expect(t1State?.currentWeight).toBe(100)
      expect(t1State?.stage).toBe(0)
    })
  })

  describe('getProgressionKey integration', () => {
    it('generates correct keys for all main lifts and tiers', () => {
      const _days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

      // Expected key patterns
      const expectedKeys = {
        squat: { T1: 'squat-T1', T2: 'squat-T2' },
        bench: { T1: 'bench-T1', T2: 'bench-T2' },
        ohp: { T1: 'ohp-T1', T2: 'ohp-T2' },
        deadlift: { T1: 'deadlift-T1', T2: 'deadlift-T2' },
      }

      for (const role of ['squat', 'bench', 'ohp', 'deadlift'] as const) {
        expect(getProgressionKey('any-id', role, 'T1')).toBe(expectedKeys[role].T1)
        expect(getProgressionKey('any-id', role, 'T2')).toBe(expectedKeys[role].T2)
      }
    })
  })

  describe('Full workout day simulation', () => {
    it('Day A1: T1 Squat and T2 Bench are tracked independently', () => {
      const progression = createInitialProgression()

      const workout = createWorkout([
        // T1 Squat - success
        {
          templateId: 'hevy-squat',
          sets: [
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 3, weight: 100 },
            { reps: 5, weight: 100 },
          ],
        },
        // T2 Bench - success
        {
          templateId: 'hevy-bench',
          sets: [
            { reps: 10, weight: 42 },
            { reps: 10, weight: 42 },
            { reps: 10, weight: 42 },
          ],
        },
      ])

      const results = analyzeWorkout(workout, exercises, progression, 'A1')
      const changes = createPendingChangesFromAnalysis(results, exercises, progression, 'kg', 'A1')

      // Should have two separate changes
      expect(changes).toHaveLength(2)

      // Find squat change
      const squatChange = changes.find((c) => c.exerciseName.includes('Squat'))
      expect(squatChange?.tier).toBe('T1')
      expect(squatChange?.currentWeight).toBe(100)
      expect(squatChange?.newWeight).toBe(105) // +5kg for lower body

      // Find bench change
      const benchChange = changes.find((c) => c.exerciseName.includes('Bench'))
      expect(benchChange?.tier).toBe('T2')
      expect(benchChange?.currentWeight).toBe(42)
      expect(benchChange?.newWeight).toBe(44.5) // Upper body: +2.5kg
    })
  })
})
