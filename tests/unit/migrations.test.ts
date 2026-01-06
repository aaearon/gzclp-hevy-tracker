/**
 * Migration Tests
 *
 * Tests for state version migrations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { migrateState, needsMigration } from '@/lib/migrations'
import { CURRENT_STATE_VERSION } from '@/lib/constants'

describe('State Migrations', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('needsMigration', () => {
    it('returns false for current version', () => {
      const state = { version: CURRENT_STATE_VERSION }
      expect(needsMigration(state)).toBe(false)
    })

    it('returns true for older version', () => {
      const state = { version: '2.0.0' }
      expect(needsMigration(state)).toBe(true)
    })

    it('returns true for state without version', () => {
      const state = { apiKey: 'test' }
      expect(needsMigration(state)).toBe(true)
    })

    it('returns false for null/undefined state', () => {
      expect(needsMigration(null)).toBe(false)
      expect(needsMigration(undefined)).toBe(false)
    })
  })

  describe('v2.1.0 migration (progressionHistory)', () => {
    it('adds progressionHistory to v2.0.0 state', () => {
      const oldState = {
        version: '2.0.0',
        apiKey: 'test-key',
        program: { name: 'Test' },
        exercises: { ex1: { id: 'ex1', name: 'Squat' } },
        progression: { 'squat-T1': { currentWeight: 100 } },
        pendingChanges: [],
        settings: { weightUnit: 'kg' },
        lastSync: null,
        t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        totalWorkouts: 10,
        mostRecentWorkoutDate: '2024-01-01',
      }

      const result = migrateState(oldState)

      expect(result.version).toBe(CURRENT_STATE_VERSION)
      expect(result.progressionHistory).toEqual({})
      // Ensure existing fields are preserved
      expect(result.apiKey).toBe('test-key')
      expect(result.exercises).toEqual(oldState.exercises)
      expect(result.progression).toEqual(oldState.progression)
      expect(result.totalWorkouts).toBe(10)
    })

    it('preserves existing progressionHistory if present', () => {
      const existingHistory = {
        'squat-T1': {
          progressionKey: 'squat-T1',
          exerciseName: 'Squat',
          tier: 'T1' as const,
          entries: [
            {
              date: '2024-01-01',
              workoutId: 'w1',
              weight: 100,
              stage: 0 as const,
              tier: 'T1' as const,
              success: true,
              changeType: 'progress' as const,
            },
          ],
        },
      }

      const oldState = {
        version: '2.0.0',
        apiKey: 'test-key',
        program: { name: 'Test' },
        exercises: {},
        progression: {},
        pendingChanges: [],
        settings: { weightUnit: 'kg' },
        lastSync: null,
        t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        totalWorkouts: 0,
        mostRecentWorkoutDate: null,
        progressionHistory: existingHistory, // Already has history somehow
      }

      const result = migrateState(oldState)

      expect(result.progressionHistory).toEqual(existingHistory)
    })

    it('handles migration from v1.0.0 through v2.1.0', () => {
      // v1.0.0 state - should go through v2.0.0 (fresh state) then v2.1.0
      const v1State = {
        version: '1.0.0',
        apiKey: 'old-key',
        exercises: { old: { id: 'old', name: 'Old Exercise' } },
      }

      const result = migrateState(v1State)

      // v2.0.0 migration creates fresh state, then v2.1.0 adds progressionHistory
      expect(result.version).toBe(CURRENT_STATE_VERSION)
      expect(result.progressionHistory).toEqual({})
      // Fresh state from v2.0.0 migration
      expect(result.apiKey).toBe('')
      expect(result.exercises).toEqual({})
    })
  })

  describe('migrateState edge cases', () => {
    it('returns state as-is if already at current version', () => {
      const currentState = {
        version: CURRENT_STATE_VERSION,
        apiKey: 'test',
        progressionHistory: { 'squat-T1': { entries: [] } },
      }

      const result = migrateState(currentState)

      expect(result).toEqual(currentState)
    })

    it('warns and returns state if version is newer than current', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const futureState = {
        version: '99.0.0',
        apiKey: 'future',
        futureProp: 'value',
      }

      const result = migrateState(futureState)

      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(result).toEqual(futureState)

      consoleWarnSpy.mockRestore()
    })

    it('throws for invalid state', () => {
      expect(() => migrateState(null)).toThrow('Invalid state')
      expect(() => migrateState('not an object')).toThrow('Invalid state')
    })
  })
})
