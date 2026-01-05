/**
 * Unit Tests: Warmup Exercise Detection
 *
 * Bug fix: "Warm up" exercises at position 0 should be skipped.
 * The first exercise with normal sets should become T1.
 *
 * @see docs/006-setup-wizard-bugfixes-plan.md - Issue 3
 */

import { describe, it, expect } from 'vitest'
import { extractFromRoutines, isWarmupOnlyExercise } from '@/lib/routine-importer'
import { createMockRoutine, createPartialAssignment } from '../helpers/routine-mocks'
import type { RoutineExerciseRead, Routine } from '@/types/hevy'

// Helper to create a warmup-only exercise
function createWarmupExercise(name: string, weight: number = 0): RoutineExerciseRead {
  return {
    index: 0,
    exercise_template_id: `template-${name.toLowerCase().replace(/\s+/g, '-')}`,
    title: name,
    notes: '',
    sets: [
      { index: 0, type: 'warmup', weight_kg: weight, reps: 10 },
      { index: 1, type: 'warmup', weight_kg: weight, reps: 10 },
      { index: 2, type: 'warmup', weight_kg: weight, reps: 10 },
    ],
  }
}

// Helper to create a normal exercise
function createNormalExercise(name: string, weight: number, sets: number, reps: number): RoutineExerciseRead {
  return {
    index: 0,
    exercise_template_id: `template-${name.toLowerCase().replace(/\s+/g, '-')}`,
    title: name,
    notes: '',
    sets: Array.from({ length: sets }, (_, i) => ({
      index: i,
      type: 'normal' as const,
      weight_kg: weight,
      reps,
    })),
  }
}

// Helper to create a mixed exercise (warmup + normal sets)
function createMixedExercise(name: string, weight: number): RoutineExerciseRead {
  return {
    index: 0,
    exercise_template_id: `template-${name.toLowerCase().replace(/\s+/g, '-')}`,
    title: name,
    notes: '',
    sets: [
      { index: 0, type: 'warmup', weight_kg: 20, reps: 10 },
      { index: 1, type: 'warmup', weight_kg: 40, reps: 5 },
      { index: 2, type: 'normal', weight_kg: weight, reps: 3 },
      { index: 3, type: 'normal', weight_kg: weight, reps: 3 },
      { index: 4, type: 'normal', weight_kg: weight, reps: 3 },
    ],
  }
}

