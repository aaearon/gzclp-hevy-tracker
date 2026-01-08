/**
 * ProgramContext Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  ProgramProvider,
  useProgramContext,
  useProgramContextOptional,
  useWeightUnit,
  useCurrentDay,
  useExercise,
  useProgressionByKey,
  useCurrentDayT3s,
} from '@/contexts/ProgramContext'
import {
  resetIdCounter,
  createMainLiftConfig,
  createT3Config,
  createProgressionState,
} from '../helpers/state-generator'
import type { ExerciseConfig, ProgressionState, GZCLPDay } from '@/types/state'

// Test wrapper for the provider
function createWrapper(overrides: Partial<{
  weightUnit: 'kg' | 'lbs'
  exercises: Record<string, ExerciseConfig>
  progression: Record<string, ProgressionState>
  t3Schedule: Record<GZCLPDay, string[]>
  currentDay: GZCLPDay
  increments: { upper: number; lower: number }
}> = {}) {
  const defaultExercises: Record<string, ExerciseConfig> = {}
  const defaultProgression: Record<string, ProgressionState> = {}
  const defaultT3Schedule: Record<GZCLPDay, string[]> = { A1: [], B1: [], A2: [], B2: [] }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ProgramProvider
        weightUnit={overrides.weightUnit ?? 'kg'}
        exercises={overrides.exercises ?? defaultExercises}
        progression={overrides.progression ?? defaultProgression}
        t3Schedule={overrides.t3Schedule ?? defaultT3Schedule}
        currentDay={overrides.currentDay ?? 'A1'}
        increments={overrides.increments ?? { upper: 2.5, lower: 5 }}
      >
        {children}
      </ProgramProvider>
    )
  }
}

describe('ProgramContext', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('useProgramContext', () => {
    it('provides all context values', () => {
      const squat = createMainLiftConfig('squat', { id: 'squat-1' })
      const exercises = { [squat.id]: squat }
      const progression = {
        'squat-T1': createProgressionState({ exerciseId: squat.id, currentWeight: 100 }),
      }

      const { result } = renderHook(() => useProgramContext(), {
        wrapper: createWrapper({
          exercises,
          progression,
          currentDay: 'B2',
          weightUnit: 'lbs',
        }),
      })

      expect(result.current.weightUnit).toBe('lbs')
      expect(result.current.currentDay).toBe('B2')
      expect(result.current.exercises['squat-1']).toBeDefined()
      expect(result.current.progression['squat-T1'].currentWeight).toBe(100)
    })

    it('throws when used outside provider', () => {
      expect(() => {
        renderHook(() => useProgramContext())
      }).toThrow('useProgramContext must be used within a ProgramProvider')
    })
  })

  describe('useProgramContextOptional', () => {
    it('returns null when used outside provider', () => {
      const { result } = renderHook(() => useProgramContextOptional())
      expect(result.current).toBeNull()
    })

    it('returns context when inside provider', () => {
      const { result } = renderHook(() => useProgramContextOptional(), {
        wrapper: createWrapper(),
      })
      expect(result.current).not.toBeNull()
      expect(result.current?.weightUnit).toBe('kg')
    })
  })

  describe('useWeightUnit', () => {
    it('returns kg by default', () => {
      const { result } = renderHook(() => useWeightUnit(), {
        wrapper: createWrapper(),
      })
      expect(result.current).toBe('kg')
    })

    it('returns lbs when configured', () => {
      const { result } = renderHook(() => useWeightUnit(), {
        wrapper: createWrapper({ weightUnit: 'lbs' }),
      })
      expect(result.current).toBe('lbs')
    })
  })

  describe('useCurrentDay', () => {
    it('returns A1 by default', () => {
      const { result } = renderHook(() => useCurrentDay(), {
        wrapper: createWrapper(),
      })
      expect(result.current).toBe('A1')
    })

    it('returns configured day', () => {
      const { result } = renderHook(() => useCurrentDay(), {
        wrapper: createWrapper({ currentDay: 'B1' }),
      })
      expect(result.current).toBe('B1')
    })
  })

  describe('useExercise', () => {
    it('returns exercise by ID', () => {
      const squat = createMainLiftConfig('squat', { id: 'squat-1' })
      const { result } = renderHook(() => useExercise('squat-1'), {
        wrapper: createWrapper({ exercises: { [squat.id]: squat } }),
      })
      expect(result.current?.name).toBe('Squat')
      expect(result.current?.role).toBe('squat')
    })

    it('returns undefined for unknown ID', () => {
      const { result } = renderHook(() => useExercise('unknown'), {
        wrapper: createWrapper(),
      })
      expect(result.current).toBeUndefined()
    })
  })

  describe('useProgressionByKey', () => {
    it('returns progression for key', () => {
      const progression = {
        'squat-T1': createProgressionState({ currentWeight: 100 }),
      }
      const { result } = renderHook(() => useProgressionByKey('squat-T1'), {
        wrapper: createWrapper({ progression }),
      })
      expect(result.current?.currentWeight).toBe(100)
    })

    it('returns undefined for unknown key', () => {
      const { result } = renderHook(() => useProgressionByKey('unknown'), {
        wrapper: createWrapper(),
      })
      expect(result.current).toBeUndefined()
    })
  })

  describe('useCurrentDayT3s', () => {
    it('returns T3 exercise IDs for current day', () => {
      const t3_1 = createT3Config({ id: 't3-1' })
      const t3_2 = createT3Config({ id: 't3-2' })
      const t3Schedule: Record<GZCLPDay, string[]> = {
        A1: ['t3-1', 't3-2'],
        B1: ['t3-3'],
        A2: [],
        B2: ['t3-4'],
      }

      const { result } = renderHook(() => useCurrentDayT3s(), {
        wrapper: createWrapper({
          currentDay: 'A1',
          t3Schedule,
          exercises: { [t3_1.id]: t3_1, [t3_2.id]: t3_2 },
        }),
      })

      expect(result.current).toEqual(['t3-1', 't3-2'])
    })

    it('returns empty array for day with no T3s', () => {
      const t3Schedule: Record<GZCLPDay, string[]> = {
        A1: [],
        B1: [],
        A2: [],
        B2: [],
      }

      const { result } = renderHook(() => useCurrentDayT3s(), {
        wrapper: createWrapper({ t3Schedule }),
      })

      expect(result.current).toEqual([])
    })
  })

  describe('ProgramProvider', () => {
    it('passes increments to context', () => {
      const { result } = renderHook(() => useProgramContext(), {
        wrapper: createWrapper({ increments: { upper: 5, lower: 10 } }),
      })
      expect(result.current.increments).toEqual({ upper: 5, lower: 10 })
    })
  })
})
