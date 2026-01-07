/**
 * Routine Importer Unit Tests
 *
 * Tests for toAvailableRoutine and extractFromRoutines functions.
 * TDD: These tests are written BEFORE the implementation.
 */

import { describe, it, expect } from 'vitest'
import {
  toAvailableRoutine,
  extractFromRoutines,
  resolveWeightsFromWorkoutHistory,
} from '@/lib/routine-importer'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types/hevy'
import {
  createMockRoutine,
  createGZCLPA1Routine,
  createGZCLPB1Routine,
  createGZCLPA2Routine,
  createGZCLPB2Routine,
  createT1Exercise,
  createT2Exercise,
  createT3Exercise,
  createRoutineExercise,
  createNormalSets,
  createFullAssignment,
  createPartialAssignment,
  createEmptyAssignment,
  createRoutineWithUniqueT3s,
  createRoutineWithManyT3s,
} from '../helpers/routine-mocks'
import type { ImportResult, ImportedExercise, GZCLPDay } from '@/types/state'

/**
 * Helper to get all exercises from byDay structure for easier testing.
 * Collects T1, T2, and T3s from all days, deduplicating by templateId.
 */
function getAllExercises(result: ImportResult): ImportedExercise[] {
  const seen = new Map<string, ImportedExercise>()
  const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

  for (const day of days) {
    const dayData = result.byDay[day]
    if (dayData.t1) seen.set(dayData.t1.templateId, dayData.t1)
    if (dayData.t2) seen.set(dayData.t2.templateId, dayData.t2)
    for (const t3 of dayData.t3s) {
      seen.set(t3.templateId, t3)
    }
  }

  return Array.from(seen.values())
}

describe('toAvailableRoutine', () => {
  it('converts a Routine to AvailableRoutine summary', () => {
    const routine = createGZCLPA1Routine()
    const available = toAvailableRoutine(routine)

    expect(available.id).toBe(routine.id)
    expect(available.title).toBe(routine.title)
    expect(available.exerciseCount).toBe(5)
    expect(available.exercisePreview).toHaveLength(3)
    expect(available.exercisePreview).toEqual(['Squat', 'Bench Press', 'Lat Pulldown'])
    expect(available.updatedAt).toBe(routine.updated_at)
  })

  it('handles routine with fewer than 3 exercises', () => {
    const routine = createMockRoutine('Short Routine', [
      createT1Exercise('Squat', 0),
    ])
    const available = toAvailableRoutine(routine)

    expect(available.exerciseCount).toBe(1)
    expect(available.exercisePreview).toHaveLength(1)
    expect(available.exercisePreview).toEqual(['Squat'])
  })

  it('handles empty routine', () => {
    const routine = createMockRoutine('Empty Routine', [])
    const available = toAvailableRoutine(routine)

    expect(available.exerciseCount).toBe(0)
    expect(available.exercisePreview).toHaveLength(0)
  })
})

