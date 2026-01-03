/**
 * useOnlineStatus Hook
 *
 * Tracks browser online/offline status and provides cached data indicator.
 * [T102] Offline detection and cached data viewing
 */

import { useState, useEffect, useCallback } from 'react'

export interface UseOnlineStatusResult {
  isOnline: boolean
  isHevyReachable: boolean
  checkHevyConnection: () => Promise<boolean>
}

/**
 * Check if Hevy API is reachable by making a lightweight request.
 * Note: This may fail due to CORS if Hevy doesn't support preflight,
 * so we handle this gracefully.
 */
async function checkHevyReachability(): Promise<boolean> {
  try {
    // Use a simple fetch with a short timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // We just try to reach the base URL - even a 401 means the server is up
    const response = await fetch('https://api.hevyapp.com/v1/workouts/count', {
      method: 'HEAD',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    // Any response (even 401) means the server is reachable
    return response.ok || response.status === 401 || response.status === 403
  } catch (error) {
    // Network error or CORS - assume offline for Hevy
    // CORS errors will show as TypeError, which we catch
    return false
  }
}

export function useOnlineStatus(): UseOnlineStatusResult {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isHevyReachable, setIsHevyReachable] = useState(true)

  // Listen for browser online/offline events
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
      setIsHevyReachable(false) // If browser is offline, Hevy is definitely unreachable
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check Hevy connection manually
  const checkHevyConnection = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      setIsHevyReachable(false)
      return false
    }

    const reachable = await checkHevyReachability()
    setIsHevyReachable(reachable)
    return reachable
  }, [isOnline])

  return {
    isOnline,
    isHevyReachable,
    checkHevyConnection,
  }
}
