/**
 * Unit Tests: T1/T2 Progression Independence
 *
 * Tests verifying that T1 and T2 progression states are completely independent.
 * Failing T1 Squat should NOT affect T2 Squat progression.
 * [US1] User Story 1 - Independent Progression Tracking (MVP)
 */

import { describe, it, expect } from 'vitest'
import { analyzeWorkout } from '@/lib/workout-analysis'
import { createPendingChangesFromAnalysis } from '@/lib/progression'
import type { Workout } from '@/types/hevy'
import type { ExerciseConfig, ProgressionState } from '@/types/state'

describe('[US1] T1/T2 Progression Independence', () => {
  // Exercise configs with roles
  const mockExercises: Record<string, ExerciseConfig> = {
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
  }

  // Helper to create workout with sets
  const createWorkout = (
    templateId: string,
    sets: { reps: number; weight: number }[],
    workoutId = 'workout-001'
  ): Workout => ({
    id: workoutId,
    title: 'GZCLP Workout',
    routine_id: 'routine-001',
    description: '',
    start_time: '2026-01-02T10:00:00Z',
    end_time: '2026-01-02T11:00:00Z',
    updated_at: '2026-01-02T11:00:00Z',
    created_at: '2026-01-02T10:00:00Z',
    exercises: [
      {
        index: 0,
        title: 'Exercise',
        notes: '',
        exercise_template_id: templateId,
        supersets_id: null,
        sets: sets.map((set, index) => ({
          index,
          type: 'normal' as const,
          weight_kg: set.weight,
          reps: set.reps,
          distance_meters: null,
          duration_seconds: null,
          rpe: null,
          custom_metric: null,
        })),
      },
    ],
  })

  describe('Progression lookup uses role+tier keys', () => {
    it('looks up T1 progression using squat-T1 key on A1 day', () => {
      const progression: Record<string, ProgressionState> = {
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
      }

      // Create workout with squat at 100kg (matching T1)
      const workout = createWorkout('hevy-squat', [
        { reps: 3, weight: 100 },
        { reps: 3, weight: 100 },
        { reps: 3, weight: 100 },
        { reps: 3, weight: 100 },
        { reps: 5, weight: 100 },
      ])

      const results = analyzeWorkout(workout, mockExercises, progression, 'A1')

      expect(results).toHaveLength(1)
      expect(results[0]?.tier).toBe('T1')
      // No discrepancy because we're matching against squat-T1 (100kg), not squat-T2 (70kg)
      expect(results[0]?.discrepancy).toBeUndefined()
    })

    it('looks up T2 progression using squat-T2 key on A2 day', () => {
      const progression: Record<string, ProgressionState> = {
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
      }

      // Create workout with squat at 70kg (matching T2)
      const workout = createWorkout('hevy-squat', [
        { reps: 10, weight: 70 },
        { reps: 10, weight: 70 },
        { reps: 10, weight: 70 },
      ])

      const results = analyzeWorkout(workout, mockExercises, progression, 'A2')

      expect(results).toHaveLength(1)
      expect(results[0]?.tier).toBe('T2')
      // No discrepancy because we're matching against squat-T2 (70kg), not squat-T1 (100kg)
      expect(results[0]?.discrepancy).toBeUndefined()
    })
  })

  describe('Pending change generation uses correct keys', () => {
    it('generates pending change for T1 using squat-T1 key', () => {
      const progression: Record<string, ProgressionState> = {
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
      }

      // Successful T1 workout
      const workout = createWorkout('hevy-squat', [
        { reps: 3, weight: 100 },
        { reps: 3, weight: 100 },
        { reps: 3, weight: 100 },
        { reps: 3, weight: 100 },
        { reps: 5, weight: 100 },
      ])

      const results = analyzeWorkout(workout, mockExercises, progression, 'A1')
      const pendingChanges = createPendingChangesFromAnalysis(
        results,
        mockExercises,
        progression,
        'kg',
        'A1'
      )

      expect(pendingChanges).toHaveLength(1)
      expect(pendingChanges[0]?.tier).toBe('T1')
      expect(pendingChanges[0]?.currentWeight).toBe(100)
      expect(pendingChanges[0]?.newWeight).toBe(105) // +5kg for lower body
    })

    it('generates pending change for T2 using squat-T2 key', () => {
      const progression: Record<string, ProgressionState> = {
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
      }

      // Successful T2 workout (3x10)
      const workout = createWorkout('hevy-squat', [
        { reps: 10, weight: 70 },
        { reps: 10, weight: 70 },
        { reps: 10, weight: 70 },
      ])

      const results = analyzeWorkout(workout, mockExercises, progression, 'A2')
      const pendingChanges = createPendingChangesFromAnalysis(
        results,
        mockExercises,
        progression,
        'kg',
        'A2'
      )

      expect(pendingChanges).toHaveLength(1)
      expect(pendingChanges[0]?.tier).toBe('T2')
      expect(pendingChanges[0]?.currentWeight).toBe(70)
      expect(pendingChanges[0]?.newWeight).toBe(75) // +5kg for lower body
    })
  })

  describe('T1 failure does not affect T2', () => {
    it('failing T1 squat creates stage change for T1 only', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': {
          exerciseId: 'squat',
          currentWeight: 100,
          stage: 0, // At stage 0 (5x3+)
          baseWeight: 60,
          amrapRecord: 0,
        },
        'squat-T2': {
          exerciseId: 'squat',
          currentWeight: 70,
          stage: 0, // Also at stage 0 (3x10)
          baseWeight: 42,
          amrapRecord: 0,
        },
      }

      // Failed T1 workout - only got 2 reps on some sets
      const workout = createWorkout('hevy-squat', [
        { reps: 3, weight: 100 },
        { reps: 3, weight: 100 },
        { reps: 2, weight: 100 }, // Failed
        { reps: 2, weight: 100 }, // Failed
        { reps: 2, weight: 100 }, // Failed
      ])

      const results = analyzeWorkout(workout, mockExercises, progression, 'A1')
      const pendingChanges = createPendingChangesFromAnalysis(
        results,
        mockExercises,
        progression,
        'kg',
        'A1'
      )

      expect(pendingChanges).toHaveLength(1)
      expect(pendingChanges[0]?.tier).toBe('T1')
      expect(pendingChanges[0]?.type).toBe('stage_change')
      expect(pendingChanges[0]?.newStage).toBe(1) // Moved to stage 1 (6x2+)

      // T2 progression should remain untouched
      expect(progression['squat-T2']?.stage).toBe(0)
      expect(progression['squat-T2']?.currentWeight).toBe(70)
    })
  })

  describe('Different exercises on same day maintain independence', () => {
    it('bench T2 on A1 uses bench-T2 key, not squat-T1', () => {
      const progression: Record<string, ProgressionState> = {
        'squat-T1': {
          exerciseId: 'squat',
          currentWeight: 100,
          stage: 0,
          baseWeight: 60,
          amrapRecord: 0,
        },
        'bench-T2': {
          exerciseId: 'bench',
          currentWeight: 50,
          stage: 0,
          baseWeight: 30,
          amrapRecord: 0,
        },
      }

      // Bench at 50kg (T2 on A1 day)
      const workout = createWorkout('hevy-bench', [
        { reps: 10, weight: 50 },
        { reps: 10, weight: 50 },
        { reps: 10, weight: 50 },
      ])

      const results = analyzeWorkout(workout, mockExercises, progression, 'A1')

      expect(results).toHaveLength(1)
      expect(results[0]?.tier).toBe('T2')
      expect(results[0]?.discrepancy).toBeUndefined() // Matches bench-T2 at 50kg
    })
  })

  describe('Null day handling (Bug fix: null === null matching)', () => {
    it('when day is undefined, main lifts should be skipped (not default to T1)', () => {
      const progression: Record<string, ProgressionState> = {
        'bench-T1': {
          exerciseId: 'bench',
          currentWeight: 60,
          stage: 0,
          baseWeight: 40,
          amrapRecord: 0,
        },
        'bench-T2': {
          exerciseId: 'bench',
          currentWeight: 42.5,
          stage: 0,
          baseWeight: 28,
          amrapRecord: 0,
        },
      }

      // Bench 3x10 - should be T2 rep scheme, but with undefined day
      const workout = createWorkout('hevy-bench', [
        { reps: 10, weight: 42.5 },
        { reps: 10, weight: 42.5 },
        { reps: 10, weight: 42.5 },
      ])

      // When day is undefined, main lifts should be SKIPPED to prevent
      // incorrect tier assignment (defense-in-depth for null === null bug fix)
      const results = analyzeWorkout(workout, mockExercises, progression, undefined)

      // FIXED: Main lifts without day context are now skipped
      // This prevents bench T2 workouts from incorrectly affecting T1 state
      expect(results).toHaveLength(0)
    })

    it('bench 3x10 on A1 should generate T2 progress, not T1 stage change', () => {
      const progression: Record<string, ProgressionState> = {
        'bench-T1': {
          exerciseId: 'bench',
          currentWeight: 60,
          stage: 0,
          baseWeight: 40,
          amrapRecord: 0,
        },
        'bench-T2': {
          exerciseId: 'bench',
          currentWeight: 42.5,
          stage: 0,
          baseWeight: 28,
          amrapRecord: 0,
        },
      }

      // Bench 3x10 at T2 weight on A1 (where bench is T2)
      const workout = createWorkout('hevy-bench', [
        { reps: 10, weight: 42.5 },
        { reps: 10, weight: 42.5 },
        { reps: 10, weight: 42.5 },
      ])

      // With correct day A1, bench is T2
      const results = analyzeWorkout(workout, mockExercises, progression, 'A1')
      const changes = createPendingChangesFromAnalysis(
        results,
        mockExercises,
        progression,
        'kg',
        'A1'
      )

      expect(results).toHaveLength(1)
      expect(results[0]?.tier).toBe('T2')

      expect(changes).toHaveLength(1)
      expect(changes[0]?.tier).toBe('T2')
      expect(changes[0]?.type).toBe('progress') // Should progress, not stage_change
      expect(changes[0]?.progressionKey).toBe('bench-T2')
      expect(changes[0]?.newWeight).toBe(45) // 42.5 + 2.5kg (upper body increment)
    })
  })
})
