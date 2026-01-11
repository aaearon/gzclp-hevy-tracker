/**
 * useLocalStorage Hook
 *
 * Persist state to localStorage with lazy initialization,
 * JSON safety, cross-tab synchronization, and same-tab synchronization.
 *
 * Features:
 * - Write-before-state: Only updates React state after successful disk write
 * - Error callbacks: Reports quota exceeded, write failures, and corruption
 * - Corruption detection: Captures raw data for recovery on parse/validation failure
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { StorageError, StorageErrorType } from '@/types/storage'
import { checkStorageStatus } from '@/lib/storage-monitor'

type SetValue<T> = T | ((prevValue: T) => T)

/**
 * Custom event name for same-tab localStorage synchronization.
 * The native 'storage' event only fires for OTHER tabs.
 */
const LOCAL_STORAGE_SYNC_EVENT = 'localStorageSync'

/** Threshold for pre-write quota check (1KB) */
const LARGE_WRITE_THRESHOLD = 1024

interface LocalStorageSyncDetail {
  key: string
  newValue: string | null
}

/**
 * Callback invoked when a storage error occurs.
 */
type StorageErrorCallback = (error: Omit<StorageError, 'timestamp'>) => void

/**
 * Callback invoked when data corruption is detected.
 * Receives the raw corrupted data string for recovery.
 */
type CorruptionCallback = (key: string, rawData: string) => void

/**
 * Options for useLocalStorage hook.
 */
interface UseLocalStorageOptions<T> {
  /**
   * Optional validator function to verify parsed data matches expected schema.
   * If validation fails, initialValue is returned and onError/onCorruption are called.
   */
  validator?: (value: unknown) => value is T

  /**
   * Callback invoked when storage errors occur.
   * Use this to report errors to a central error handler or UI.
   */
  onError?: StorageErrorCallback

  /**
   * Callback invoked when data corruption is detected.
   * Receives the raw corrupted string for backup/recovery.
   */
  onCorruption?: CorruptionCallback

  /**
   * Whether to check storage quota before large writes.
   * Default: true
   */
  checkQuota?: boolean
}

/**
 * Create an error object for storage errors.
 */
function createStorageError(
  type: StorageErrorType,
  key: string,
  message: string,
  originalError?: unknown,
  rawData?: string
): Omit<StorageError, 'timestamp'> {
  const error: Omit<StorageError, 'timestamp'> = { type, key, message }
  if (originalError !== undefined) {
    error.originalError = originalError
  }
  if (rawData !== undefined) {
    error.rawData = rawData
  }
  return error
}

/**
 * Check if an error is a QuotaExceededError.
 */
function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED') // Firefox
  )
}

/**
 * Read and parse localStorage value.
 * Returns { value, rawData } where value is the parsed value and rawData is the raw string on error.
 */
