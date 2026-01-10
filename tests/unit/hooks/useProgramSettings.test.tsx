/**
 * useProgramSettings Hook Tests
 *
 * Tests for the domain-specific hook that manages program configuration settings.
 * All operations are config-only (no cross-domain coordination).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProgramSettings } from '@/hooks/useProgramSettings'
import type { UseConfigStorageResult } from '@/hooks/useConfigStorage'
import type { ConfigState } from '@/types/storage'

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

describe('useProgramSettings', () => {
  describe('setApiKey', () => {
    it('should forward to configStorage.setApiKey', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      act(() => {
        result.current.setApiKey('test-api-key')
      })

      expect(mockConfigStorage.setApiKey).toHaveBeenCalledWith('test-api-key')
    })
  })

  describe('setWeightUnit', () => {
    it('should forward to configStorage.setWeightUnit', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      act(() => {
        result.current.setWeightUnit('lbs')
      })

      expect(mockConfigStorage.setWeightUnit).toHaveBeenCalledWith('lbs')
    })
  })

  describe('setHevyRoutineId', () => {
    it('should forward single routine ID to configStorage', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      act(() => {
        result.current.setHevyRoutineId('A1', 'routine-123')
      })

      expect(mockConfigStorage.setHevyRoutineIds).toHaveBeenCalledWith({
        A1: 'routine-123',
      })
    })
  })

  describe('setHevyRoutineIds', () => {
    it('should forward multiple routine IDs to configStorage', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      act(() => {
        result.current.setHevyRoutineIds({
          A1: 'routine-1',
          B1: 'routine-2',
        })
      })

      expect(mockConfigStorage.setHevyRoutineIds).toHaveBeenCalledWith({
        A1: 'routine-1',
        B1: 'routine-2',
      })
    })
  })

  describe('setRoutineIds', () => {
    it('should forward RoutineAssignment to configStorage', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      act(() => {
        result.current.setRoutineIds({
          A1: 'routine-1',
          B1: 'routine-2',
          A2: 'routine-3',
          B2: 'routine-4',
        })
      })

      expect(mockConfigStorage.setHevyRoutineIds).toHaveBeenCalledWith({
        A1: 'routine-1',
        B1: 'routine-2',
        A2: 'routine-3',
        B2: 'routine-4',
      })
    })
  })

  describe('setCurrentDay', () => {
    it('should forward to configStorage.setCurrentDay', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      act(() => {
        result.current.setCurrentDay('B2')
      })

      expect(mockConfigStorage.setCurrentDay).toHaveBeenCalledWith('B2')
    })
  })

  describe('setProgramCreatedAt', () => {
    it('should forward to configStorage.setProgramCreatedAt', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      act(() => {
        result.current.setProgramCreatedAt('2024-06-15T00:00:00Z')
      })

      expect(mockConfigStorage.setProgramCreatedAt).toHaveBeenCalledWith(
        '2024-06-15T00:00:00Z'
      )
    })
  })

  describe('setWorkoutsPerWeek', () => {
    it('should forward to configStorage.setWorkoutsPerWeek', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      act(() => {
        result.current.setWorkoutsPerWeek(4)
      })

      expect(mockConfigStorage.setWorkoutsPerWeek).toHaveBeenCalledWith(4)
    })
  })

  describe('setT3Schedule', () => {
    it('should forward to configStorage.setT3Schedule', () => {
      const mockConfigStorage = createMockConfigStorage()

      const { result } = renderHook(() =>
        useProgramSettings({ configStorage: mockConfigStorage })
      )

      const newSchedule = {
        A1: ['curls', 'rows'],
        B1: ['lat-pulldown'],
        A2: [],
        B2: ['tricep-extensions'],
      }

      act(() => {
        result.current.setT3Schedule(newSchedule)
      })

      expect(mockConfigStorage.setT3Schedule).toHaveBeenCalledWith(newSchedule)
    })
  })
})