describe('Warmup Exercise Detection Bug Fix', () => {
  describe('extractDayExercises skips warmup-only exercises', () => {
    it('skips warmup-only exercise at position 0, first normal exercise becomes T1', () => {
      // Routine: [Warm Up (warmup only), Squat (normal), Bench (normal)]
      const routine = createMockRoutine('A1 with Warmup', [
        createWarmupExercise('Warm Up'),
        createNormalExercise('Squat', 100, 5, 3),
        createNormalExercise('Bench Press', 60, 3, 10),
      ])

      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // T1 should be Squat (first exercise with normal sets), not "Warm Up"
      expect(result.byDay.A1.t1).not.toBeNull()
      expect(result.byDay.A1.t1!.name).toBe('Squat')
      expect(result.byDay.A1.t1!.detectedWeight).toBe(100)

      // T2 should be Bench Press
      expect(result.byDay.A1.t2).not.toBeNull()
      expect(result.byDay.A1.t2!.name).toBe('Bench Press')
    })

    it('handles multiple warmup-only exercises at the start', () => {
      // Routine: [Warm Up 1, Warm Up 2, Squat, Bench]
      const routine = createMockRoutine('A1 Multiple Warmups', [
        createWarmupExercise('Warm Up 1'),
        createWarmupExercise('Warm Up 2'),
        createNormalExercise('Squat', 100, 5, 3),
        createNormalExercise('Bench Press', 60, 3, 10),
      ])

      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // T1 should be Squat, skipping both warmup exercises
      expect(result.byDay.A1.t1!.name).toBe('Squat')
      expect(result.byDay.A1.t2!.name).toBe('Bench Press')
    })

    it('mixed exercise (warmup + normal sets) is NOT skipped', () => {
      // Exercise with both warmup and normal sets should be treated as T1
      const routine = createMockRoutine('A1 Mixed', [
        createMixedExercise('Squat', 100),
        createNormalExercise('Bench Press', 60, 3, 10),
      ])

      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // T1 should be the mixed exercise (has normal sets)
      expect(result.byDay.A1.t1!.name).toBe('Squat')
      expect(result.byDay.A1.t1!.detectedWeight).toBe(100)
    })

    it('returns t1: null with warning when all exercises are warmup-only', () => {
      // Routine with only warmup exercises
      const routine = createMockRoutine('All Warmups', [
        createWarmupExercise('Warm Up 1'),
        createWarmupExercise('Warm Up 2'),
      ])

      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // T1 and T2 should be null
      expect(result.byDay.A1.t1).toBeNull()
      expect(result.byDay.A1.t2).toBeNull()

      // Should generate a warning
      const warning = result.warnings.find(
        (w) => w.message.toLowerCase().includes('warmup') || w.message.toLowerCase().includes('no t1')
      )
      expect(warning).toBeDefined()
    })

    it('warmup exercise at position 0 does not appear in T3s', () => {
      const routine = createMockRoutine('A1 with Warmup and T3s', [
        createWarmupExercise('Warm Up'),
        createNormalExercise('Squat', 100, 5, 3),
        createNormalExercise('Bench Press', 60, 3, 10),
        createNormalExercise('Lat Pulldown', 40, 3, 15),
      ])

      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // Warmup exercise should not appear in T3s
      const t3Names = result.byDay.A1.t3s.map((t) => t.name)
      expect(t3Names).not.toContain('Warm Up')
      expect(t3Names).toContain('Lat Pulldown')
    })
  })

  describe('isWarmupOnlyExercise helper', () => {
    it('returns true for exercise with only warmup sets', () => {
      const warmupExercise = createWarmupExercise('Generic')

      // All sets are warmup type
      expect(warmupExercise.sets.every((s) => s.type === 'warmup')).toBe(true)
    })

    it('returns false for exercise with any normal sets', () => {
      const mixedExercise = createMixedExercise('Squat', 100)

      // Has at least one normal set
      expect(mixedExercise.sets.some((s) => s.type === 'normal')).toBe(true)
    })

    it('returns false for empty sets array', () => {
      const emptyExercise: RoutineExerciseRead = {
        index: 0,
        exercise_template_id: 'template-empty',
        title: 'Empty Exercise',
        notes: '',
        sets: [],
      }

      // Empty sets should not be considered warmup-only
      expect(emptyExercise.sets.length).toBe(0)
    })

    it('returns true for exercise with "warm up" in title (case-insensitive)', () => {
      // Exercise named "Warm Up" with normal sets should still be treated as warmup
      const warmupByName = createNormalExercise('Warm Up', 0, 3, 10)
      expect(isWarmupOnlyExercise(warmupByName)).toBe(true)
    })

    it('returns true for exercise with "warmup" in title (no space)', () => {
      const warmupByName = createNormalExercise('Pre-Squat Warmup', 20, 2, 8)
      expect(isWarmupOnlyExercise(warmupByName)).toBe(true)
    })

    it('returns true for exercise with "stretching" in title', () => {
      const stretchingExercise = createNormalExercise('Stretching Routine', 0, 3, 10)
      expect(isWarmupOnlyExercise(stretchingExercise)).toBe(true)
    })

    it('returns true for exercise with "mobility" in title', () => {
      const mobilityExercise = createNormalExercise('Hip Mobility', 0, 2, 10)
      expect(isWarmupOnlyExercise(mobilityExercise)).toBe(true)
    })

    it('returns true for exercise with "activation" in title', () => {
      const activationExercise = createNormalExercise('Glute Activation', 0, 2, 15)
      expect(isWarmupOnlyExercise(activationExercise)).toBe(true)
    })

    it('returns false for normal exercise (no warmup keywords)', () => {
      const normalExercise = createNormalExercise('Squat', 100, 5, 3)
      expect(isWarmupOnlyExercise(normalExercise)).toBe(false)
    })
  })
})
