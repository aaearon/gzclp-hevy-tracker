/**
 * Routine Importer Unit Tests
 *
 * Tests for toAvailableRoutine and extractFromRoutines functions.
 * TDD: These tests are written BEFORE the implementation.
 */

import { describe, it, expect } from 'vitest'
import { toAvailableRoutine, extractFromRoutines } from '@/lib/routine-importer'
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
