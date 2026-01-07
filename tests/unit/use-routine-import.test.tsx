/**
 * useRoutineImport Hook Tests
 *
 * Tests for the useRoutineImport hook including per-day import data storage
 * and day-specific exercise update methods.
 *
 * Phase 4: Hooks - TDD tests written before implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRoutineImport } from '@/hooks/useRoutineImport'
import {
  createGZCLPA1Routine,
  createGZCLPB1Routine,
  createRoutineWithUniqueT3s,
} from '../helpers/routine-mocks'
import type { Routine, Workout } from '@/types/hevy'

// Mock fetchWorkouts that returns empty array (no workout history)
const mockFetchWorkouts = (): Promise<Workout[]> => Promise.resolve([])

describe('useRoutineImport', () => {
  let mockRoutines: Routine[]
  let a1Routine: Routine
  let b1Routine: Routine

  beforeEach(() => {
    a1Routine = createGZCLPA1Routine()
    b1Routine = createGZCLPB1Routine()
    mockRoutines = [a1Routine, b1Routine]
  })

  describe('per-day import data storage', () => {
    it('stores importResult with byDay structure after extract()', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
        result.current.setAssignment('B1', b1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      expect(result.current.importResult).not.toBeNull()
      expect(result.current.importResult?.byDay).toBeDefined()
      expect(result.current.importResult?.byDay.A1).toBeDefined()
      expect(result.current.importResult?.byDay.B1).toBeDefined()
      expect(result.current.importResult?.byDay.A2).toBeDefined()
      expect(result.current.importResult?.byDay.B2).toBeDefined()
    })

    it('each day has t1, t2, t3s fields populated correctly', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      const a1Data = result.current.importResult?.byDay.A1
      expect(a1Data?.t1).not.toBeNull()
      expect(a1Data?.t1?.name).toBe('Squat')
      expect(a1Data?.t2).not.toBeNull()
      expect(a1Data?.t2?.name).toBe('Bench Press')
      expect(Array.isArray(a1Data?.t3s)).toBe(true)
      expect(a1Data?.t3s.length).toBeGreaterThan(0)
    })

    it('unassigned days have null t1/t2 and empty t3s', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      // B2 is not assigned
      const b2Data = result.current.importResult?.byDay.B2
      expect(b2Data?.t1).toBeNull()
      expect(b2Data?.t2).toBeNull()
      expect(b2Data?.t3s).toEqual([])
    })
  })

  describe('updateDayExercise', () => {
    it('updates T1 exercise weight for specific day', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      act(() => {
        result.current.updateDayExercise('A1', 'T1', { userWeight: 100 })
      })

      expect(result.current.importResult?.byDay.A1.t1?.userWeight).toBe(100)
    })

    it('updates T2 exercise stage for specific day', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      act(() => {
        result.current.updateDayExercise('A1', 'T2', { userStage: 1 })
      })

      expect(result.current.importResult?.byDay.A1.t2?.userStage).toBe(1)
    })

    it('updates only the specified day, not other days', async () => {
      const a1 = createRoutineWithUniqueT3s('A1', ['A1 Lat Pulldown'])
      const b1 = createRoutineWithUniqueT3s('B1', ['B1 Leg Press'])
      const routines = [a1, b1]

      const { result } = renderHook(() => useRoutineImport(routines))

      act(() => {
        result.current.setAssignment('A1', a1.id)
        result.current.setAssignment('B1', b1.id)
      })

      await act(async () => {
        await result.current.extract(routines, mockFetchWorkouts)
      })

      const originalB1T1Weight = result.current.importResult?.byDay.B1.t1?.detectedWeight

      act(() => {
        result.current.updateDayExercise('A1', 'T1', { userWeight: 150 })
      })

      // A1 should be updated
      expect(result.current.importResult?.byDay.A1.t1?.userWeight).toBe(150)
      // B1 should remain unchanged
      expect(result.current.importResult?.byDay.B1.t1?.userWeight).toBeUndefined()
      expect(result.current.importResult?.byDay.B1.t1?.detectedWeight).toBe(originalB1T1Weight)
    })

    it('does nothing when importResult is null', () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      // No extract() called, so importResult is null
      act(() => {
        result.current.updateDayExercise('A1', 'T1', { userWeight: 100 })
      })

      expect(result.current.importResult).toBeNull()
    })

    it('does nothing when day has no T1/T2', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      // B2 is not assigned, so it has no T1
      act(() => {
        result.current.updateDayExercise('B2', 'T1', { userWeight: 100 })
      })

      expect(result.current.importResult?.byDay.B2.t1).toBeNull()
    })
  })

  describe('updateDayT3', () => {
    it('updates T3 at index for specific day', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      act(() => {
        result.current.updateDayT3('A1', 0, { userWeight: 25 })
      })

      expect(result.current.importResult?.byDay.A1.t3s[0].userWeight).toBe(25)
    })

    it('updates only the specified T3, not others', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      const t3Count = result.current.importResult?.byDay.A1.t3s.length ?? 0
      expect(t3Count).toBeGreaterThan(1)

      act(() => {
        result.current.updateDayT3('A1', 0, { userWeight: 30 })
      })

      // First T3 should be updated
      expect(result.current.importResult?.byDay.A1.t3s[0].userWeight).toBe(30)
      // Second T3 should remain unchanged
      expect(result.current.importResult?.byDay.A1.t3s[1].userWeight).toBeUndefined()
    })

    it('does nothing when index is out of bounds', async () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.setAssignment('A1', a1Routine.id)
      })

      await act(async () => {
        await result.current.extract(mockRoutines, mockFetchWorkouts)
      })

      const t3CountBefore = result.current.importResult?.byDay.A1.t3s.length

      act(() => {
        result.current.updateDayT3('A1', 99, { userWeight: 100 })
      })

      // T3s should remain unchanged
      expect(result.current.importResult?.byDay.A1.t3s.length).toBe(t3CountBefore)
    })

    it('does nothing when importResult is null', () => {
      const { result } = renderHook(() => useRoutineImport(mockRoutines))

      act(() => {
        result.current.updateDayT3('A1', 0, { userWeight: 100 })
      })

      expect(result.current.importResult).toBeNull()
    })
  })
})