function readLocalStorage<T>(
  key: string,
  initialValue: T,
  validator?: (value: unknown) => value is T
): { value: T; error?: Omit<StorageError, 'timestamp'>; rawData?: string } {
  if (typeof window === 'undefined') {
    return { value: initialValue }
  }

  try {
    const item = window.localStorage.getItem(key)
    if (item === null) {
      return { value: initialValue }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(item)
    } catch (parseError) {
      // JSON parse failed - data is corrupted
      return {
        value: initialValue,
        error: createStorageError(
          'corruption',
          key,
          `Failed to parse JSON for key "${key}"`,
          parseError,
          item
        ),
        rawData: item,
      }
    }

    // Validate parsed data if validator provided
    if (validator && !validator(parsed)) {
      // Schema validation failed - data is corrupted/outdated
      return {
        value: initialValue,
        error: createStorageError(
          'corruption',
          key,
          `Schema validation failed for key "${key}"`,
          undefined,
          item
        ),
        rawData: item,
      }
    }

    return { value: parsed as T }
  } catch (error) {
    // Unexpected error during read
    return {
      value: initialValue,
      error: createStorageError(
        'unavailable',
        key,
        `Error reading localStorage key "${key}"`,
        error
      ),
    }
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): [T, (value: SetValue<T>) => void, () => void] {
  // Lazy initialization - only read localStorage once on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    const result = readLocalStorage(key, initialValue, options?.validator)

    // Report errors after mount via effect (can't call callbacks during useState init)
    return result.value
  })

  // Track current value for use in setValue without stale closure
  const storedValueRef = useRef<T>(storedValue)

  // Keep ref in sync with state
  useEffect(() => {
    storedValueRef.current = storedValue
  }, [storedValue])

  // Report any initialization errors after mount
  const hasReportedInitError = useRef(false)
  useEffect(() => {
    if (hasReportedInitError.current) return
    hasReportedInitError.current = true

    const result = readLocalStorage(key, initialValue, options?.validator)
    if (result.error) {
      options?.onError?.(result.error)
      if (result.rawData) {
        options?.onCorruption?.(key, result.rawData)
      }
    }
  }, [key, initialValue, options])

  // Update localStorage when value changes
  // CRITICAL: Write to disk FIRST, then update state
  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === 'undefined') {
        return
      }

      try {
        // 1. Resolve new value from current state (using ref to avoid stale closure)
        const valueToStore =
          value instanceof Function ? value(storedValueRef.current) : value
        const serialized = JSON.stringify(valueToStore)

        // 2. Optional: Check quota for large writes to prevent QuotaExceededError
        if (options?.checkQuota !== false && serialized.length > LARGE_WRITE_THRESHOLD) {
          const status = checkStorageStatus()
          if (status.isWarning) {
            options?.onError?.(
              createStorageError(
                'write_blocked',
                key,
                `Storage quota warning (${String(status.percentUsed)}% used). Write blocked to prevent data loss.`
              )
            )
            return // Don't attempt write - state remains unchanged
          }
        }

        // 3. Write to disk FIRST
        window.localStorage.setItem(key, serialized)

        // 4. Update React state only after successful write
        storedValueRef.current = valueToStore
        setStoredValue(valueToStore)

        // 5. Notify other hook instances in the same tab
        queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent<LocalStorageSyncDetail>(LOCAL_STORAGE_SYNC_EVENT, {
              detail: { key, newValue: serialized },
            })
          )
        })
      } catch (error) {
        // Write failed - state NOT updated, UI remains consistent with storage
        if (isQuotaExceededError(error)) {
          options?.onError?.(
            createStorageError(
              'quota_exceeded',
              key,
              `Storage quota exceeded when writing "${key}". Please clear old data.`,
              error
            )
          )
        } else {
          options?.onError?.(
            createStorageError(
              'write_failed',
              key,
              `Failed to write localStorage key "${key}"`,
              error
            )
          )
        }
      }
    },
    [key, options]
  )

  // Remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        storedValueRef.current = initialValue
        setStoredValue(initialValue)

        // Notify other hook instances
        queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent<LocalStorageSyncDetail>(LOCAL_STORAGE_SYNC_EVENT, {
              detail: { key, newValue: null },
            })
          )
        })
      }
    } catch (error) {
      options?.onError?.(
        createStorageError(
          'write_failed',
          key,
          `Failed to remove localStorage key "${key}"`,
          error
        )
      )
    }
  }, [key, initialValue, options])

  // Cross-tab synchronization via storage event
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key || event.storageArea !== window.localStorage) {
        return
      }

      try {
        if (event.newValue === null) {
          storedValueRef.current = initialValue
          setStoredValue(initialValue)
        } else {
          const parsed: unknown = JSON.parse(event.newValue)
          // Validate cross-tab data if validator provided
          if (options?.validator && !options.validator(parsed)) {
            console.warn(
              `Invalid cross-tab data for localStorage key "${key}". Schema validation failed.`
            )
            return
          }
          storedValueRef.current = parsed as T
          setStoredValue(parsed as T)
        }
      } catch (error) {
        console.warn(`Error parsing storage event for key "${key}":`, error)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, initialValue, options])

  // Same-tab synchronization via custom event
  // This handles updates from other hook instances in the same tab
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleLocalSync = (event: Event) => {
      const customEvent = event as CustomEvent<LocalStorageSyncDetail>
      if (customEvent.detail.key !== key) {
        return
      }

      try {
        if (customEvent.detail.newValue === null) {
          storedValueRef.current = initialValue
          setStoredValue(initialValue)
        } else {
          const parsed: unknown = JSON.parse(customEvent.detail.newValue)
          // Validate same-tab sync data if validator provided
          if (options?.validator && !options.validator(parsed)) {
            console.warn(
              `Invalid same-tab sync data for localStorage key "${key}". Schema validation failed.`
            )
            return
          }
          storedValueRef.current = parsed as T
          setStoredValue(parsed as T)
        }
      } catch (error) {
        console.warn(`Error parsing local sync event for key "${key}":`, error)
      }
    }

    window.addEventListener(LOCAL_STORAGE_SYNC_EVENT, handleLocalSync)

    return () => {
      window.removeEventListener(LOCAL_STORAGE_SYNC_EVENT, handleLocalSync)
    }
  }, [key, initialValue, options])

  return [storedValue, setValue, removeValue]
}
