/**
 * Storage Error Handling Tests
 *
 * Tests for useLocalStorage hook's error handling:
 * - QuotaExceededError handling
 * - Corruption detection
 * - Error callbacks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

describe('useLocalStorage error handling', () => {
  // Store original localStorage methods
  const originalSetItem = localStorage.setItem.bind(localStorage)
  const originalGetItem = localStorage.getItem.bind(localStorage)
  const originalRemoveItem = localStorage.removeItem.bind(localStorage)

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    // Restore original methods before each test
    vi.spyOn(localStorage, 'setItem').mockImplementation(originalSetItem)
    vi.spyOn(localStorage, 'getItem').mockImplementation(originalGetItem)
    vi.spyOn(localStorage, 'removeItem').mockImplementation(originalRemoveItem)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('corruption detection', () => {
    it('should detect JSON parse errors and return initialValue', () => {
      // Store invalid JSON directly (bypass mock)
      originalSetItem.call(localStorage, 'test_key', 'not valid json {{{')

      const onError = vi.fn()
      const onCorruption = vi.fn()

      const { result } = renderHook(() =>
        useLocalStorage('test_key', { default: 'value' }, { onError, onCorruption })
      )

      // Should return initial value
      expect(result.current[0]).toEqual({ default: 'value' })
    })

    it('should detect schema validation failures and return initialValue', () => {
      // Store valid JSON that doesn't match schema
      originalSetItem.call(localStorage, 'test_key', JSON.stringify({ wrong: 'schema' }))

      const validator = (value: unknown): value is { expected: string } => {
        return (
          typeof value === 'object' &&
          value !== null &&
          'expected' in value &&
          typeof (value as Record<string, unknown>).expected === 'string'
        )
      }

      const onError = vi.fn()

      const { result } = renderHook(() =>
        useLocalStorage('test_key', { expected: 'default' }, { validator, onError })
      )

      // Should return initial value since validation failed
      expect(result.current[0]).toEqual({ expected: 'default' })
    })

    it('should return initialValue when localStorage has invalid data', () => {
      originalSetItem.call(localStorage, 'test_key', '{"invalid": true}')

      const validator = (value: unknown): value is { valid: boolean } => {
        return (
          typeof value === 'object' &&
          value !== null &&
          'valid' in value &&
          typeof (value as Record<string, unknown>).valid === 'boolean'
        )
      }

      const { result } = renderHook(() =>
        useLocalStorage('test_key', { valid: false }, { validator })
      )

      expect(result.current[0]).toEqual({ valid: false })
    })
  })

  describe('write failures', () => {
    it('should not update state when localStorage.setItem throws', () => {
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useLocalStorage('test_key', 'initial', { onError })
      )

      expect(result.current[0]).toBe('initial')

      // Mock setItem to throw AFTER initial render
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const error = new DOMException('Storage quota exceeded', 'QuotaExceededError')
        throw error
      })

      // Try to update - should fail
      act(() => {
        result.current[1]('should not be stored')
      })

      // State should remain unchanged
      expect(result.current[0]).toBe('initial')
    })

    it('should call onError with quota_exceeded type for QuotaExceededError', () => {
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useLocalStorage('test_key', 'initial', { onError })
      )

      // Mock setItem to throw QuotaExceededError
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const error = new DOMException('Storage quota exceeded', 'QuotaExceededError')
        throw error
      })

      // Try to update
      act(() => {
        result.current[1]('new value')
      })

      // Should have called onError with quota_exceeded
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quota_exceeded',
          key: 'test_key',
        })
      )
    })

    it('should call onError with write_failed type for other errors', () => {
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useLocalStorage('test_key', 'initial', { onError })
      )

      // Mock setItem to throw generic error
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Generic storage error')
      })

      // Try to update
      act(() => {
        result.current[1]('new value')
      })

      // Should have called onError with write_failed
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'write_failed',
          key: 'test_key',
        })
      )
    })
  })

  describe('successful operations', () => {
    it('should update state and localStorage on successful write', () => {
      const { result } = renderHook(() => useLocalStorage('test_key', 'initial'))

      act(() => {
        result.current[1]('updated')
      })

      expect(result.current[0]).toBe('updated')
      expect(originalGetItem.call(localStorage, 'test_key')).toBe('"updated"')
    })

    it('should read valid data from localStorage', () => {
      originalSetItem.call(localStorage, 'test_key', JSON.stringify({ valid: true }))

      const validator = (value: unknown): value is { valid: boolean } => {
        return (
          typeof value === 'object' &&
          value !== null &&
          'valid' in value &&
          typeof (value as Record<string, unknown>).valid === 'boolean'
        )
      }

      const { result } = renderHook(() =>
        useLocalStorage('test_key', { valid: false }, { validator })
      )

      expect(result.current[0]).toEqual({ valid: true })
    })

    it('should support functional updates', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0))

      act(() => {
        result.current[1]((prev) => prev + 1)
      })

      expect(result.current[0]).toBe(1)

      act(() => {
        result.current[1]((prev) => prev + 10)
      })

      expect(result.current[0]).toBe(11)
    })
  })

  describe('removeValue', () => {
    it('should remove value from localStorage and reset state', () => {
      originalSetItem.call(localStorage, 'test_key', '"stored value"')

      const { result } = renderHook(() => useLocalStorage('test_key', 'initial'))

      expect(result.current[0]).toBe('stored value')

      act(() => {
        result.current[2]() // removeValue
      })

      expect(result.current[0]).toBe('initial')
      expect(originalGetItem.call(localStorage, 'test_key')).toBeNull()
    })
  })
})
