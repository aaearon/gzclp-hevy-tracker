/**
 * useProgram Hook Tests
 *
 * Tests for the useProgram hook, specifically the setT3Schedule method.
 *
 * Phase 4: Hooks - TDD tests written before implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProgram } from '@/hooks/useProgram'
import { STORAGE_KEYS } from '@/lib/constants'

describe('useProgram', () => {
  beforeEach(() => {
    // Clear all split storage keys before each test
    localStorage.removeItem(STORAGE_KEYS.CONFIG)
    localStorage.removeItem(STORAGE_KEYS.PROGRESSION)
    localStorage.removeItem(STORAGE_KEYS.HISTORY)
  })

  afterEach(() => {
    // Clean up after each test
    localStorage.removeItem(STORAGE_KEYS.CONFIG)
    localStorage.removeItem(STORAGE_KEYS.PROGRESSION)
    localStorage.removeItem(STORAGE_KEYS.HISTORY)
  })

  describe('setT3Schedule', () => {
    it('updates t3Schedule in state', () => {
      const { result } = renderHook(() => useProgram())

      const newSchedule = {
        A1: ['ex-1', 'ex-2'],
        B1: ['ex-3'],
        A2: [],
        B2: ['ex-4'],
      }

      act(() => {
        result.current.setT3Schedule(newSchedule)
      })

      expect(result.current.state.t3Schedule).toEqual(newSchedule)
    })

    it('persists t3Schedule to localStorage', () => {
      const { result } = renderHook(() => useProgram())

      const newSchedule = {
        A1: ['lat-pulldown'],
        B1: [],
        A2: ['cable-row'],
        B2: [],
      }

      act(() => {
        result.current.setT3Schedule(newSchedule)
      })

      // Verify it was persisted to config storage (t3Schedule is part of config)
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || '{}')
      expect(stored.t3Schedule).toEqual(newSchedule)
    })

    it('allows empty arrays for days with no T3s', () => {
      const { result } = renderHook(() => useProgram())

      const emptySchedule = {
        A1: [],
        B1: [],
        A2: [],
        B2: [],
      }

      act(() => {
        result.current.setT3Schedule(emptySchedule)
      })

      expect(result.current.state.t3Schedule).toEqual(emptySchedule)
    })

    it('preserves other state fields when updating t3Schedule', () => {
      const { result } = renderHook(() => useProgram())

      // Set some other state first
      act(() => {
        result.current.setApiKey('test-api-key')
        result.current.setCurrentDay('B1')
      })

      act(() => {
        result.current.setT3Schedule({
          A1: ['ex-1'],
          B1: [],
          A2: [],
          B2: [],
        })
      })

      // Other state should be preserved
      expect(result.current.state.apiKey).toBe('test-api-key')
      expect(result.current.state.program.currentDay).toBe('B1')
    })

    it('can update t3Schedule multiple times', () => {
      const { result } = renderHook(() => useProgram())

      act(() => {
        result.current.setT3Schedule({
          A1: ['ex-1'],
          B1: [],
          A2: [],
          B2: [],
        })
      })

      expect(result.current.state.t3Schedule.A1).toEqual(['ex-1'])

      act(() => {
        result.current.setT3Schedule({
          A1: ['ex-1', 'ex-2'],
          B1: ['ex-3'],
          A2: [],
          B2: [],
        })
      })

      expect(result.current.state.t3Schedule.A1).toEqual(['ex-1', 'ex-2'])
      expect(result.current.state.t3Schedule.B1).toEqual(['ex-3'])
    })
  })

  describe('initial t3Schedule state', () => {
    it('initializes t3Schedule with empty arrays for all days', () => {
      const { result } = renderHook(() => useProgram())

      expect(result.current.state.t3Schedule).toEqual({
        A1: [],
        B1: [],
        A2: [],
        B2: [],
      })
    })
  })
})
