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
} from '../helpers/routine-mocks'

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
  describe('slot mapping', () => {
    it('maps A1 position 1 to t1_squat slot', () => {
      const routine = createGZCLPA1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_squat')
      expect(t1Exercise).toBeDefined()
      expect(t1Exercise!.name).toBe('Squat')
    })

    it('maps A1 position 2 to t2_bench slot', () => {
      const routine = createGZCLPA1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t2Exercise = result.exercises.find((ex) => ex.slot === 't2_bench')
      expect(t2Exercise).toBeDefined()
      expect(t2Exercise!.name).toBe('Bench Press')
    })

    it('maps B1 position 1 to t1_ohp slot', () => {
      const routine = createGZCLPB1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ B1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_ohp')
      expect(t1Exercise).toBeDefined()
      expect(t1Exercise!.name).toBe('Overhead Press')
    })

    it('maps B1 position 2 to t2_deadlift slot', () => {
      const routine = createGZCLPB1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ B1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t2Exercise = result.exercises.find((ex) => ex.slot === 't2_deadlift')
      expect(t2Exercise).toBeDefined()
      expect(t2Exercise!.name).toBe('Deadlift')
    })

    it('extracts T3 exercises from A1 routine only', () => {
      const a1 = createGZCLPA1Routine()
      const b1 = createGZCLPB1Routine()
      const routines = new Map([
        [a1.id, a1],
        [b1.id, b1],
      ])
      const assignment = createPartialAssignment({ A1: a1.id, B1: b1.id })

      const result = extractFromRoutines(routines, assignment)

      const t3Exercises = result.exercises.filter((ex) => ex.slot.startsWith('t3_'))
      expect(t3Exercises).toHaveLength(3)
      // T3s should come from A1's positions 3, 4, 5
      expect(t3Exercises.map((ex) => ex.name)).toEqual([
        'Lat Pulldown',
        'Cable Row',
        'Leg Curl',
      ])
    })
  })

  describe('weight extraction', () => {
    it('extracts weight from max of normal sets', () => {
      const routine = createGZCLPA1Routine({ t1: 0, t2: 0 }, { t1: 60, t2: 40, t3: 20 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_squat')
      expect(t1Exercise!.detectedWeight).toBe(60)

      const t2Exercise = result.exercises.find((ex) => ex.slot === 't2_bench')
      expect(t2Exercise!.detectedWeight).toBe(40)
    })
  })

  describe('stage detection', () => {
    it('detects Stage 0 from 5x3 T1 pattern', () => {
      const routine = createGZCLPA1Routine({ t1: 0, t2: 0 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_squat')
      expect(t1Exercise!.detectedStage).toBe(0)
      expect(t1Exercise!.stageConfidence).toBe('high')
    })

    it('detects Stage 1 from 6x2 T1 pattern', () => {
      const routine = createGZCLPA1Routine({ t1: 1, t2: 0 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_squat')
      expect(t1Exercise!.detectedStage).toBe(1)
      expect(t1Exercise!.stageConfidence).toBe('high')
    })

    it('detects Stage 2 from 10x1 T1 pattern', () => {
      const routine = createGZCLPA1Routine({ t1: 2, t2: 0 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_squat')
      expect(t1Exercise!.detectedStage).toBe(2)
      expect(t1Exercise!.stageConfidence).toBe('high')
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

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_squat')
      expect(t1Exercise!.stageConfidence).toBe('manual')

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
    it('extracts exercises from all 4 routines', () => {
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

      // Should have 4 T1 + 4 T2 + 3 T3 = 11 exercises
      expect(result.exercises).toHaveLength(11)

      // Check all T1 slots are filled
      expect(result.exercises.find((ex) => ex.slot === 't1_squat')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't1_bench')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't1_ohp')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't1_deadlift')).toBeDefined()

      // Check all T2 slots are filled
      expect(result.exercises.find((ex) => ex.slot === 't2_squat')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't2_bench')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't2_ohp')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't2_deadlift')).toBeDefined()

      // Check T3 slots are filled
      expect(result.exercises.find((ex) => ex.slot === 't3_1')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't3_2')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't3_3')).toBeDefined()
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
      expect(result.exercises).toHaveLength(5)
      expect(result.exercises.find((ex) => ex.slot === 't1_squat')).toBeDefined()
      expect(result.exercises.find((ex) => ex.slot === 't2_bench')).toBeDefined()
    })

    it('returns empty exercises for empty assignment', () => {
      const routines = new Map<string, never>()
      const assignment = createEmptyAssignment()

      const result = extractFromRoutines(routines, assignment)

      expect(result.exercises).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('original set data', () => {
    it('stores original set count and rep scheme', () => {
      const routine = createGZCLPA1Routine({ t1: 0, t2: 0 })
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_squat')
      expect(t1Exercise!.originalSetCount).toBe(5)
      expect(t1Exercise!.originalRepScheme).toBe('5x3+')

      const t2Exercise = result.exercises.find((ex) => ex.slot === 't2_bench')
      expect(t2Exercise!.originalSetCount).toBe(3)
      expect(t2Exercise!.originalRepScheme).toBe('3x10')
    })
  })

  describe('template ID extraction', () => {
    it('extracts exercise template ID', () => {
      const routine = createGZCLPA1Routine()
      const routines = new Map([[routine.id, routine]])
      const assignment = createPartialAssignment({ A1: routine.id })

      const result = extractFromRoutines(routines, assignment)

      const t1Exercise = result.exercises.find((ex) => ex.slot === 't1_squat')
      expect(t1Exercise!.templateId).toBe('template-squat')
    })
  })
})
