/**
 * useLocalStorage Hook
 *
 * Persist state to localStorage with lazy initialization,
 * JSON safety, cross-tab synchronization, and same-tab synchronization.
 */

import { useState, useEffect, useCallback } from 'react'

type SetValue<T> = T | ((prevValue: T) => T)

/**
 * Custom event name for same-tab localStorage synchronization.
 * The native 'storage' event only fires for OTHER tabs.
 */
const LOCAL_STORAGE_SYNC_EVENT = 'localStorageSync'

interface LocalStorageSyncDetail {
  key: string
  newValue: string | null
}

/**
 * Options for useLocalStorage hook.
 */
interface UseLocalStorageOptions<T> {
  /**
   * Optional validator function to verify parsed data matches expected schema.
   * If validation fails, initialValue is returned and a warning is logged.
   */
  validator?: (value: unknown) => value is T
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): [T, (value: SetValue<T>) => void, () => void] {
  // Lazy initialization - only read localStorage once on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return initialValue
      }
      const parsed: unknown = JSON.parse(item)

      // Validate parsed data if validator provided
      if (options?.validator) {
        if (!options.validator(parsed)) {
          console.warn(
            `Invalid data in localStorage key "${key}". Schema validation failed. Using default value.`
          )
          return initialValue
        }
      }

      return parsed as T
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value
          const serialized = JSON.stringify(valueToStore)

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, serialized)

            // Defer same-tab sync event to avoid setState during render
            // This notifies other hook instances in the same tab after current render completes
            queueMicrotask(() => {
              window.dispatchEvent(
                new CustomEvent<LocalStorageSyncDetail>(LOCAL_STORAGE_SYNC_EVENT, {
                  detail: { key, newValue: serialized },
                })
              )
            })
          }

          return valueToStore
        })
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key]
  )

  // Remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        setStoredValue(initialValue)

        // Defer same-tab sync event to avoid setState during render
        queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent<LocalStorageSyncDetail>(LOCAL_STORAGE_SYNC_EVENT, {
              detail: { key, newValue: null },
            })
          )
        })
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

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
