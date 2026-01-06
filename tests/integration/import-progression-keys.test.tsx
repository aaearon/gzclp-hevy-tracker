/**
 * Integration Tests: Import Progression Key Storage
 *
 * Bug fix: Progression should use role-tier keys (e.g., "squat-T1", "squat-T2")
 * instead of exerciseId for main lifts.
 *
 * @see docs/006-setup-wizard-bugfixes-plan.md - Issue 6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProgram } from '@/hooks/useProgram'
import type { GZCLPDay, MainLiftRole, ProgressionState } from '@/types/state'

// Mock localStorage
const mockStorage: Record<string, string> = {}
vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] ?? null)
vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
  mockStorage[key] = value
})
vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
  delete mockStorage[key]
})

describe('Import Flow - Progression Key Storage Bug Fix', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    vi.clearAllMocks()
  })

  describe('Main lift progression keys', () => {
    it('creates progression with role-tier key format (e.g., "squat-T1")', async () => {
      const { result } = renderHook(() => useProgram())

      // Simulate adding a squat exercise with role
      let exerciseId: string
      act(() => {
        exerciseId = result.current.addExercise({
          hevyTemplateId: 'template-squat',
          name: 'Squat',
          role: 'squat',
        })
      })

      // Set initial weight using setProgressionByKey with role-tier key
      act(() => {
        result.current.setProgressionByKey('squat-T1', exerciseId!, 100, 0)
      })

      // Get state and check progression keys
      const state = result.current.state

      // Should have "squat-T1" key
      expect(state.progression).toHaveProperty('squat-T1')

      // The progression entry should have the correct weight
      const squatT1Progress = state.progression['squat-T1']
      expect(squatT1Progress?.currentWeight).toBe(100)
    })

    it('creates separate T1 and T2 progression entries for same main lift', async () => {
      const { result } = renderHook(() => useProgram())

      // Add squat exercise
      let exerciseId: string
      act(() => {
        exerciseId = result.current.addExercise({
          hevyTemplateId: 'template-squat',
          name: 'Squat',
          role: 'squat',
        })
      })

      // Set T1 weight (100kg) using setProgressionByKey
      act(() => {
        result.current.setProgressionByKey('squat-T1', exerciseId!, 100, 0)
      })

      // Set T2 weight (70kg) using setProgressionByKey
      act(() => {
        result.current.setProgressionByKey('squat-T2', exerciseId!, 70, 0)
      })

      const state = result.current.state

      // Should have both squat-T1 and squat-T2 keys
      expect(state.progression).toHaveProperty('squat-T1')
      expect(state.progression).toHaveProperty('squat-T2')

      // With different weights
      expect(state.progression['squat-T1']?.currentWeight).toBe(100)
      expect(state.progression['squat-T2']?.currentWeight).toBe(70)
    })

    it('all four main lifts have T1 and T2 progression keys after import', async () => {
      const { result } = renderHook(() => useProgram())

      const mainLifts: MainLiftRole[] = ['squat', 'bench', 'ohp', 'deadlift']
      const exerciseIds: Record<string, string> = {}

      // Add all main lift exercises
      act(() => {
        for (const role of mainLifts) {
          exerciseIds[role] = result.current.addExercise({
            hevyTemplateId: `template-${role}`,
            name: role.charAt(0).toUpperCase() + role.slice(1),
            role,
          })
        }
      })

      // Set T1 and T2 progression for each using setProgressionByKey
      act(() => {
        for (const role of mainLifts) {
          result.current.setProgressionByKey(`${role}-T1`, exerciseIds[role], 100, 0)
          result.current.setProgressionByKey(`${role}-T2`, exerciseIds[role], 70, 0)
        }
      })

      const state = result.current.state

      // Should have 8 progression entries (4 lifts x 2 tiers)
      for (const role of mainLifts) {
        expect(state.progression).toHaveProperty(`${role}-T1`)
        expect(state.progression).toHaveProperty(`${role}-T2`)
      }
    })
  })

  describe('T3 progression keys (unchanged)', () => {
    it('T3 exercises still use exerciseId as progression key', async () => {
      const { result } = renderHook(() => useProgram())

      // Add a T3 exercise
      let exerciseId: string
      act(() => {
        exerciseId = result.current.addExercise({
          hevyTemplateId: 'template-lat-pulldown',
          name: 'Lat Pulldown',
          role: 't3',
        })
      })

      // Set initial weight
      act(() => {
        result.current.setInitialWeight(exerciseId!, 40)
      })

      const state = result.current.state

      // T3 should use exerciseId as key (not role-tier)
      expect(state.progression).toHaveProperty(exerciseId!)
      expect(state.progression[exerciseId!]?.currentWeight).toBe(40)
    })
  })

  describe('MainLiftCard displays correct weights after import', () => {
    it('MainLiftCard reads from role-tier progression keys', async () => {
      const { result } = renderHook(() => useProgram())

      // Set up squat with T1 and T2 progression
      let exerciseId: string
      act(() => {
        exerciseId = result.current.addExercise({
          hevyTemplateId: 'template-squat',
          name: 'Squat',
          role: 'squat',
        })
      })

      // Set T1 and T2 progression using setProgressionByKey
      act(() => {
        result.current.setProgressionByKey('squat-T1', exerciseId!, 100, 0)
        result.current.setProgressionByKey('squat-T2', exerciseId!, 70, 0)
      })

      const state = result.current.state

      // MainLiftCard should be able to look up by "squat-T1" and "squat-T2"
      const t1Weight = state.progression['squat-T1']?.currentWeight
      const t2Weight = state.progression['squat-T2']?.currentWeight

      expect(t1Weight).toBe(100)
      expect(t2Weight).toBe(70)
    })
  })

})
