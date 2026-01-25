/**
 * Tests for State Generator Test Utility
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  resetIdCounter,
  generateTestId,
  createProgramConfig,
  createUserSettings,
  createExerciseConfig,
  createMainLiftConfig,
  createT3Config,
  createProgressionState,
  createPendingChange,
  createHistoryEntry,
  createExerciseHistory,
  createAcknowledgedDiscrepancy,
  createGZCLPState,
  createConfiguredState,
  createConfigState,
  createProgressionStore,
  createHistoryState,
  splitState,
  mergeStates,
} from '../helpers/state-generator'
import { CURRENT_STATE_VERSION } from '@/lib/constants'

describe('State Generator', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('generateTestId', () => {
    it('generates unique IDs', () => {
      const id1 = generateTestId()
      const id2 = generateTestId()
      expect(id1).not.toBe(id2)
    })

    it('uses custom prefix', () => {
      const id = generateTestId('custom')
      expect(id).toMatch(/^custom-\d+$/)
    })

    it('resets counter between tests', () => {
      resetIdCounter()
      const id1 = generateTestId('test')
      resetIdCounter()
      const id2 = generateTestId('test')
      expect(id1).toBe(id2)
    })
  })

  describe('createProgramConfig', () => {
    it('creates default program config', () => {
      const config = createProgramConfig()
      expect(config.name).toBe('Test GZCLP Program')
      expect(config.workoutsPerWeek).toBe(3)
      expect(config.currentDay).toBe('A1')
      expect(config.hevyRoutineIds).toEqual({
        A1: null,
        B1: null,
        A2: null,
        B2: null,
      })
    })

    it('accepts custom values', () => {
      const config = createProgramConfig({
        name: 'My Program',
        currentDay: 'B2',
        workoutsPerWeek: 4,
        hevyRoutineIds: { A1: 'routine-1' },
      })
      expect(config.name).toBe('My Program')
      expect(config.currentDay).toBe('B2')
      expect(config.workoutsPerWeek).toBe(4)
      expect(config.hevyRoutineIds.A1).toBe('routine-1')
    })
  })

  describe('createUserSettings', () => {
    it('creates default kg settings', () => {
      const settings = createUserSettings()
      expect(settings.weightUnit).toBe('kg')
      expect(settings.increments).toEqual({ upper: 2.5, lower: 5 })
    })

    it('creates lbs settings with correct defaults', () => {
      const settings = createUserSettings({ weightUnit: 'lbs' })
      expect(settings.weightUnit).toBe('lbs')
      expect(settings.increments).toEqual({ upper: 5, lower: 10 })
    })

    it('accepts custom increments', () => {
      const settings = createUserSettings({
        increments: { upper: 1.25, lower: 2.5 },
      })
      expect(settings.increments).toEqual({ upper: 1.25, lower: 2.5 })
    })
  })

  describe('createExerciseConfig', () => {
    it('creates exercise with generated ID', () => {
      const exercise = createExerciseConfig()
      expect(exercise.id).toMatch(/^exercise-\d+$/)
      expect(exercise.hevyTemplateId).toMatch(/^template-exercise-\d+$/)
    })

    it('accepts custom values', () => {
      const exercise = createExerciseConfig({
        id: 'custom-id',
        name: 'Custom Exercise',
        role: 'squat',
      })
      expect(exercise.id).toBe('custom-id')
      expect(exercise.name).toBe('Custom Exercise')
      expect(exercise.role).toBe('squat')
    })
  })

  describe('createMainLiftConfig', () => {
    it('creates squat config with correct defaults', () => {
      const exercise = createMainLiftConfig('squat')
      expect(exercise.name).toBe('Squat')
      expect(exercise.role).toBe('squat')
    })

    it('creates all main lifts correctly', () => {
      const squat = createMainLiftConfig('squat')
      const bench = createMainLiftConfig('bench')
      const ohp = createMainLiftConfig('ohp')
      const deadlift = createMainLiftConfig('deadlift')

      expect(squat.name).toBe('Squat')
      expect(bench.name).toBe('Bench Press')
      expect(ohp.name).toBe('Overhead Press')
      expect(deadlift.name).toBe('Deadlift')
    })
  })

  describe('createT3Config', () => {
    it('creates T3 config with t3 role', () => {
      const exercise = createT3Config({ name: 'Lat Pulldown' })
      expect(exercise.name).toBe('Lat Pulldown')
      expect(exercise.role).toBe('t3')
    })
  })

  describe('createProgressionState', () => {
    it('creates default progression state', () => {
      const state = createProgressionState()
      expect(state.currentWeight).toBe(60)
      expect(state.stage).toBe(0)
      expect(state.baseWeight).toBe(60)
      expect(state.amrapRecord).toBe(0)
      expect(state.amrapRecordDate).toBeNull()
    })

    it('uses currentWeight as baseWeight default', () => {
      const state = createProgressionState({ currentWeight: 100 })
      expect(state.currentWeight).toBe(100)
      expect(state.baseWeight).toBe(100)
    })
  })

  describe('createPendingChange', () => {
    it('creates default pending change', () => {
      const change = createPendingChange()
      expect(change.tier).toBe('T1')
      expect(change.type).toBe('progress')
      expect(change.currentWeight).toBe(60)
      expect(change.newWeight).toBe(62.5)
    })

    it('accepts custom values', () => {
      const change = createPendingChange({
        tier: 'T2',
        type: 'deload',
        currentWeight: 100,
        newWeight: 85,
      })
      expect(change.tier).toBe('T2')
      expect(change.type).toBe('deload')
      expect(change.currentWeight).toBe(100)
      expect(change.newWeight).toBe(85)
    })
  })

  describe('createHistoryEntry', () => {
    it('creates default history entry', () => {
      const entry = createHistoryEntry()
      expect(entry.weight).toBe(60)
      expect(entry.stage).toBe(0)
      expect(entry.tier).toBe('T1')
      expect(entry.success).toBe(true)
      expect(entry.changeType).toBe('progress')
    })
  })

  describe('createExerciseHistory', () => {
    it('creates empty history by default', () => {
      const history = createExerciseHistory()
      expect(history.entries).toHaveLength(0)
    })

    it('generates entries with entryCount', () => {
      const history = createExerciseHistory({ entryCount: 5 })
      expect(history.entries).toHaveLength(5)
      // Verify weights increase
      expect(history.entries[4].weight).toBeGreaterThan(history.entries[0].weight)
    })
  })

  describe('createGZCLPState', () => {
    it('creates valid empty state', () => {
      const state = createGZCLPState()
      expect(state.version).toBe(CURRENT_STATE_VERSION)
      expect(state.apiKey).toBe('')
      expect(state.exercises).toEqual({})
      expect(state.progression).toEqual({})
      expect(state.pendingChanges).toEqual([])
    })

    it('accepts partial overrides', () => {
      const state = createGZCLPState({
        apiKey: 'test-key',
        lastSync: '2024-01-01T00:00:00.000Z',
      })
      expect(state.apiKey).toBe('test-key')
      expect(state.lastSync).toBe('2024-01-01T00:00:00.000Z')
    })
  })

  describe('createConfiguredState', () => {
    it('creates state with main lifts by default', () => {
      const state = createConfiguredState()
      expect(Object.keys(state.exercises)).toHaveLength(4)
      expect(state.apiKey).toBe('test-api-key')

      // Check progression keys exist for T1 and T2
      expect(state.progression['squat-T1']).toBeDefined()
      expect(state.progression['squat-T2']).toBeDefined()
    })

    it('adds T3 exercises when requested', () => {
      const state = createConfiguredState({ withT3Exercises: 3 })
      expect(Object.keys(state.exercises)).toHaveLength(7) // 4 main + 3 T3
    })

    it('distributes T3s across days', () => {
      const state = createConfiguredState({ withT3Exercises: 4 })
      expect(state.t3Schedule.A1.length).toBeGreaterThan(0)
      expect(state.t3Schedule.B1.length).toBeGreaterThan(0)
      expect(state.t3Schedule.A2.length).toBeGreaterThan(0)
      expect(state.t3Schedule.B2.length).toBeGreaterThan(0)
    })

    it('adds history when requested', () => {
      const state = createConfiguredState({ withHistory: true })
      expect(state.progressionHistory['squat-T1']).toBeDefined()
      expect(state.progressionHistory['squat-T1'].entries.length).toBeGreaterThan(0)
    })

    it('adds pending changes when requested', () => {
      const state = createConfiguredState({ withPendingChanges: 3 })
      expect(state.pendingChanges).toHaveLength(3)
    })
  })

  describe('Split State Types', () => {
    describe('createConfigState', () => {
      it('creates valid config state', () => {
        const config = createConfigState()
        expect(config.version).toBe(CURRENT_STATE_VERSION)
        expect(config.program).toBeDefined()
        expect(config.settings).toBeDefined()
        expect(config.exercises).toEqual({})
        expect(config.t3Schedule).toBeDefined()
      })
    })

    describe('createProgressionStore', () => {
      it('creates valid progression store', () => {
        const store = createProgressionStore()
        expect(store.progression).toEqual({})
        expect(store.pendingChanges).toEqual([])
        expect(store.lastSync).toBeNull()
        expect(store.acknowledgedDiscrepancies).toEqual([])
      })
    })

    describe('createHistoryState', () => {
      it('creates valid history state', () => {
        const history = createHistoryState()
        expect(history.progressionHistory).toEqual({})
      })
    })

    describe('splitState', () => {
      it('correctly splits monolithic state', () => {
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
    })

    describe('mergeStates', () => {
      it('correctly merges split states', () => {
        const fullState = createConfiguredState({
          withT3Exercises: 2,
          withHistory: true,
        })

        const { config, progression, history } = splitState(fullState)
        const merged = mergeStates(config, progression, history)

        expect(merged).toEqual(fullState)
      })

      it('split and merge are inverse operations', () => {
        const original = createConfiguredState({ withT3Exercises: 3 })
        const split = splitState(original)
        const merged = mergeStates(split.config, split.progression, split.history)

        expect(merged).toEqual(original)
      })
    })
  })
})
