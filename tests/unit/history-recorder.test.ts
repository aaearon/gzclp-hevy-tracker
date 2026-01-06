/**
 * History Recorder Tests
 *
 * Tests for recording progression history from pending changes.
 */

import { describe, it, expect } from 'vitest'
import { recordProgressionHistory, createHistoryEntryFromChange } from '@/lib/history-recorder'
import type { PendingChange, ExerciseConfig, ExerciseHistory } from '@/types/state'

describe('History Recorder', () => {
  const mockExercises: Record<string, ExerciseConfig> = {
    'ex-squat': {
      id: 'ex-squat',
      hevyTemplateId: 'hevy-squat',
      name: 'Barbell Back Squat',
      role: 'squat',
    },
    'ex-bench': {
      id: 'ex-bench',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press',
      role: 'bench',
    },
    'ex-lat-pulldown': {
      id: 'ex-lat-pulldown',
      hevyTemplateId: 'hevy-lat',
      name: 'Lat Pulldown',
      role: 't3',
    },
  }

  const createMockChange = (overrides: Partial<PendingChange> = {}): PendingChange => ({
    id: 'change-1',
    exerciseId: 'ex-squat',
    exerciseName: 'Barbell Back Squat (T1)',
    tier: 'T1',
    type: 'progress',
    progressionKey: 'squat-T1',
    currentWeight: 100,
    currentStage: 0,
    newWeight: 105,
    newStage: 0,
    newScheme: '5x3+',
    reason: 'Hit all 5x3+',
    workoutId: 'workout-1',
    workoutDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T11:00:00Z',
    success: true,
    amrapReps: 5,
    ...overrides,
  })

  describe('createHistoryEntryFromChange', () => {
    it('creates a history entry from a pending change', () => {
      const change = createMockChange()

      const entry = createHistoryEntryFromChange(change)

      expect(entry).toEqual({
        date: '2024-01-15T10:00:00Z',
        workoutId: 'workout-1',
        weight: 100,
        stage: 0,
        tier: 'T1',
        success: true,
        amrapReps: 5,
        changeType: 'progress',
      })
    })

    it('handles stage_change type', () => {
      const change = createMockChange({
        type: 'stage_change',
        newStage: 1,
        success: false,
      })

      const entry = createHistoryEntryFromChange(change)

      expect(entry.changeType).toBe('stage_change')
      expect(entry.success).toBe(false)
    })

    it('handles deload type', () => {
      const change = createMockChange({
        type: 'deload',
        currentStage: 2,
        newStage: 0,
        newWeight: 85,
        success: false,
      })

      const entry = createHistoryEntryFromChange(change)

      expect(entry.changeType).toBe('deload')
      expect(entry.stage).toBe(2)
    })

    it('handles missing amrapReps', () => {
      const change = createMockChange({
        tier: 'T2',
        amrapReps: undefined,
      })

      const entry = createHistoryEntryFromChange(change)

      expect(entry.amrapReps).toBeUndefined()
    })
  })

  describe('recordProgressionHistory', () => {
    it('adds entry to existing history for known progressionKey', () => {
      const existingHistory: Record<string, ExerciseHistory> = {
        'squat-T1': {
          progressionKey: 'squat-T1',
          exerciseName: 'Barbell Back Squat',
          tier: 'T1',
          role: 'squat',
          entries: [
            {
              date: '2024-01-08T10:00:00Z',
              workoutId: 'workout-0',
              weight: 95,
              stage: 0,
              tier: 'T1',
              success: true,
              amrapReps: 4,
              changeType: 'progress',
            },
          ],
        },
      }

      const change = createMockChange()

      const result = recordProgressionHistory(existingHistory, change, mockExercises)

      expect(result['squat-T1'].entries).toHaveLength(2)
      expect(result['squat-T1'].entries[1].weight).toBe(100)
      expect(result['squat-T1'].entries[1].workoutId).toBe('workout-1')
    })

    it('creates new history for new progressionKey', () => {
      const existingHistory: Record<string, ExerciseHistory> = {}

      const change = createMockChange()

      const result = recordProgressionHistory(existingHistory, change, mockExercises)

      expect(result['squat-T1']).toBeDefined()
      expect(result['squat-T1'].progressionKey).toBe('squat-T1')
      expect(result['squat-T1'].exerciseName).toBe('Barbell Back Squat')
      expect(result['squat-T1'].tier).toBe('T1')
      expect(result['squat-T1'].role).toBe('squat')
      expect(result['squat-T1'].entries).toHaveLength(1)
    })

    it('does not duplicate entries for same workoutId', () => {
      const existingHistory: Record<string, ExerciseHistory> = {
        'squat-T1': {
          progressionKey: 'squat-T1',
          exerciseName: 'Barbell Back Squat',
          tier: 'T1',
          role: 'squat',
          entries: [
            {
              date: '2024-01-15T10:00:00Z',
              workoutId: 'workout-1', // Same as incoming change
              weight: 100,
              stage: 0,
              tier: 'T1',
              success: true,
              changeType: 'progress',
            },
          ],
        },
      }

      const change = createMockChange() // workoutId: 'workout-1'

      const result = recordProgressionHistory(existingHistory, change, mockExercises)

      expect(result['squat-T1'].entries).toHaveLength(1) // Still 1, not duplicated
    })

    it('sorts entries by date', () => {
      const existingHistory: Record<string, ExerciseHistory> = {
        'squat-T1': {
          progressionKey: 'squat-T1',
          exerciseName: 'Barbell Back Squat',
          tier: 'T1',
          entries: [
            {
              date: '2024-01-22T10:00:00Z', // Later date
              workoutId: 'workout-3',
              weight: 110,
              stage: 0,
              tier: 'T1',
              success: true,
              changeType: 'progress',
            },
          ],
        },
      }

      const change = createMockChange({
        workoutId: 'workout-1',
        workoutDate: '2024-01-15T10:00:00Z', // Earlier date
      })

      const result = recordProgressionHistory(existingHistory, change, mockExercises)

      // Should be sorted chronologically
      expect(result['squat-T1'].entries[0].workoutId).toBe('workout-1')
      expect(result['squat-T1'].entries[1].workoutId).toBe('workout-3')
    })

    it('handles T3 exercises with exerciseId as progressionKey', () => {
      const existingHistory: Record<string, ExerciseHistory> = {}

      const change = createMockChange({
        exerciseId: 'ex-lat-pulldown',
        exerciseName: 'Lat Pulldown',
        tier: 'T3',
        progressionKey: 'ex-lat-pulldown', // T3 uses exerciseId
        currentWeight: 40,
        newWeight: 42.5,
      })

      const result = recordProgressionHistory(existingHistory, change, mockExercises)

      expect(result['ex-lat-pulldown']).toBeDefined()
      expect(result['ex-lat-pulldown'].tier).toBe('T3')
      expect(result['ex-lat-pulldown'].role).toBe('t3')
    })

    it('preserves other progressionKeys when adding new entry', () => {
      const existingHistory: Record<string, ExerciseHistory> = {
        'bench-T1': {
          progressionKey: 'bench-T1',
          exerciseName: 'Bench Press',
          tier: 'T1',
          entries: [{ date: '2024-01-14', workoutId: 'w0', weight: 60, stage: 0, tier: 'T1', success: true, changeType: 'progress' }],
        },
      }

      const change = createMockChange() // squat-T1

      const result = recordProgressionHistory(existingHistory, change, mockExercises)

      expect(result['bench-T1']).toEqual(existingHistory['bench-T1'])
      expect(result['squat-T1']).toBeDefined()
    })

    it('uses exercise name from change when exercise not found in config', () => {
      const existingHistory: Record<string, ExerciseHistory> = {}

      const change = createMockChange({
        exerciseId: 'unknown-exercise',
        exerciseName: 'Mystery Exercise (T1)',
        progressionKey: 'mystery-T1',
      })

      const result = recordProgressionHistory(existingHistory, change, {})

      expect(result['mystery-T1'].exerciseName).toBe('Mystery Exercise (T1)')
    })
  })

  describe('recordProgressionHistory - batch recording', () => {
    it('records multiple changes in sequence', () => {
      let history: Record<string, ExerciseHistory> = {}

      const changes: PendingChange[] = [
        createMockChange({ workoutId: 'w1', workoutDate: '2024-01-08', currentWeight: 95 }),
        createMockChange({ workoutId: 'w2', workoutDate: '2024-01-15', currentWeight: 100 }),
        createMockChange({
          workoutId: 'w3',
          workoutDate: '2024-01-22',
          currentWeight: 105,
          progressionKey: 'bench-T1',
          exerciseId: 'ex-bench',
          exerciseName: 'Bench Press (T1)',
        }),
      ]

      for (const change of changes) {
        history = recordProgressionHistory(history, change, mockExercises)
      }

      expect(history['squat-T1'].entries).toHaveLength(2)
      expect(history['bench-T1'].entries).toHaveLength(1)
    })
  })
})