describe('extractFromRoutines', () => {
  describe('exercise extraction', () => {
    // Note: With the new role-based system, exercises are extracted from routines
    // without slot assignment. Users assign roles (squat, bench, ohp, deadlift, t3, etc.)
    // during the import review step.

    it('extracts exercises from A1 routine by position', () => {
      const routine = createGZCLPA1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // First position exercise (Squat)
      const squatExercise = getAllExercises(result).find((ex) => ex.name === 'Squat')
      expect(squatExercise).toBeDefined()
      expect(squatExercise!.templateId).toBe('template-squat')
    })

    it('extracts bench from A1 routine', () => {
      const routine = createGZCLPA1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const benchExercise = getAllExercises(result).find((ex) => ex.name === 'Bench Press')
      expect(benchExercise).toBeDefined()
      // Template ID is auto-generated from title
      expect(benchExercise!.templateId).toBe('template-bench-press')
    })

    it('extracts exercises from B1 routine', () => {
      const routine = createGZCLPB1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ B1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const ohpExercise = getAllExercises(result).find((ex) => ex.name === 'Overhead Press')
      expect(ohpExercise).toBeDefined()
      // Template ID is auto-generated from title
      expect(ohpExercise!.templateId).toBe('template-overhead-press')

      const deadliftExercise = getAllExercises(result).find((ex) => ex.name === 'Deadlift')
      expect(deadliftExercise).toBeDefined()
      expect(deadliftExercise!.templateId).toBe('template-deadlift')
    })

    it('extracts accessory exercises from A1 routine', () => {
      const a1 = createGZCLPA1Routine()
      const b1 = createGZCLPB1Routine()
      const routines = new Map([
        [a1.id, a1],
        [b1.id, b1],
      ])
      const assignment = createPartialAssignment({ A1: a1.id, B1: b1.id })

      const result = extractFromRoutines(routines, assignment)

      // Verify accessory exercises were extracted
      expect(getAllExercises(result).find((ex) => ex.name === 'Lat Pulldown')).toBeDefined()
      expect(getAllExercises(result).find((ex) => ex.name === 'Cable Row')).toBeDefined()
      expect(getAllExercises(result).find((ex) => ex.name === 'Leg Curl')).toBeDefined()
    })
  })

  describe('weight extraction', () => {
    it('extracts weight from max of normal sets', () => {
      const routine = createGZCLPA1Routine({ t1: 0, t2: 0 }, { t1: 60, t2: 40, t3: 20 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // Find by name since slot is no longer part of ImportedExercise
      const squatExercise = getAllExercises(result).find((ex) => ex.name === 'Squat')
      expect(squatExercise!.detectedWeight).toBe(60)

      const benchExercise = getAllExercises(result).find((ex) => ex.name === 'Bench Press')
      expect(benchExercise!.detectedWeight).toBe(40)
    })
  })

  describe('stage detection', () => {
    it('detects Stage 0 from 5x3 T1 pattern', () => {
      const routine = createGZCLPA1Routine({ t1: 0, t2: 0 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // Find by name since slot is no longer part of ImportedExercise
      const squatExercise = getAllExercises(result).find((ex) => ex.name === 'Squat')
      expect(squatExercise!.detectedStage).toBe(0)
      expect(squatExercise!.stageConfidence).toBe('high')
    })

    it('detects Stage 1 from 6x2 T1 pattern', () => {
      const routine = createGZCLPA1Routine({ t1: 1, t2: 0 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const squatExercise = getAllExercises(result).find((ex) => ex.name === 'Squat')
      expect(squatExercise!.detectedStage).toBe(1)
      expect(squatExercise!.stageConfidence).toBe('high')
    })

    it('detects Stage 2 from 10x1 T1 pattern', () => {
      const routine = createGZCLPA1Routine({ t1: 2, t2: 0 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const squatExercise = getAllExercises(result).find((ex) => ex.name === 'Squat')
      expect(squatExercise!.detectedStage).toBe(2)
      expect(squatExercise!.stageConfidence).toBe('high')
    })

    it('sets manual confidence for unknown stage pattern', () => {
      const exercise = createRoutineExercise('Squat', createNormalSets(4, 5, 60)) // 4x5 - not a GZCLP pattern
      const routine = createMockRoutine('Non-standard', [
        exercise,
        createT2Exercise('Bench Press', 0),
      ])
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // Find by name since slot is no longer part of ImportedExercise
      const squatExercise = getAllExercises(result).find((ex) => ex.name === 'Squat')
      expect(squatExercise!.stageConfidence).toBe('manual')

      // Should also generate a warning
      const warning = result.warnings.find((w) => w.type === 'stage_unknown')
      expect(warning).toBeDefined()
    })
  })

  describe('warnings', () => {
    it('generates no_t2 warning for routine with <2 exercises', () => {
      const routine = createMockRoutine('Single Exercise', [
        createT1Exercise('Squat', 0),
      ])
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'no_t2',
          day: 'A1',
          message: expect.stringContaining('No T2'),
        })
      )
    })

    it('generates duplicate_routine warning when same routine assigned to multiple days', () => {
      const routine = createGZCLPA1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = {
        A1: routine.id,
        B1: routine.id, // Same routine for both days
        A2: null,
        B2: null,
      }

      const result = extractFromRoutines(routines, assignment)

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'duplicate_routine',
          message: expect.stringContaining('same routine'),
        })
      )
    })

    it('generates weight_null warning when exercise has no weight', () => {
      const exercise = createRoutineExercise(
        'Bodyweight Exercise',
        createNormalSets(3, 10, 0).map((set) => ({ ...set, weight_kg: null }))
      )
      const routine = createMockRoutine('BW Routine', [
        createT1Exercise('Squat', 0),
        exercise, // T2 position with null weight
      ])
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'weight_null',
          message: expect.stringContaining('No weight'),
        })
      )
    })
  })

  describe('full routine assignment', () => {
    it('extracts and deduplicates exercises from all 4 routines', () => {
      const a1 = createGZCLPA1Routine()
      const b1 = createGZCLPB1Routine()
      const a2 = createGZCLPA2Routine()
      const b2 = createGZCLPB2Routine()
      const routines = new Map([
        [a1.id, a1],
        [b1.id, b1],
        [a2.id, a2],
        [b2.id, b2],
      ])
      const assignment = createFullAssignment({
        A1: a1.id,
        B1: b1.id,
        A2: a2.id,
        B2: b2.id,
      })

      const result = extractFromRoutines(routines, assignment)

      // Exercises are deduplicated by templateId:
      // - 4 unique main lifts: Squat, Bench Press, Overhead Press, Deadlift
      // - 3 unique T3s from A1: Lat Pulldown, Cable Row, Leg Curl
      // Total: 7 unique exercises
      expect(getAllExercises(result)).toHaveLength(7)

      // Check main lift exercises are extracted (by name)
      expect(getAllExercises(result).find((ex) => ex.name === 'Squat')).toBeDefined()
      expect(getAllExercises(result).find((ex) => ex.name === 'Bench Press')).toBeDefined()
      expect(getAllExercises(result).find((ex) => ex.name === 'Overhead Press')).toBeDefined()
      expect(getAllExercises(result).find((ex) => ex.name === 'Deadlift')).toBeDefined()

      // Main lifts should have roles auto-assigned from first occurrence
      const squat = getAllExercises(result).find((ex) => ex.name === 'Squat')
      const bench = getAllExercises(result).find((ex) => ex.name === 'Bench Press')
      const ohp = getAllExercises(result).find((ex) => ex.name === 'Overhead Press')
      const deadlift = getAllExercises(result).find((ex) => ex.name === 'Deadlift')

      expect(squat?.role).toBe('squat') // First occurrence A1 T1
      expect(bench?.role).toBe('bench') // First occurrence A1 T2
      expect(ohp?.role).toBe('ohp') // First occurrence B1 T1
      expect(deadlift?.role).toBe('deadlift') // First occurrence B1 T2

      // Check T3/accessory exercises are extracted
      expect(getAllExercises(result).find((ex) => ex.name === 'Lat Pulldown')).toBeDefined()
      expect(getAllExercises(result).find((ex) => ex.name === 'Cable Row')).toBeDefined()
      expect(getAllExercises(result).find((ex) => ex.name === 'Leg Curl')).toBeDefined()
    })

    it('stores routine IDs in result', () => {
      const a1 = createGZCLPA1Routine()
      const b1 = createGZCLPB1Routine()
      const routines = new Map([
        [a1.id, a1],
        [b1.id, b1],
      ])
      const assignment = createPartialAssignment({ A1: a1.id, B1: b1.id })

      const result = extractFromRoutines(routines, assignment)

      expect(result.routineIds).toEqual(assignment)
    })
  })

  describe('partial assignment', () => {
    it('handles partial assignment (only some days)', () => {
      const a1 = createGZCLPA1Routine()
      const routines = new Map([[a1.id, a1]])
      const assignment = createPartialAssignment({ A1: a1.id })

      const result = extractFromRoutines(routines, assignment)

      // Should have 1 T1 + 1 T2 + 3 T3 = 5 exercises
      expect(getAllExercises(result)).toHaveLength(5)
      // Find by name since slot is no longer part of ImportedExercise
      expect(getAllExercises(result).find((ex) => ex.name === 'Squat')).toBeDefined()
      expect(getAllExercises(result).find((ex) => ex.name === 'Bench Press')).toBeDefined()
    })

    it('returns empty exercises for empty assignment', () => {
      const routines = new Map<string, never>()
      const assignment = createEmptyAssignment()

      const result = extractFromRoutines(routines, assignment)

      expect(getAllExercises(result)).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('original set data', () => {
    it('stores original set count and rep scheme', () => {
      const routine = createGZCLPA1Routine({ t1: 0, t2: 0 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // Find by name since slot is no longer part of ImportedExercise
      const squatExercise = getAllExercises(result).find((ex) => ex.name === 'Squat')
      expect(squatExercise!.originalSetCount).toBe(5)
      expect(squatExercise!.originalRepScheme).toBe('5x3+')

      const benchExercise = getAllExercises(result).find((ex) => ex.name === 'Bench Press')
      expect(benchExercise!.originalSetCount).toBe(3)
      expect(benchExercise!.originalRepScheme).toBe('3x10')
    })
  })

  describe('template ID extraction', () => {
    it('extracts exercise template ID', () => {
      const routine = createGZCLPA1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      // Find by name or verify templateId exists on any exercise
      const squatExercise = getAllExercises(result).find((ex) => ex.name === 'Squat')
      expect(squatExercise).toBeDefined()
      expect(squatExercise!.templateId).toBe('template-squat')
    })
  })

  // ===========================================================================
  // Phase 2: Per-day byDay structure
  // ===========================================================================

  describe('Phase 2: per-day byDay structure', () => {
    describe('byDay structure returned', () => {
      it('returns byDay with keys A1, B1, A2, B2', () => {
        const a1 = createGZCLPA1Routine()
        const routines = new Map([[a1.id, a1]])
        const assignment = createPartialAssignment({ A1: a1.id })

        const result = extractFromRoutines(routines, assignment)

        expect(result.byDay).toBeDefined()
        expect(result.byDay).toHaveProperty('A1')
        expect(result.byDay).toHaveProperty('B1')
        expect(result.byDay).toHaveProperty('A2')
        expect(result.byDay).toHaveProperty('B2')
      })

      it('each day has t1, t2, t3s fields', () => {
        const a1 = createGZCLPA1Routine()
        const routines = new Map([[a1.id, a1]])
        const assignment = createPartialAssignment({ A1: a1.id })

        const result = extractFromRoutines(routines, assignment)

        // A1 should have populated data
        expect(result.byDay.A1).toHaveProperty('day', 'A1')
        expect(result.byDay.A1).toHaveProperty('t1')
        expect(result.byDay.A1).toHaveProperty('t2')
        expect(result.byDay.A1).toHaveProperty('t3s')
        expect(Array.isArray(result.byDay.A1.t3s)).toBe(true)

        // Unassigned days should have null t1/t2 and empty t3s
        expect(result.byDay.B1.t1).toBeNull()
        expect(result.byDay.B1.t2).toBeNull()
        expect(result.byDay.B1.t3s).toEqual([])
      })

      it('populates T1/T2 correctly for assigned day', () => {
        const a1 = createGZCLPA1Routine()
        const routines = new Map([[a1.id, a1]])
        const assignment = createPartialAssignment({ A1: a1.id })

        const result = extractFromRoutines(routines, assignment)

        expect(result.byDay.A1.t1).not.toBeNull()
        expect(result.byDay.A1.t1!.name).toBe('Squat')
        expect(result.byDay.A1.t1!.role).toBe('squat')

        expect(result.byDay.A1.t2).not.toBeNull()
        expect(result.byDay.A1.t2!.name).toBe('Bench Press')
        expect(result.byDay.A1.t2!.role).toBe('bench')
      })
    })

    describe('T3 extraction from all 4 routines', () => {
      it('extracts T3s from each assigned routine into its day', () => {
        // Create routines with UNIQUE T3s for each day
        const a1 = createRoutineWithUniqueT3s('A1', ['A1 Lat Pulldown', 'A1 Cable Row'])
        const b1 = createRoutineWithUniqueT3s('B1', ['B1 Leg Press', 'B1 Calf Raise'])
        const a2 = createRoutineWithUniqueT3s('A2', ['A2 Face Pull', 'A2 Tricep Pushdown'])
        const b2 = createRoutineWithUniqueT3s('B2', ['B2 Hamstring Curl', 'B2 Plank'])

        const routines = new Map([
          [a1.id, a1],
          [b1.id, b1],
          [a2.id, a2],
          [b2.id, b2],
        ])
        const assignment = createFullAssignment({
          A1: a1.id,
          B1: b1.id,
          A2: a2.id,
          B2: b2.id,
        })

        const result = extractFromRoutines(routines, assignment)

        // Verify A1 T3s
        expect(result.byDay.A1.t3s).toHaveLength(2)
        expect(result.byDay.A1.t3s.map((t) => t.name)).toEqual(['A1 Lat Pulldown', 'A1 Cable Row'])

        // Verify B1 T3s
        expect(result.byDay.B1.t3s).toHaveLength(2)
        expect(result.byDay.B1.t3s.map((t) => t.name)).toEqual(['B1 Leg Press', 'B1 Calf Raise'])

        // Verify A2 T3s
        expect(result.byDay.A2.t3s).toHaveLength(2)
        expect(result.byDay.A2.t3s.map((t) => t.name)).toEqual(['A2 Face Pull', 'A2 Tricep Pushdown'])

        // Verify B2 T3s
        expect(result.byDay.B2.t3s).toHaveLength(2)
        expect(result.byDay.B2.t3s.map((t) => t.name)).toEqual(['B2 Hamstring Curl', 'B2 Plank'])
      })

      it('returns empty t3s array for unassigned days', () => {
        const a1 = createRoutineWithUniqueT3s('A1', ['Lat Pulldown'])
        const routines = new Map([[a1.id, a1]])
        const assignment = createPartialAssignment({ A1: a1.id })

        const result = extractFromRoutines(routines, assignment)

        expect(result.byDay.B1.t3s).toEqual([])
        expect(result.byDay.A2.t3s).toEqual([])
        expect(result.byDay.B2.t3s).toEqual([])
      })
    })

    describe('T3 extraction from positions 2+', () => {
      it('extracts ALL T3s from positions 2+ (no limit)', () => {
        // Create routine with 6 T3s (positions 2-7)
        const routine = createRoutineWithManyT3s(6)
        const routines = new Map([[routine.id, routine]])
        const assignment = createPartialAssignment({ A1: routine.id })

        const result = extractFromRoutines(routines, assignment)

        // Should have all 6 T3s, not limited to 3
        expect(result.byDay.A1.t3s).toHaveLength(6)
        expect(result.byDay.A1.t3s.map((t) => t.name)).toEqual([
          'T3 Exercise 1',
          'T3 Exercise 2',
          'T3 Exercise 3',
          'T3 Exercise 4',
          'T3 Exercise 5',
          'T3 Exercise 6',
        ])
      })

      it('positions 0 and 1 are always T1/T2, never T3', () => {
        const routine = createRoutineWithManyT3s(3)
        const routines = new Map([[routine.id, routine]])
        const assignment = createPartialAssignment({ A1: routine.id })

        const result = extractFromRoutines(routines, assignment)

        // T1 and T2 should be the main lifts, not in t3s
        expect(result.byDay.A1.t1!.name).toBe('Squat')
        expect(result.byDay.A1.t2!.name).toBe('Bench Press')

        // T3s should not include Squat or Bench Press
        const t3Names = result.byDay.A1.t3s.map((t) => t.name)
        expect(t3Names).not.toContain('Squat')
        expect(t3Names).not.toContain('Bench Press')
      })
    })

    describe('T3 deduplication across days', () => {
      it('same T3 appearing in multiple days uses first occurrence weight', () => {
        // Same T3 in A1 (weight 20) and B1 (weight 30)
        const a1 = createRoutineWithUniqueT3s('A1', ['Lat Pulldown'])
        const b1Exercises = [
          createT1Exercise('Overhead Press', 0),
          createT2Exercise('Deadlift', 0),
          createT3Exercise('Lat Pulldown', 30), // Same T3, different weight
        ]
        const b1 = createMockRoutine('GZCLP B1 Unique', b1Exercises, 'routine-b1-unique')

        const routines = new Map([
          [a1.id, a1],
          [b1.id, b1],
        ])
        const assignment = createPartialAssignment({ A1: a1.id, B1: b1.id })

        const result = extractFromRoutines(routines, assignment)

        // Both days should reference the same exercise with A1's weight (first wins)
        const a1LatPulldown = result.byDay.A1.t3s.find((t) => t.name === 'Lat Pulldown')
        const b1LatPulldown = result.byDay.B1.t3s.find((t) => t.name === 'Lat Pulldown')

        expect(a1LatPulldown).toBeDefined()
        expect(b1LatPulldown).toBeDefined()

        // First wins - A1's weight should be used
        expect(a1LatPulldown!.detectedWeight).toBe(20)
        expect(b1LatPulldown!.detectedWeight).toBe(20)

        // Should be the same object reference (shared progression)
        expect(a1LatPulldown).toBe(b1LatPulldown)
      })

      it('unique T3s per day are not affected by deduplication', () => {
        const a1 = createRoutineWithUniqueT3s('A1', ['Lat Pulldown'])
        const b1 = createRoutineWithUniqueT3s('B1', ['Leg Press'])

        const routines = new Map([
          [a1.id, a1],
          [b1.id, b1],
        ])
        const assignment = createPartialAssignment({ A1: a1.id, B1: b1.id })

        const result = extractFromRoutines(routines, assignment)

        // Each day has its unique T3
        expect(result.byDay.A1.t3s).toHaveLength(1)
        expect(result.byDay.A1.t3s[0].name).toBe('Lat Pulldown')

        expect(result.byDay.B1.t3s).toHaveLength(1)
        expect(result.byDay.B1.t3s[0].name).toBe('Leg Press')
      })
    })
  })
})

// =============================================================================
// Helper functions for workout history tests
// =============================================================================

function createWorkoutSet(weight: number, reps: number, type: 'normal' | 'warmup' = 'normal'): WorkoutSet {
  return {
    index: 0,
    type,
    weight_kg: weight,
    reps,
    distance_meters: null,
    duration_seconds: null,
    rpe: null,
    custom_metric: null,
  }
}

function createWorkoutExercise(templateId: string, title: string, weight: number): WorkoutExercise {
  return {
    index: 0,
    title,
    notes: '',
    exercise_template_id: templateId,
    supersets_id: null,
    sets: [
      createWorkoutSet(weight * 0.5, 10, 'warmup'),
      createWorkoutSet(weight, 5, 'normal'),
      createWorkoutSet(weight, 5, 'normal'),
      createWorkoutSet(weight, 5, 'normal'),
    ],
  }
}

function createMockWorkout(
  routineId: string,
  exercises: WorkoutExercise[],
  startTime: string = '2025-01-01T10:00:00Z'
): Workout {
  return {
    id: `workout-${routineId}-${startTime}`,
    title: 'Test Workout',
    routine_id: routineId,
    description: '',
    start_time: startTime,
    end_time: startTime,
    updated_at: startTime,
    created_at: startTime,
    exercises,
  }
}

// =============================================================================
// resolveWeightsFromWorkoutHistory Tests
// =============================================================================

describe('resolveWeightsFromWorkoutHistory', () => {
  describe('weight resolution from workout history', () => {
    it('extracts weights from workout history, not routine templates', () => {
      // Create routine with template weights (these should be ignored)
      const a1Routine = createGZCLPA1Routine() // Template has weights like 100kg
      const routines = new Map([[a1Routine.id, a1Routine]])
      const assignment = createPartialAssignment({ A1: a1Routine.id })

      // Extract with template weights
      const baseResult = extractFromRoutines(routines, assignment)
      const templateWeight = baseResult.byDay.A1.t1?.detectedWeight // e.g., 100kg

      // Create workout with different weights
      // Template IDs match pattern: template-{title.toLowerCase().replace(/\s+/g, '-')}
      const workoutWeight = 75 // Different from template
      const workout = createMockWorkout(a1Routine.id, [
        createWorkoutExercise('template-squat', 'Squat', workoutWeight),
        createWorkoutExercise('template-bench-press', 'Bench Press', 50),
      ])

      // Resolve weights from workout history
      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [workout])

      // Should use workout weight, not template weight
      expect(result.byDay.A1.t1?.detectedWeight).toBe(workoutWeight)
      expect(result.byDay.A1.t1?.detectedWeight).not.toBe(templateWeight)
    })

    it('adds history_missing warning when no workout exists for routine', () => {
      const a1Routine = createGZCLPA1Routine()
      const routines = new Map([[a1Routine.id, a1Routine]])
      const assignment = createPartialAssignment({ A1: a1Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)

      // Resolve with empty workout array - no history
      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [])

      // Should have history_missing warning
      const historyWarnings = result.warnings.filter((w) => w.type === 'history_missing')
      expect(historyWarnings.length).toBeGreaterThan(0)
      expect(historyWarnings[0].day).toBe('A1')
      expect(historyWarnings[0].message).toContain('No workout history')

      // Weights should be set to 0 for manual entry
      expect(result.byDay.A1.t1?.detectedWeight).toBe(0)
      expect(result.byDay.A1.t2?.detectedWeight).toBe(0)
    })

    it('uses most recent workout when multiple exist', () => {
      const a1Routine = createGZCLPA1Routine()
      const routines = new Map([[a1Routine.id, a1Routine]])
      const assignment = createPartialAssignment({ A1: a1Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)

      // Create two workouts - older with 50kg, newer with 80kg
      const olderWorkout = createMockWorkout(
        a1Routine.id,
        [
          createWorkoutExercise('template-squat', 'Squat', 50),
          createWorkoutExercise('template-bench-press', 'Bench Press', 40),
        ],
        '2025-01-01T10:00:00Z'
      )
      const newerWorkout = createMockWorkout(
        a1Routine.id,
        [
          createWorkoutExercise('template-squat', 'Squat', 80),
          createWorkoutExercise('template-bench-press', 'Bench Press', 60),
        ],
        '2025-01-15T10:00:00Z'
      )

      // Pass workouts in any order
      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [
        olderWorkout,
        newerWorkout,
      ])

      // Should use weight from newer workout
      expect(result.byDay.A1.t1?.detectedWeight).toBe(80)
      expect(result.byDay.A1.t2?.detectedWeight).toBe(60)
    })

    it('handles missing exercise in workout (skipped exercise)', () => {
      const a1Routine = createGZCLPA1Routine()
      const routines = new Map([[a1Routine.id, a1Routine]])
      const assignment = createPartialAssignment({ A1: a1Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)

      // Workout has T1 but not T2 (user skipped bench press)
      const workout = createMockWorkout(a1Routine.id, [
        createWorkoutExercise('template-squat', 'Squat', 100),
        // No bench press in workout
      ])

      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [workout])

      // T1 should have weight from workout
      expect(result.byDay.A1.t1?.detectedWeight).toBe(100)
      // T2 should be 0 (missing from workout)
      expect(result.byDay.A1.t2?.detectedWeight).toBe(0)
    })

    it('preserves exercise structure (name, role, templateId) from routine', () => {
      const a1Routine = createGZCLPA1Routine()
      const routines = new Map([[a1Routine.id, a1Routine]])
      const assignment = createPartialAssignment({ A1: a1Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)
      const originalT1 = baseResult.byDay.A1.t1!

      const workout = createMockWorkout(a1Routine.id, [
        createWorkoutExercise('template-squat', 'Squat', 75),
      ])

      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [workout])

      // Structure should be preserved, only weight changed
      expect(result.byDay.A1.t1?.name).toBe(originalT1.name)
      expect(result.byDay.A1.t1?.templateId).toBe(originalT1.templateId)
      expect(result.byDay.A1.t1?.role).toBe(originalT1.role)
      expect(result.byDay.A1.t1?.detectedWeight).toBe(75) // Weight from workout
    })

    it('only matches workouts with same routine_id', () => {
      const a1Routine = createGZCLPA1Routine()
      const a2Routine = createGZCLPA2Routine()
      const routines = new Map([
        [a1Routine.id, a1Routine],
        [a2Routine.id, a2Routine],
      ])
      const assignment = createPartialAssignment({ A1: a1Routine.id, A2: a2Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)

      // Workout for A2 routine only
      const a2Workout = createMockWorkout(a2Routine.id, [
        createWorkoutExercise('template-bench-press', 'Bench Press', 65),
        createWorkoutExercise('template-squat', 'Squat', 55),
      ])

      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [a2Workout])

      // A1 should have warning (no matching workout)
      const a1Warnings = result.warnings.filter(
        (w) => w.type === 'history_missing' && w.day === 'A1'
      )
      expect(a1Warnings.length).toBe(1)
      expect(result.byDay.A1.t1?.detectedWeight).toBe(0)

      // A2 should have weights from workout
      expect(result.byDay.A2.t1?.detectedWeight).toBe(65) // Bench T1
      expect(result.byDay.A2.t2?.detectedWeight).toBe(55) // Squat T2
    })
  })

  describe('T3 weight unification across days', () => {
    it('uses most recent weight for T3 across all days', () => {
      // Scenario: Same T3 (Lat Pulldown) appears on A1 and A2
      // A1 workout was older (Jan 2) with 12kg
      // A2 workout was newer (Jan 5) with 14kg
      // Both should use 14kg after unification

      const a1Routine = createRoutineWithUniqueT3s('A1', ['Hammer Curl'])
      const a2Routine = createRoutineWithUniqueT3s('A2', ['Hammer Curl']) // Same T3

      const routines = new Map([
        [a1Routine.id, a1Routine],
        [a2Routine.id, a2Routine],
      ])
      const assignment = createPartialAssignment({ A1: a1Routine.id, A2: a2Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)

      // Create workouts with different dates and weights
      // A1 workout: older date, 12kg
      const a1Workout = createMockWorkout(
        a1Routine.id,
        [
          createWorkoutExercise('template-squat', 'Squat', 100),
          createWorkoutExercise('template-bench-press', 'Bench Press', 60),
          createWorkoutExercise('template-hammer-curl', 'Hammer Curl', 12),
        ],
        '2025-01-02T10:00:00Z'
      )

      // A2 workout: newer date, 14kg (same T3)
      const a2Workout = createMockWorkout(
        a2Routine.id,
        [
          createWorkoutExercise('template-bench-press', 'Bench Press', 65),
          createWorkoutExercise('template-squat', 'Squat', 55),
          createWorkoutExercise('template-hammer-curl', 'Hammer Curl', 14),
        ],
        '2025-01-05T10:00:00Z'
      )

      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [a1Workout, a2Workout])

      // Both days should have the LATEST weight (14kg from Jan 5)
      const a1T3 = result.byDay.A1.t3s.find((t) => t.name === 'Hammer Curl')
      const a2T3 = result.byDay.A2.t3s.find((t) => t.name === 'Hammer Curl')

      expect(a1T3?.detectedWeight).toBe(14) // Unified to latest
      expect(a2T3?.detectedWeight).toBe(14) // Latest weight
    })

    it('different T3 exercises maintain their own weights', () => {
      // Lat Pulldown done at 30kg on A1 (Jan 5)
      // Hammer Curl done at 14kg on A2 (Jan 3)
      // Each should keep its own most recent weight

      const a1Routine = createRoutineWithUniqueT3s('A1', ['Lat Pulldown'])
      const a2Routine = createRoutineWithUniqueT3s('A2', ['Hammer Curl'])

      const routines = new Map([
        [a1Routine.id, a1Routine],
        [a2Routine.id, a2Routine],
      ])
      const assignment = createPartialAssignment({ A1: a1Routine.id, A2: a2Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)

      const a1Workout = createMockWorkout(
        a1Routine.id,
        [
          createWorkoutExercise('template-squat', 'Squat', 100),
          createWorkoutExercise('template-bench-press', 'Bench Press', 60),
          createWorkoutExercise('template-lat-pulldown', 'Lat Pulldown', 30),
        ],
        '2025-01-05T10:00:00Z'
      )

      const a2Workout = createMockWorkout(
        a2Routine.id,
        [
          createWorkoutExercise('template-bench-press', 'Bench Press', 65),
          createWorkoutExercise('template-squat', 'Squat', 55),
          createWorkoutExercise('template-hammer-curl', 'Hammer Curl', 14),
        ],
        '2025-01-03T10:00:00Z'
      )

      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [a1Workout, a2Workout])

      // Each T3 keeps its own weight
      expect(result.byDay.A1.t3s[0]?.detectedWeight).toBe(30)
      expect(result.byDay.A2.t3s[0]?.detectedWeight).toBe(14)
    })

    it('T3 on single day still gets correct weight', () => {
      // T3 only on A1, should use that weight
      const a1Routine = createRoutineWithUniqueT3s('A1', ['Face Pull'])

      const routines = new Map([[a1Routine.id, a1Routine]])
      const assignment = createPartialAssignment({ A1: a1Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)

      const workout = createMockWorkout(
        a1Routine.id,
        [
          createWorkoutExercise('template-squat', 'Squat', 100),
          createWorkoutExercise('template-bench-press', 'Bench Press', 60),
          createWorkoutExercise('template-face-pull', 'Face Pull', 15),
        ],
        '2025-01-10T10:00:00Z'
      )

      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [workout])

      expect(result.byDay.A1.t3s[0]?.detectedWeight).toBe(15)
    })

    it('finds T3 weight from workout not in assigned routines', () => {
      // T3 is on A1 routine, but the most recent instance was in a B1 workout
      // This tests that unification looks at ALL workouts, not just the routine's workouts

      const a1Routine = createRoutineWithUniqueT3s('A1', ['Hammer Curl'])
      const b1Routine = createRoutineWithUniqueT3s('B1', ['Hammer Curl']) // Same T3

      const routines = new Map([
        [a1Routine.id, a1Routine],
        [b1Routine.id, b1Routine],
      ])
      const assignment = createPartialAssignment({ A1: a1Routine.id, B1: b1Routine.id })

      const baseResult = extractFromRoutines(routines, assignment)

      // B1 workout is more recent with higher weight
      const a1Workout = createMockWorkout(
        a1Routine.id,
        [
          createWorkoutExercise('template-squat', 'Squat', 100),
          createWorkoutExercise('template-bench-press', 'Bench Press', 60),
          createWorkoutExercise('template-hammer-curl', 'Hammer Curl', 10),
        ],
        '2025-01-01T10:00:00Z'
      )

      const b1Workout = createMockWorkout(
        b1Routine.id,
        [
          createWorkoutExercise('template-overhead-press', 'OHP', 40),
          createWorkoutExercise('template-deadlift', 'Deadlift', 120),
          createWorkoutExercise('template-hammer-curl', 'Hammer Curl', 16),
        ],
        '2025-01-10T10:00:00Z'
      )

      const result = resolveWeightsFromWorkoutHistory(baseResult, assignment, [a1Workout, b1Workout])

      // Both should use B1's weight (16kg) since it's more recent
      const a1T3 = result.byDay.A1.t3s.find((t) => t.name === 'Hammer Curl')
      const b1T3 = result.byDay.B1.t3s.find((t) => t.name === 'Hammer Curl')

      expect(a1T3?.detectedWeight).toBe(16)
      expect(b1T3?.detectedWeight).toBe(16)
    })
  })
})
