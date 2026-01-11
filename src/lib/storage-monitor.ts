/**
 * Storage Monitor Utilities
 *
 * Functions for monitoring localStorage usage and preventing quota exceeded errors.
 */

import { STORAGE_KEYS, STORAGE_WARNING_THRESHOLD_BYTES } from './constants'

/**
 * Calculate total bytes used by app's localStorage keys.
 * @returns Total bytes used, or 0 if localStorage unavailable
 */
export function calculateStorageUsage(): number {
  if (typeof window === 'undefined') return 0

  try {
    let totalBytes = 0
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = window.localStorage.getItem(key)
      if (item) {
        // String length in JS is UTF-16, but localStorage typically stores as UTF-8
        // This is an approximation; actual storage may vary
        totalBytes += key.length + item.length
      }
    }
    return totalBytes
  } catch {
    return 0
  }
}

/**
 * Check if storage usage exceeds warning threshold.
 * @returns Object with current usage info
 */
export function checkStorageStatus(): {
  bytesUsed: number
  warningThreshold: number
  isWarning: boolean
  percentUsed: number
} {
  const bytesUsed = calculateStorageUsage()
  const warningThreshold = STORAGE_WARNING_THRESHOLD_BYTES
  const isWarning = bytesUsed >= warningThreshold
  const percentUsed = Math.round((bytesUsed / warningThreshold) * 100)

  return {
    bytesUsed,
    warningThreshold,
    isWarning,
    percentUsed,
  }
}

/**
 * Format bytes as human-readable string.
 * @param bytes Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Check if localStorage is available and has space.
 * @returns true if storage is available and working
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}
