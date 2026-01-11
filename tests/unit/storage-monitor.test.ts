/**
 * Storage Monitor Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  calculateStorageUsage,
  checkStorageStatus,
  formatBytes,
  isStorageAvailable,
} from '@/lib/storage-monitor'
import { STORAGE_KEYS, STORAGE_WARNING_THRESHOLD_BYTES } from '@/lib/constants'

describe('storage-monitor', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('calculateStorageUsage', () => {
    it('should return 0 when localStorage is empty', () => {
      expect(calculateStorageUsage()).toBe(0)
    })

    it('should calculate bytes used by app storage keys', () => {
      const testData = { test: 'data' }
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(testData))

      const usage = calculateStorageUsage()
      expect(usage).toBeGreaterThan(0)
      // Should include key length + value length
      expect(usage).toBe(STORAGE_KEYS.CONFIG.length + JSON.stringify(testData).length)
    })

    it('should sum all app storage keys', () => {
      localStorage.setItem(STORAGE_KEYS.CONFIG, '{"a":1}')
      localStorage.setItem(STORAGE_KEYS.PROGRESSION, '{"b":2}')

      const usage = calculateStorageUsage()
      const expectedConfig = STORAGE_KEYS.CONFIG.length + '{"a":1}'.length
      const expectedProgression = STORAGE_KEYS.PROGRESSION.length + '{"b":2}'.length

      expect(usage).toBe(expectedConfig + expectedProgression)
    })

    it('should ignore non-app storage keys', () => {
      localStorage.setItem('other_key', 'some data')
      expect(calculateStorageUsage()).toBe(0)
    })
  })

  describe('checkStorageStatus', () => {
    it('should return status with 0 usage when empty', () => {
      const status = checkStorageStatus()

      expect(status.bytesUsed).toBe(0)
      expect(status.warningThreshold).toBe(STORAGE_WARNING_THRESHOLD_BYTES)
      expect(status.isWarning).toBe(false)
      expect(status.percentUsed).toBe(0)
    })

    it('should return warning when threshold exceeded', () => {
      // Create large data to exceed threshold
      const largeData = 'x'.repeat(STORAGE_WARNING_THRESHOLD_BYTES + 1000)
      localStorage.setItem(STORAGE_KEYS.HISTORY, largeData)

      const status = checkStorageStatus()

      expect(status.isWarning).toBe(true)
      expect(status.percentUsed).toBeGreaterThanOrEqual(100)
    })

    it('should calculate percentage correctly', () => {
      // Add data that's about half the threshold
      const halfThreshold = Math.floor(STORAGE_WARNING_THRESHOLD_BYTES / 2)
      const data = 'x'.repeat(halfThreshold - STORAGE_KEYS.CONFIG.length)
      localStorage.setItem(STORAGE_KEYS.CONFIG, data)

      const status = checkStorageStatus()

      expect(status.percentUsed).toBeGreaterThan(40)
      expect(status.percentUsed).toBeLessThan(60)
      expect(status.isWarning).toBe(false)
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 B')
    })

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1.0 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
      expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.50 MB')
    })

    it('should handle 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
    })
  })

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true)
    })

    it('should return false when localStorage throws', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem.bind(localStorage)
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(isStorageAvailable()).toBe(false)

      // Restore
      vi.mocked(localStorage.setItem).mockImplementation(originalSetItem)
    })
  })
})
