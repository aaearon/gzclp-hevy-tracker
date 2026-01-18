/**
 * useExerciseManagement Hook Tests
 *
 * Tests for the domain-specific hook that manages exercise CRUD operations
 * with cross-domain coordination (config + progression storage).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExerciseManagement } from '@/hooks/useExerciseManagement'
import type { UseConfigStorageResult } from '@/hooks/useConfigStorage'
import type { UseProgressionStorageResult } from '@/hooks/useProgressionStorage'
import type { ExerciseConfig, ProgressionState } from '@/types/state'
import type { ConfigState, ProgressionStore } from '@/types/storage'

// Helper to create mock config storage
function createMockConfigStorage(
  overrides: Partial<UseConfigStorageResult> = {}
): UseConfigStorageResult {
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
    ...overrides,
  }
}

// Helper to create mock progression storage
function createMockProgressionStorage(
  overrides: Partial<UseProgressionStorageResult> = {}
): UseProgressionStorageResult {
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
    ...overrides,
  }
}

describe('useExerciseManagement', () => {
  describe('addExercise', () => {
    it('should add exercise to config storage', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        result.current.addExercise({
          hevyTemplateId: 'template-1',
          name: 'Back Squat',
          role: 'squat',
        })
      })

      expect(mockConfigStorage.addExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          hevyTemplateId: 'template-1',
          name: 'Back Squat',
          role: 'squat',
          id: expect.any(String),
        })
      )
    })

    it('should add initial progression entry to progression storage', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      let exerciseId = ''
      act(() => {
        exerciseId = result.current.addExercise({
          hevyTemplateId: 'template-1',
          name: 'Back Squat',
          role: 'squat',
        })
      })

      // Verify progression was set with the correct structure
      expect(mockProgressionStorage.setProgression).toHaveBeenCalledTimes(1)
      const progressionArg = mockProgressionStorage.setProgression.mock.calls[0][0]
      expect(progressionArg[exerciseId]).toEqual({
        exerciseId,
        currentWeight: 0,
        stage: 0,
        baseWeight: 0,
        amrapRecord: 0,
        amrapRecordDate: null,
        amrapRecordWorkoutId: null,
      })
    })

    it('should return the generated exercise ID', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      let exerciseId = ''
      act(() => {
        exerciseId = result.current.addExercise({
          hevyTemplateId: 'template-1',
          name: 'Back Squat',
          role: 'squat',
        })
      })

      expect(exerciseId).toBeTruthy()
      expect(typeof exerciseId).toBe('string')
    })

    it('should coordinate updates to both storages atomically', () => {
      const mockConfigStorage = createMockConfigStorage()
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        result.current.addExercise({
          hevyTemplateId: 'template-1',
          name: 'Back Squat',
        })
      })

      // Both storages should be updated
      expect(mockConfigStorage.addExercise).toHaveBeenCalledTimes(1)
      expect(mockProgressionStorage.setProgression).toHaveBeenCalledTimes(1)

      // The exercise ID should match in both calls
      const configCall = mockConfigStorage.addExercise.mock.calls[0][0] as ExerciseConfig
      const progressionCall = mockProgressionStorage.setProgression.mock.calls[0][0] as Record<string, ProgressionState>
      const progressionKeys = Object.keys(progressionCall)

      expect(progressionKeys).toContain(configCall.id)
    })
  })

  describe('updateExercise', () => {
    it('should update exercise in config storage only', () => {
      // Create mock with an existing exercise
      const mockConfigStorage = createMockConfigStorage({
        config: {
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
          exercises: {
            'exercise-1': {
              id: 'exercise-1',
              hevyTemplateId: 'template-1',
              name: 'Back Squat',
              role: 'squat',
            },
          },
          t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        },
      })
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        result.current.updateExercise('exercise-1', { name: 'Updated Name' })
      })

      expect(mockConfigStorage.updateExercise).toHaveBeenCalledWith('exercise-1', {
        name: 'Updated Name',
      })
      // Progression storage should NOT be touched for name-only updates
      expect(mockProgressionStorage.removeProgression).not.toHaveBeenCalled()
      expect(mockProgressionStorage.setProgressionByKey).not.toHaveBeenCalled()
    })

    it('should allow updating exercise role and handle progression cleanup', () => {
      // Create mock with an existing squat exercise
      const mockConfigStorage = createMockConfigStorage({
        config: {
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
          exercises: {
            'exercise-1': {
              id: 'exercise-1',
              hevyTemplateId: 'template-1',
              name: 'Back Squat',
              role: 'squat',
            },
          },
          t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        },
      })
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        result.current.updateExercise('exercise-1', { role: 'bench' })
      })

      expect(mockConfigStorage.updateExercise).toHaveBeenCalledWith('exercise-1', {
        role: 'bench',
      })
      // Role change should clean up old progression keys and create new ones
      expect(mockProgressionStorage.removeProgression).toHaveBeenCalledWith('squat-T1')
      expect(mockProgressionStorage.removeProgression).toHaveBeenCalledWith('squat-T2')
      expect(mockProgressionStorage.setProgressionByKey).toHaveBeenCalledWith('bench-T1', 'exercise-1', 0, 0)
      expect(mockProgressionStorage.setProgressionByKey).toHaveBeenCalledWith('bench-T2', 'exercise-1', 0, 0)
    })

    it('should not modify progression when updating non-role fields', () => {
      const mockConfigStorage = createMockConfigStorage({
        config: {
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
          exercises: {
            'exercise-1': {
              id: 'exercise-1',
              hevyTemplateId: 'template-1',
              name: 'Back Squat',
              role: 'squat',
            },
          },
          t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        },
      })
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        // Updating role to same value should not trigger cleanup
        result.current.updateExercise('exercise-1', { role: 'squat' })
      })

      // No progression changes when role stays the same
      expect(mockProgressionStorage.removeProgression).not.toHaveBeenCalled()
      expect(mockProgressionStorage.setProgressionByKey).not.toHaveBeenCalled()
    })
  })

  describe('removeExercise', () => {
    it('should remove exercise from config storage', () => {
      const mockConfigStorage = createMockConfigStorage({
        config: {
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
          exercises: {
            'exercise-1': {
              id: 'exercise-1',
              hevyTemplateId: 'template-1',
              name: 'Lat Pulldown',
              role: 't3',
            },
          },
          t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        },
      })
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        result.current.removeExercise('exercise-1')
      })

      expect(mockConfigStorage.removeExercise).toHaveBeenCalledWith('exercise-1')
    })

    it('should remove progression keys for T3 exercise', () => {
      const mockConfigStorage = createMockConfigStorage({
        config: {
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
          exercises: {
            'exercise-1': {
              id: 'exercise-1',
              hevyTemplateId: 'template-1',
              name: 'Lat Pulldown',
              role: 't3',
            },
          },
          t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        },
      })
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        result.current.removeExercise('exercise-1')
      })

      // T3 uses exercise ID as progression key
      expect(mockProgressionStorage.removeProgression).toHaveBeenCalledWith('exercise-1')
    })

    it('should remove progression keys for main lift exercise', () => {
      const mockConfigStorage = createMockConfigStorage({
        config: {
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
          exercises: {
            'exercise-1': {
              id: 'exercise-1',
              hevyTemplateId: 'template-1',
              name: 'Back Squat',
              role: 'squat',
            },
          },
          t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        },
      })
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        result.current.removeExercise('exercise-1')
      })

      // Main lift uses role-based keys (squat-T1, squat-T2)
      expect(mockProgressionStorage.removeProgression).toHaveBeenCalledWith('squat-T1')
      expect(mockProgressionStorage.removeProgression).toHaveBeenCalledWith('squat-T2')
    })

    it('should coordinate removal from both storages', () => {
      const mockConfigStorage = createMockConfigStorage({
        config: {
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
          exercises: {
            'exercise-1': {
              id: 'exercise-1',
              hevyTemplateId: 'template-1',
              name: 'Lat Pulldown',
              role: 't3',
            },
          },
          t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
        },
      })
      const mockProgressionStorage = createMockProgressionStorage()

      const { result } = renderHook(() =>
        useExerciseManagement({
          configStorage: mockConfigStorage,
          progressionStorage: mockProgressionStorage,
        })
      )

      act(() => {
        result.current.removeExercise('exercise-1')
      })

      // Both storages should have removal called
      expect(mockConfigStorage.removeExercise).toHaveBeenCalledTimes(1)
      expect(mockProgressionStorage.removeProgression).toHaveBeenCalledTimes(1)
    })
  })
})
