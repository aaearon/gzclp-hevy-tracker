/**
 * useLocalStorage Hook
 *
 * Persist state to localStorage with lazy initialization,
 * JSON safety, and cross-tab synchronization.
 */

import { useState, useEffect, useCallback } from 'react'

type SetValue<T> = T | ((prevValue: T) => T)

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // Lazy initialization - only read localStorage once on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        // DEBUG: Log when no data found
        if (key === 'gzclp_state') {
          console.log('[DEBUG localStorage] No existing state found, using initial')
        }
        return initialValue
      }
      const parsed = JSON.parse(item) as T
      // DEBUG: Log read state
      if (key === 'gzclp_state') {
        const state = parsed as { exercises?: Record<string, unknown> }
        console.log('[DEBUG localStorage] Read state with', Object.keys(state.exercises ?? {}).length, 'exercises')
      }
      return parsed
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

          // DEBUG: Log localStorage writes
          if (key === 'gzclp_state') {
            const state = valueToStore as { exercises?: Record<string, unknown> }
            console.log('[DEBUG localStorage] Writing state with', Object.keys(state.exercises ?? {}).length, 'exercises')
          }

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))

            // Dispatch storage event for cross-tab sync
            window.dispatchEvent(
              new StorageEvent('storage', {
                key,
                newValue: JSON.stringify(valueToStore),
                storageArea: window.localStorage,
              })
            )
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

        // Dispatch storage event for cross-tab sync
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: null,
            storageArea: window.localStorage,
          })
        )
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
          setStoredValue(JSON.parse(event.newValue) as T)
        }
      } catch (error) {
        console.warn(`Error parsing storage event for key "${key}":`, error)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}
