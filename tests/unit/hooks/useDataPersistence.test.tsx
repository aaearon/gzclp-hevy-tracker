/**
 * useDataPersistence Hook Tests
 *
 * Tests for the domain-specific hook that manages full state reset and import.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataPersistence } from '@/hooks/useDataPersistence'
import type { UseConfigStorageResult } from '@/hooks/useConfigStorage'
import type { UseProgressionStorageResult } from '@/hooks/useProgressionStorage'
import type { UseHistoryStorageResult } from '@/hooks/useHistoryStorage'
import type { ConfigState, ProgressionStore, HistoryState } from '@/types/storage'
import type { GZCLPState } from '@/types/state'

// Helper to create mock config storage
function createMockConfigStorage(): UseConfigStorageResult {
  const defaultConfig: ConfigState = {
    version: '1.0.0',
    apiKey: '',
    program: {
      name: 'Test Program',
      createdAt: '2024-01-01T00:00:00Z',
      hevyRoutineIds: { A1: null, B1: null, A2: null, B2: null },
      currentDay: 'A1',
      workoutsPerWeek: 3,
    },
    settings: {
      weightUnit: 'kg',
      increments: { upper: 2.5, lower: 5 },
      restTimers: { t1: 180, t2: 120, t3: 60 },
    },
    exercises: {},
    t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
  }

  return {
    config: defaultConfig,
    setApiKey: vi.fn(),
    setWeightUnit: vi.fn(),
    setSettings: vi.fn(),
    setExercises: vi.fn(),
    addExercise: vi.fn(),
    updateExercise: vi.fn(),
    removeExercise: vi.fn(),
    setProgram: vi.fn(),
    setCurrentDay: vi.fn(),
    setHevyRoutineIds: vi.fn(),
    setProgramCreatedAt: vi.fn(),
    setWorkoutsPerWeek: vi.fn(),
    setT3Schedule: vi.fn(),
    resetConfig: vi.fn(),
    importConfig: vi.fn(),
  }
}

// Helper to create mock progression storage
function createMockProgressionStorage(): UseProgressionStorageResult {
  const defaultStore: ProgressionStore = {
    progression: {},
    pendingChanges: [],
    lastSync: null,
    totalWorkouts: 0,
    mostRecentWorkoutDate: null,
    acknowledgedDiscrepancies: [],
    needsPush: false,
  }

  return {
    store: defaultStore,
    setProgression: vi.fn(),
    updateProgression: vi.fn(),
    setProgressionByKey: vi.fn(),
    removeProgression: vi.fn(),
    setPendingChanges: vi.fn(),
    addPendingChange: vi.fn(),
    removePendingChange: vi.fn(),
    clearPendingChanges: vi.fn(),
    setLastSync: vi.fn(),
    setTotalWorkouts: vi.fn(),
    setMostRecentWorkoutDate: vi.fn(),
    setNeedsPush: vi.fn(),
    acknowledgeDiscrepancy: vi.fn(),
    clearAcknowledgedDiscrepancies: vi.fn(),
    resetProgression: vi.fn(),
    importProgression: vi.fn(),
  }
}

// Helper to create mock history storage
function createMockHistoryStorage(): UseHistoryStorageResult {
  const defaultHistory: HistoryState = {
    progressionHistory: {},
  }

  return {
    history: defaultHistory,
    setProgressionHistory: vi.fn(),
    recordHistoryEntry: vi.fn(),
    resetHistory: vi.fn(),
    importHistory: vi.fn(),
  }
}

// Sample GZCLPState for testing import
const sampleState: GZCLPState = {
  version: '2.0.0',
  apiKey: 'test-api-key',
  program: {
    name: 'Imported Program',
    createdAt: '2024-06-01T00:00:00Z',
    hevyRoutineIds: { A1: 'r1', B1: 'r2', A2: 'r3', B2: 'r4' },
    currentDay: 'B1',
    workoutsPerWeek: 4,
  },
  settings: {
    weightUnit: 'lbs',
    increments: { upper: 5, lower: 10 },
    restTimers: { t1: 200, t2: 150, t3: 90 },
  },
  exercises: {
    'ex-1': { id: 'ex-1', hevyTemplateId: 'h1', name: 'Squat', role: 'squat' },
  },
  t3Schedule: { A1: ['t3-1'], B1: [], A2: [], B2: [] },
  progression: {
    'ex-1': {
      exerciseId: 'ex-1',
      currentWeight: 150,
      stage: 1,
      baseWeight: 140,
      lastWorkoutId: 'w1',
      lastWorkoutDate: '2024-06-15',
      amrapRecord: 8,
    },
  },
  pendingChanges: [],
  lastSync: '2024-06-15T10:00:00Z',
  totalWorkouts: 20,
  mostRecentWorkoutDate: '2024-06-15',
  acknowledgedDiscrepancies: [],
  needsPush: false,
  progressionHistory: {
    'squat-T1': { exerciseName: 'Squat', entries: [] },
  },
}

describe('useDataPersistence', () => {
  describe('resetState', () => {
    it('should reset all three storage domains', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()
      const mockHistoryStorage = createMockHistoryStorage()

      const { result } = renderHook(() =>
        useDataPersistence({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
          historyStorage: mockHistoryStorage,
        })
      )

      act(() => {
        result.current.resetState()
      })

      expect(mockConfigStorage.resetConfig).toHaveBeenCalledTimes(1)
      expect(mockProgressionStorage.resetProgression).toHaveBeenCalledTimes(1)
      expect(mockHistoryStorage.resetHistory).toHaveBeenCalledTimes(1)
    })
  })

  describe('importState', () => {
    it('should import config into config storage', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()
      const mockHistoryStorage = createMockHistoryStorage()

      const { result } = renderHook(() =>
        useDataPersistence({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
          historyStorage: mockHistoryStorage,
        })
      )

      act(() => {
        result.current.importState(sampleState)
      })

      expect(mockConfigStorage.importConfig).toHaveBeenCalledWith({
        version: sampleState.version,
        apiKey: sampleState.apiKey,
        program: sampleState.program,
        settings: sampleState.settings,
        exercises: sampleState.exercises,
        t3Schedule: sampleState.t3Schedule,
      })
    })

    it('should import progression into progression storage', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()
      const mockHistoryStorage = createMockHistoryStorage()

      const { result } = renderHook(() =>
        useDataPersistence({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
          historyStorage: mockHistoryStorage,
        })
      )

      act(() => {
        result.current.importState(sampleState)
      })

      expect(mockProgressionStorage.importProgression).toHaveBeenCalledWith({
        progression: sampleState.progression,
        pendingChanges: sampleState.pendingChanges,
        lastSync: sampleState.lastSync,
        totalWorkouts: sampleState.totalWorkouts,
        mostRecentWorkoutDate: sampleState.mostRecentWorkoutDate,
        acknowledgedDiscrepancies: sampleState.acknowledgedDiscrepancies,
        needsPush: sampleState.needsPush,
      })
    })

    it('should import history into history storage', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()
      const mockHistoryStorage = createMockHistoryStorage()

      const { result } = renderHook(() =>
        useDataPersistence({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
          historyStorage: mockHistoryStorage,
        })
      )

      act(() => {
        result.current.importState(sampleState)
      })

      expect(mockHistoryStorage.importHistory).toHaveBeenCalledWith({
        progressionHistory: sampleState.progressionHistory,
      })
    })

    it('should import into all three storage domains', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()
      const mockHistoryStorage = createMockHistoryStorage()

      const { result } = renderHook(() =>
        useDataPersistence({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
          historyStorage: mockHistoryStorage,
        })
      )

      act(() => {
        result.current.importState(sampleState)
      })

      expect(mockConfigStorage.importConfig).toHaveBeenCalledTimes(1)
      expect(mockProgressionStorage.importProgression).toHaveBeenCalledTimes(1)
      expect(mockHistoryStorage.importHistory).toHaveBeenCalledTimes(1)
    })
  })
})
