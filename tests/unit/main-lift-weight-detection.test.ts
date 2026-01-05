/**
 * Unit Tests: Main Lift Weight Detection
 *
 * Tests for detecting T1 and T2 weights during routine import.
 * [US2] User Story 2 - Import Path (FR-002 through FR-007)
 */

import { describe, it, expect } from 'vitest'
import { detectMainLiftWeights } from '@/lib/routine-importer'
import type { Routine, RoutineExerciseRead } from '@/types/hevy'
import type { RoutineAssignment } from '@/types/state'

describe('detectMainLiftWeights', () => {
  // Helper to create a routine exercise
  const createRoutineExercise = (
    title: string,
    templateId: string,
    sets: { reps: number; weight: number }[]
  ): RoutineExerciseRead => ({
    index: 0,
    exercise_template_id: templateId,
    title,
    notes: null,
    rest_seconds: null,
    superset_id: null,
    sets: sets.map((s, index) => ({
      index,
      type: 'normal' as const,
      weight_kg: s.weight,
      reps: s.reps,
      distance_meters: null,
      duration_seconds: null,
      rpe: null,
      custom_metric: null,
    })),
  })

  // Helper to create a routine
  const createRoutine = (
    id: string,
    title: string,
    exercises: RoutineExerciseRead[]
  ): Routine => ({
    id,
    title,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    folder_id: null,
    exercises,
  })

  describe('extracts T1 and T2 weights for all four main lifts', () => {
    it('detects squat T1 (A1) and T2 (A2) weights', () => {
      // A1: squat @ T1 position (100kg), bench @ T2 position
      const routineA1 = createRoutine('r1', 'Day A1', [
        createRoutineExercise('Squat', 'squat-template', [
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
        ]),
        createRoutineExercise('Bench Press', 'bench-template', [
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
        ]),
      ])

      // A2: bench @ T1 position, squat @ T2 position (70kg)
      const routineA2 = createRoutine('r3', 'Day A2', [
        createRoutineExercise('Bench Press', 'bench-template', [
          { reps: 3, weight: 80 },
          { reps: 3, weight: 80 },
          { reps: 3, weight: 80 },
          { reps: 3, weight: 80 },
          { reps: 3, weight: 80 },
        ]),
        createRoutineExercise('Squat', 'squat-template', [
          { reps: 10, weight: 70 },
          { reps: 10, weight: 70 },
          { reps: 10, weight: 70 },
        ]),
      ])

      const routines = new Map([
        ['r1', routineA1],
        ['r3', routineA2],
      ])

      const assignment: RoutineAssignment = {
        A1: 'r1',
        B1: null,
        A2: 'r3',
        B2: null,
      }

      const result = detectMainLiftWeights(routines, assignment)

      // Find squat entry
      const squat = result.find((r) => r.role === 'squat')
      expect(squat).toBeDefined()
      expect(squat!.t1.weight).toBe(100)
      expect(squat!.t1.source).toContain('A1')
      expect(squat!.t2.weight).toBe(70)
      expect(squat!.t2.source).toContain('A2')
      expect(squat!.hasWarning).toBe(false)
    })

    it('detects bench T1 (A2) and T2 (A1) weights', () => {
      // A1: squat @ T1, bench @ T2 position (60kg)
      const routineA1 = createRoutine('r1', 'Day A1', [
        createRoutineExercise('Squat', 'squat-template', [
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
        ]),
        createRoutineExercise('Bench Press', 'bench-template', [
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
        ]),
      ])

      // A2: bench @ T1 position (80kg), squat @ T2 position
      const routineA2 = createRoutine('r3', 'Day A2', [
        createRoutineExercise('Bench Press', 'bench-template', [
          { reps: 3, weight: 80 },
          { reps: 3, weight: 80 },
          { reps: 3, weight: 80 },
          { reps: 3, weight: 80 },
          { reps: 3, weight: 80 },
        ]),
        createRoutineExercise('Squat', 'squat-template', [
          { reps: 10, weight: 70 },
          { reps: 10, weight: 70 },
          { reps: 10, weight: 70 },
        ]),
      ])

      const routines = new Map([
        ['r1', routineA1],
        ['r3', routineA2],
      ])

      const assignment: RoutineAssignment = {
        A1: 'r1',
        B1: null,
        A2: 'r3',
        B2: null,
      }

      const result = detectMainLiftWeights(routines, assignment)

      // Find bench entry
      const bench = result.find((r) => r.role === 'bench')
      expect(bench).toBeDefined()
      expect(bench!.t1.weight).toBe(80)
      expect(bench!.t1.source).toContain('A2')
      expect(bench!.t2.weight).toBe(60)
      expect(bench!.t2.source).toContain('A1')
      expect(bench!.hasWarning).toBe(false)
    })

    it('detects ohp T1 (B1) and T2 (B2) weights', () => {
      // B1: ohp @ T1 position (40kg), deadlift @ T2 position
      const routineB1 = createRoutine('r2', 'Day B1', [
        createRoutineExercise('Overhead Press', 'ohp-template', [
          { reps: 3, weight: 40 },
          { reps: 3, weight: 40 },
          { reps: 3, weight: 40 },
          { reps: 3, weight: 40 },
          { reps: 3, weight: 40 },
        ]),
        createRoutineExercise('Deadlift', 'deadlift-template', [
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 },
        ]),
      ])

      // B2: deadlift @ T1 position, ohp @ T2 position (28kg)
      const routineB2 = createRoutine('r4', 'Day B2', [
        createRoutineExercise('Deadlift', 'deadlift-template', [
          { reps: 3, weight: 140 },
          { reps: 3, weight: 140 },
          { reps: 3, weight: 140 },
          { reps: 3, weight: 140 },
          { reps: 3, weight: 140 },
        ]),
        createRoutineExercise('Overhead Press', 'ohp-template', [
          { reps: 10, weight: 28 },
          { reps: 10, weight: 28 },
          { reps: 10, weight: 28 },
        ]),
      ])

      const routines = new Map([
        ['r2', routineB1],
        ['r4', routineB2],
      ])

      const assignment: RoutineAssignment = {
        A1: null,
        B1: 'r2',
        A2: null,
        B2: 'r4',
      }

      const result = detectMainLiftWeights(routines, assignment)

      // Find ohp entry
      const ohp = result.find((r) => r.role === 'ohp')
      expect(ohp).toBeDefined()
      expect(ohp!.t1.weight).toBe(40)
      expect(ohp!.t1.source).toContain('B1')
      expect(ohp!.t2.weight).toBe(28)
      expect(ohp!.t2.source).toContain('B2')
      expect(ohp!.hasWarning).toBe(false)
    })

    it('detects deadlift T1 (B2) and T2 (B1) weights', () => {
      // B1: ohp @ T1 position, deadlift @ T2 position (100kg)
      const routineB1 = createRoutine('r2', 'Day B1', [
        createRoutineExercise('Overhead Press', 'ohp-template', [
          { reps: 3, weight: 40 },
          { reps: 3, weight: 40 },
          { reps: 3, weight: 40 },
          { reps: 3, weight: 40 },
          { reps: 3, weight: 40 },
        ]),
        createRoutineExercise('Deadlift', 'deadlift-template', [
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 },
        ]),
      ])

      // B2: deadlift @ T1 position (140kg), ohp @ T2 position
      const routineB2 = createRoutine('r4', 'Day B2', [
        createRoutineExercise('Deadlift', 'deadlift-template', [
          { reps: 3, weight: 140 },
          { reps: 3, weight: 140 },
          { reps: 3, weight: 140 },
          { reps: 3, weight: 140 },
          { reps: 3, weight: 140 },
        ]),
        createRoutineExercise('Overhead Press', 'ohp-template', [
          { reps: 10, weight: 28 },
          { reps: 10, weight: 28 },
          { reps: 10, weight: 28 },
        ]),
      ])

      const routines = new Map([
        ['r2', routineB1],
        ['r4', routineB2],
      ])

      const assignment: RoutineAssignment = {
        A1: null,
        B1: 'r2',
        A2: null,
        B2: 'r4',
      }

      const result = detectMainLiftWeights(routines, assignment)

      // Find deadlift entry
      const deadlift = result.find((r) => r.role === 'deadlift')
      expect(deadlift).toBeDefined()
      expect(deadlift!.t1.weight).toBe(140)
      expect(deadlift!.t1.source).toContain('B2')
      expect(deadlift!.t2.weight).toBe(100)
      expect(deadlift!.t2.source).toContain('B1')
      expect(deadlift!.hasWarning).toBe(false)
    })
  })

  describe('stage detection', () => {
    it('detects stage 0 (5x3) for T1', () => {
      const routine = createRoutine('r1', 'Day A1', [
        createRoutineExercise('Squat', 'squat-template', [
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
        ]),
        createRoutineExercise('Bench Press', 'bench-template', [
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
        ]),
      ])

      const routines = new Map([['r1', routine]])
      const assignment: RoutineAssignment = { A1: 'r1', B1: null, A2: null, B2: null }

      const result = detectMainLiftWeights(routines, assignment)
      const squat = result.find((r) => r.role === 'squat')

      expect(squat!.t1.stage).toBe(0)
    })

    it('detects stage 0 (3x10) for T2', () => {
      const routine = createRoutine('r1', 'Day A1', [
        createRoutineExercise('Squat', 'squat-template', [
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
        ]),
        createRoutineExercise('Bench Press', 'bench-template', [
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
        ]),
      ])

      const routines = new Map([['r1', routine]])
      const assignment: RoutineAssignment = { A1: 'r1', B1: null, A2: null, B2: null }

      const result = detectMainLiftWeights(routines, assignment)
      const bench = result.find((r) => r.role === 'bench')

      expect(bench!.t2.stage).toBe(0)
    })
  })

  describe('missing tier handling', () => {
    it('sets hasWarning true when only T1 is detected', () => {
      // Only A1 is assigned - we only have T1 squat, not T2
      const routine = createRoutine('r1', 'Day A1', [
        createRoutineExercise('Squat', 'squat-template', [
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
        ]),
      ])

      const routines = new Map([['r1', routine]])
      const assignment: RoutineAssignment = { A1: 'r1', B1: null, A2: null, B2: null }

      const result = detectMainLiftWeights(routines, assignment)
      const squat = result.find((r) => r.role === 'squat')

      expect(squat!.hasWarning).toBe(true)
      // T2 should be estimated or placeholder
      expect(squat!.t2.weight).toBeGreaterThanOrEqual(0)
    })

    it('estimates T2 from T1 when only T1 is detected', () => {
      // Only A1 - T1 squat at 100kg, T2 should be estimated at ~70%
      const routine = createRoutine('r1', 'Day A1', [
        createRoutineExercise('Squat', 'squat-template', [
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
          { reps: 3, weight: 100 },
        ]),
      ])

      const routines = new Map([['r1', routine]])
      const assignment: RoutineAssignment = { A1: 'r1', B1: null, A2: null, B2: null }

      const result = detectMainLiftWeights(routines, assignment)
      const squat = result.find((r) => r.role === 'squat')

      // T2 estimated at 70% of T1, rounded to 2.5kg increment
      expect(squat!.t2.weight).toBe(70)
    })
  })

  describe('returns all four main lifts', () => {
    it('returns array with exactly 4 entries when all lifts are detected', () => {
      const routineA1 = createRoutine('r1', 'Day A1', [
        createRoutineExercise('Squat', 'squat-template', [{ reps: 3, weight: 100 }]),
        createRoutineExercise('Bench Press', 'bench-template', [{ reps: 10, weight: 60 }]),
      ])
      const routineB1 = createRoutine('r2', 'Day B1', [
        createRoutineExercise('OHP', 'ohp-template', [{ reps: 3, weight: 40 }]),
        createRoutineExercise('Deadlift', 'deadlift-template', [{ reps: 10, weight: 100 }]),
      ])
      const routineA2 = createRoutine('r3', 'Day A2', [
        createRoutineExercise('Bench Press', 'bench-template', [{ reps: 3, weight: 80 }]),
        createRoutineExercise('Squat', 'squat-template', [{ reps: 10, weight: 70 }]),
      ])
      const routineB2 = createRoutine('r4', 'Day B2', [
        createRoutineExercise('Deadlift', 'deadlift-template', [{ reps: 3, weight: 140 }]),
        createRoutineExercise('OHP', 'ohp-template', [{ reps: 10, weight: 28 }]),
      ])

      const routines = new Map([
        ['r1', routineA1],
        ['r2', routineB1],
        ['r3', routineA2],
        ['r4', routineB2],
      ])

      const assignment: RoutineAssignment = {
        A1: 'r1',
        B1: 'r2',
        A2: 'r3',
        B2: 'r4',
      }

      const result = detectMainLiftWeights(routines, assignment)

      expect(result).toHaveLength(4)
      expect(result.map((r) => r.role).sort()).toEqual(['bench', 'deadlift', 'ohp', 'squat'])
    })
  })
})
