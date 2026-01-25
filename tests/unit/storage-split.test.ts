/**
 * Storage Split Tests
 *
 * Tests for the split localStorage storage system types and utilities.
 * Note: Actual localStorage integration is tested via useLocalStorage tests.
 * These tests focus on type definitions and state transformation logic.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  resetIdCounter,
  createConfigState,
  createProgressionStore,
  createHistoryState,
  createMainLiftConfig,
  createProgressionState,
  createExerciseHistory,
  createPendingChange,
  splitState,
  mergeStates,
  createConfiguredState,
} from '../helpers/state-generator'
import { STORAGE_KEYS } from '@/lib/constants'
import type { ConfigState, ProgressionStore, HistoryState } from '@/types/storage'
import {
  isConfigState,
  isProgressionStore,
  isHistoryState,
} from '@/types/storage'

describe('Storage Split', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('STORAGE_KEYS', () => {
    it('defines all required storage keys', () => {
      expect(STORAGE_KEYS.CONFIG).toBe('gzclp_config')
      expect(STORAGE_KEYS.PROGRESSION).toBe('gzclp_progression')
      expect(STORAGE_KEYS.HISTORY).toBe('gzclp_history')
    })

    it('keys are unique', () => {
      const keys = Object.values(STORAGE_KEYS)
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(keys.length)
    })
  })

  describe('ConfigState', () => {
    it('can be created with defaults', () => {
      const config = createConfigState()
      expect(config.apiKey).toBe('')
      expect(config.program).toBeDefined()
      expect(config.settings).toBeDefined()
      expect(config.exercises).toEqual({})
      expect(config.t3Schedule).toBeDefined()
    })

    it('can be created with custom values', () => {
      const exercise = createMainLiftConfig('squat', { id: 'squat-1' })
      const config = createConfigState({
        apiKey: 'test-key',
        exercises: { [exercise.id]: exercise },
      })
      expect(config.apiKey).toBe('test-key')
      expect(config.exercises['squat-1']).toBeDefined()
    })

    it('passes type guard when valid', () => {
      const config = createConfigState()
      expect(isConfigState(config)).toBe(true)
    })

    it('fails type guard when invalid', () => {
      expect(isConfigState(null)).toBe(false)
      expect(isConfigState(undefined)).toBe(false)
      expect(isConfigState({})).toBe(false)
      expect(isConfigState({ apiKey: 'test' })).toBe(false)
    })
  })

  describe('ProgressionStore', () => {
    it('can be created with defaults', () => {
      const store = createProgressionStore()
      expect(store.progression).toEqual({})
      expect(store.pendingChanges).toEqual([])
      expect(store.lastSync).toBeNull()
      expect(store.acknowledgedDiscrepancies).toEqual([])
    })

    it('can be created with custom values', () => {
      const progression = createProgressionState({ exerciseId: 'squat-1', currentWeight: 100 })
      const store = createProgressionStore({
        progression: { 'squat-T1': progression },
        lastSync: '2024-01-01T00:00:00.000Z',
      })
      expect(store.progression['squat-T1'].currentWeight).toBe(100)
      expect(store.lastSync).toBe('2024-01-01T00:00:00.000Z')
    })

    it('passes type guard when valid', () => {
      const store = createProgressionStore()
      expect(isProgressionStore(store)).toBe(true)
    })

    it('fails type guard when invalid', () => {
      expect(isProgressionStore(null)).toBe(false)
      expect(isProgressionStore(undefined)).toBe(false)
      expect(isProgressionStore({})).toBe(false)
    })
  })

  describe('HistoryState', () => {
    it('can be created with defaults', () => {
      const history = createHistoryState()
      expect(history.progressionHistory).toEqual({})
    })

    it('can be created with history entries', () => {
      const exerciseHistory = createExerciseHistory({
        progressionKey: 'squat-T1',
        entryCount: 5,
      })
      const history = createHistoryState({
        progressionHistory: { 'squat-T1': exerciseHistory },
      })
      expect(history.progressionHistory['squat-T1'].entries).toHaveLength(5)
    })

    it('passes type guard when valid', () => {
      const history = createHistoryState()
      expect(isHistoryState(history)).toBe(true)
    })

    it('fails type guard when invalid', () => {
      expect(isHistoryState(null)).toBe(false)
      expect(isHistoryState(undefined)).toBe(false)
      expect(isHistoryState({})).toBe(false)
    })
  })

  describe('State Splitting', () => {
    it('correctly splits monolithic state into three parts', () => {
      const fullState = createConfiguredState({
        withT3Exercises: 2,
        withHistory: true,
        withPendingChanges: 1,
      })

      const { config, progression, history } = splitState(fullState)

      // Config should have exercises and settings
      expect(config.apiKey).toBe(fullState.apiKey)
      expect(config.exercises).toBe(fullState.exercises)
      expect(config.settings).toBe(fullState.settings)
      expect(config.t3Schedule).toBe(fullState.t3Schedule)

      // Progression should have progression data
      expect(progression.progression).toBe(fullState.progression)
      expect(progression.pendingChanges).toBe(fullState.pendingChanges)
      expect(progression.lastSync).toBe(fullState.lastSync)

      // History should have progression history
      expect(history.progressionHistory).toBe(fullState.progressionHistory)
    })

    it('config has no progression or history fields', () => {
      const fullState = createConfiguredState()
      const { config } = splitState(fullState)

      expect((config as unknown as Record<string, unknown>).progression).toBeUndefined()
      expect((config as unknown as Record<string, unknown>).pendingChanges).toBeUndefined()
      expect((config as unknown as Record<string, unknown>).progressionHistory).toBeUndefined()
    })

    it('progression has no config or history fields', () => {
      const fullState = createConfiguredState()
      const { progression } = splitState(fullState)

      expect((progression as unknown as Record<string, unknown>).apiKey).toBeUndefined()
      expect((progression as unknown as Record<string, unknown>).exercises).toBeUndefined()
      expect((progression as unknown as Record<string, unknown>).progressionHistory).toBeUndefined()
    })

    it('history has only progressionHistory', () => {
      const fullState = createConfiguredState({ withHistory: true })
      const { history } = splitState(fullState)

      expect(Object.keys(history)).toEqual(['progressionHistory'])
    })
  })

  describe('State Merging', () => {
    it('correctly merges split states back', () => {
      const fullState = createConfiguredState({
        withT3Exercises: 2,
        withHistory: true,
      })

      const { config, progression, history } = splitState(fullState)
      const merged = mergeStates(config, progression, history)

      expect(merged).toEqual(fullState)
    })

    it('split and merge are inverse operations', () => {
      const original = createConfiguredState({ withT3Exercises: 3, withHistory: true })
      const split = splitState(original)
      const merged = mergeStates(split.config, split.progression, split.history)

      expect(merged).toEqual(original)
    })

    it('merged state has all required fields', () => {
      const config = createConfigState({ apiKey: 'test' })
      const progression = createProgressionStore()
      const history = createHistoryState()

      const merged = mergeStates(config, progression, history)

      // Config fields
      expect(merged.apiKey).toBe('test')
      expect(merged.program).toBeDefined()
      expect(merged.settings).toBeDefined()
      expect(merged.exercises).toBeDefined()
      expect(merged.t3Schedule).toBeDefined()

      // Progression fields
      expect(merged.progression).toBeDefined()
      expect(merged.pendingChanges).toBeDefined()
      expect(merged.lastSync).toBeNull()
      expect(merged.acknowledgedDiscrepancies).toBeDefined()

      // History fields
      expect(merged.progressionHistory).toBeDefined()
    })
  })

  describe('Storage Size Considerations', () => {
    it('history can hold significantly more data than config', () => {
      // Create config with exercises
      const config = createConfigState()
      for (let i = 0; i < 10; i++) {
        config.exercises[`ex-${i}`] = createMainLiftConfig('squat', { id: `ex-${i}` })
      }

      // Create history with many entries per exercise
      const history = createHistoryState()
      for (let i = 0; i < 10; i++) {
        history.progressionHistory[`ex-${i}`] = createExerciseHistory({
          progressionKey: `ex-${i}`,
          entryCount: 100, // 100 workout entries per exercise
        })
      }

      // History should be larger
      const configSize = JSON.stringify(config).length
      const historySize = JSON.stringify(history).length
      expect(historySize).toBeGreaterThan(configSize * 5)
    })

    it('progression store is smaller than history', () => {
      const progression = createProgressionStore()
      for (let i = 0; i < 10; i++) {
        progression.progression[`ex-${i}`] = createProgressionState({ exerciseId: `ex-${i}` })
        progression.pendingChanges.push(createPendingChange())
      }

      const history = createHistoryState()
      for (let i = 0; i < 10; i++) {
        history.progressionHistory[`ex-${i}`] = createExerciseHistory({
          progressionKey: `ex-${i}`,
          entryCount: 50,
        })
      }

      const progressionSize = JSON.stringify(progression).length
      const historySize = JSON.stringify(history).length
      expect(historySize).toBeGreaterThan(progressionSize)
    })
  })

  describe('Cross-Storage Consistency', () => {
    it('exercise IDs in config match keys in progression', () => {
      const fullState = createConfiguredState({ withT3Exercises: 4 })
      const { config, progression } = splitState(fullState)

      // All T3 exercise IDs from config should have progression entries
      const t3ExerciseIds = Object.values(config.exercises)
        .filter((ex) => ex.role === 't3')
        .map((ex) => ex.id)

      for (const id of t3ExerciseIds) {
        expect(progression.progression[id]).toBeDefined()
      }
    })

    it('progression keys in history match those in progression', () => {
      const fullState = createConfiguredState({ withHistory: true })
      const { progression, history } = splitState(fullState)

      // All history keys should have corresponding progression entries
      for (const key of Object.keys(history.progressionHistory)) {
        expect(progression.progression[key]).toBeDefined()
      }
    })
  })
})
