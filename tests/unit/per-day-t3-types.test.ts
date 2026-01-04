/**
 * Type Tests for Per-Day T3 Schedule Feature
 *
 * These tests verify that the new types compile correctly.
 * TDD: Written first, will fail until types are implemented.
 */
import { describe, it, expect } from 'vitest'
import type {
  GZCLPState,
  GZCLPDay,
  DayImportData,
  ImportResult,
  ImportedExercise,
} from '@/types/state'
import { INITIAL_T3_SCHEDULE } from '@/lib/constants'

describe('Per-Day T3 Types', () => {
  describe('t3Schedule type', () => {
    it('should allow Record<GZCLPDay, string[]> structure', () => {
      const schedule: Record<GZCLPDay, string[]> = {
        A1: ['exercise-1', 'exercise-2'],
        B1: ['exercise-3'],
        A2: [],
        B2: ['exercise-1'], // Same exercise on multiple days is valid
      }

      expect(schedule.A1).toHaveLength(2)
      expect(schedule.B1).toHaveLength(1)
      expect(schedule.A2).toHaveLength(0)
      expect(schedule.B2).toHaveLength(1)
    })

    it('should be part of GZCLPState', () => {
      // Type assertion - if this compiles, the type is correct
      const partialState: Pick<GZCLPState, 't3Schedule'> = {
        t3Schedule: {
          A1: [],
          B1: [],
          A2: [],
          B2: [],
        },
      }

      expect(partialState.t3Schedule).toBeDefined()
    })
  })

  describe('DayImportData type', () => {
    it('should have correct structure with day, t1, t2, and t3s', () => {
      const mockExercise: ImportedExercise = {
        templateId: 'template-1',
        name: 'Squat',
        detectedWeight: 100,
        detectedStage: 0,
        stageConfidence: 'high',
        originalSetCount: 5,
        originalRepScheme: '5x3',
      }

      const dayData: DayImportData = {
        day: 'A1',
        t1: mockExercise,
        t2: null,
        t3s: [],
      }

      expect(dayData.day).toBe('A1')
      expect(dayData.t1).toEqual(mockExercise)
      expect(dayData.t2).toBeNull()
      expect(dayData.t3s).toEqual([])
    })

    it('should allow multiple T3 exercises', () => {
      const t3Exercise: ImportedExercise = {
        templateId: 'template-t3',
        name: 'Lat Pulldown',
        detectedWeight: 50,
        detectedStage: 0,
        stageConfidence: 'high',
        originalSetCount: 3,
        originalRepScheme: '3x15',
        role: 't3',
      }

      const dayData: DayImportData = {
        day: 'B1',
        t1: null,
        t2: null,
        t3s: [t3Exercise, { ...t3Exercise, name: 'Bicep Curl' }],
      }

      expect(dayData.t3s).toHaveLength(2)
    })
  })

  describe('ImportResult restructured type', () => {
    it('should have byDay property instead of exercises array', () => {
      const emptyDayData: DayImportData = {
        day: 'A1',
        t1: null,
        t2: null,
        t3s: [],
      }

      const result: ImportResult = {
        byDay: {
          A1: { ...emptyDayData, day: 'A1' },
          B1: { ...emptyDayData, day: 'B1' },
          A2: { ...emptyDayData, day: 'A2' },
          B2: { ...emptyDayData, day: 'B2' },
        },
        warnings: [],
        routineIds: {
          A1: 'routine-1',
          B1: 'routine-2',
          A2: 'routine-3',
          B2: 'routine-4',
        },
      }

      expect(result.byDay).toBeDefined()
      expect(result.byDay.A1.day).toBe('A1')
      expect(result.warnings).toEqual([])
      expect(result.routineIds.A1).toBe('routine-1')
    })
  })

  describe('INITIAL_T3_SCHEDULE constant', () => {
    it('should have empty arrays for all days', () => {
      expect(INITIAL_T3_SCHEDULE).toEqual({
        A1: [],
        B1: [],
        A2: [],
        B2: [],
      })
    })

    it('should be assignable to t3Schedule type', () => {
      const state: Pick<GZCLPState, 't3Schedule'> = {
        t3Schedule: INITIAL_T3_SCHEDULE,
      }

      expect(state.t3Schedule).toBe(INITIAL_T3_SCHEDULE)
    })
  })
})
