/**
 * Storage Error Context
 *
 * Provides centralized storage error handling and corruption recovery.
 * Components can subscribe to storage errors for UI notifications.
 *
 * Key features:
 * - Reports and tracks storage errors (quota, write failures, corruption)
 * - Stores corrupted data in memory for user download/recovery
 * - Provides download functionality for corrupted data export
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { StorageError, StorageErrorType } from '@/types/storage'

// =============================================================================
// Types
// =============================================================================

interface StorageContextValue {
  // Error state
  errors: StorageError[]
  hasActiveErrors: boolean
  reportError: (error: Omit<StorageError, 'timestamp'>) => void
  dismissError: (index: number) => void
  clearAllErrors: () => void

  // Corruption recovery (in-memory storage)
  corruptedData: ReadonlyMap<string, string>
  hasCorruptedData: boolean
  storeCorruptedData: (key: string, rawData: string) => void
  downloadCorruptedData: (key: string) => void
  discardCorruptedData: (key: string) => void
  discardAllCorruptedData: () => void
}

// =============================================================================
// Context
// =============================================================================

const StorageContext = createContext<StorageContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

export function StorageProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<StorageError[]>([])
  const [corruptedData, setCorruptedData] = useState<Map<string, string>>(
    () => new Map()
  )

  const reportError = useCallback(
    (error: Omit<StorageError, 'timestamp'>) => {
      const fullError: StorageError = {
        ...error,
        timestamp: new Date().toISOString(),
      }

      setErrors((prev) => {
        // Avoid duplicate errors for same key/type within 1 second
        const isDuplicate = prev.some(
          (e) =>
            e.key === error.key &&
            e.type === error.type &&
            Date.now() - new Date(e.timestamp).getTime() < 1000
        )
        if (isDuplicate) return prev
        return [...prev, fullError]
      })

      // Store corrupted data in memory for recovery
      if (error.type === 'corruption' && error.rawData !== undefined) {
        const rawData = error.rawData
        setCorruptedData((prev) => {
          const next = new Map(prev)
          next.set(error.key, rawData)
          return next
        })
      }

      // Log for debugging
      console.error(`[Storage Error] ${error.type} for key "${error.key}":`, error.message)
    },
    []
  )

  const dismissError = useCallback((index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors([])
  }, [])

  const storeCorruptedData = useCallback((key: string, rawData: string) => {
    setCorruptedData((prev) => {
      const next = new Map(prev)
      next.set(key, rawData)
      return next
    })
  }, [])

  const downloadCorruptedData = useCallback(
    (key: string) => {
      const data = corruptedData.get(key)
      if (!data) {
        console.warn(`No corrupted data found for key "${key}"`)
        return
      }

      // Create downloadable blob
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${key}-corrupted-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [corruptedData]
  )

  const discardCorruptedData = useCallback((key: string) => {
    setCorruptedData((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })

    // Also remove any corruption errors for this key
    setErrors((prev) => prev.filter((e) => !(e.key === key && e.type === 'corruption')))
  }, [])

  const discardAllCorruptedData = useCallback(() => {
    setCorruptedData(new Map())

    // Remove all corruption errors
    setErrors((prev) => prev.filter((e) => e.type !== 'corruption'))
  }, [])

  const hasActiveErrors = errors.length > 0
  const hasCorruptedData = corruptedData.size > 0

  return (
    <StorageContext.Provider
      value={{
        errors,
        hasActiveErrors,
        reportError,
        dismissError,
        clearAllErrors,
        corruptedData,
        hasCorruptedData,
        storeCorruptedData,
        downloadCorruptedData,
        discardCorruptedData,
        discardAllCorruptedData,
      }}
    >
      {children}
    </StorageContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useStorageErrors() {
  const context = useContext(StorageContext)
  if (!context) {
    throw new Error('useStorageErrors must be used within StorageProvider')
  }
  return context
}

// =============================================================================
// Utility: Create error message by type
// =============================================================================

export function getStorageErrorMessage(type: StorageErrorType, key: string): string {
  switch (type) {
    case 'quota_exceeded':
      return `Storage quota exceeded. Unable to save ${key}. Please export your data and clear old history.`
    case 'write_blocked':
      return `Storage is nearly full. Unable to save ${key}. Please clear some data to continue.`
    case 'write_failed':
      return `Failed to save ${key}. Please try again or check browser storage settings.`
    case 'corruption':
      return `Data corruption detected in ${key}. Your data has been backed up for recovery.`
    case 'unavailable':
      return `Storage is unavailable. The app may not save your data. Check browser privacy settings.`
  }
}
