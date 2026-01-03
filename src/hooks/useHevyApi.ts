/**
 * useHevyApi Hook
 *
 * Manages Hevy API connection state and provides methods
 * for fetching exercise templates.
 */

import { useState, useCallback, useMemo } from 'react'
import { createHevyClient, HevyAuthError, type HevyClient } from '@/lib/hevy-client'
import type { ExerciseTemplate } from '@/types/hevy'

export interface UseHevyApiState {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  exerciseTemplates: ExerciseTemplate[]
  isLoadingTemplates: boolean
}

export interface UseHevyApiActions {
  connect: (apiKey: string) => Promise<boolean>
  disconnect: () => void
  loadExerciseTemplates: () => Promise<void>
}

export type UseHevyApiResult = UseHevyApiState & UseHevyApiActions

export function useHevyApi(initialApiKey?: string): UseHevyApiResult {
  const [apiKey, setApiKey] = useState<string>(initialApiKey ?? '')
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  // Create client instance when API key changes
  const client = useMemo((): HevyClient | null => {
    if (!apiKey) return null
    return createHevyClient(apiKey)
  }, [apiKey])

  /**
   * Test connection with the provided API key.
   */
  const connect = useCallback(async (newApiKey: string): Promise<boolean> => {
    setIsConnecting(true)
    setConnectionError(null)
    setApiKey(newApiKey)

    try {
      const newClient = createHevyClient(newApiKey)
      await newClient.testConnection()
      setIsConnected(true)
      return true
    } catch (error) {
      setIsConnected(false)

      if (error instanceof HevyAuthError) {
        setConnectionError('Invalid API key. Please check your key and try again.')
      } else if (error instanceof Error) {
        setConnectionError(error.message)
      } else {
        setConnectionError('Failed to connect to Hevy API')
      }

      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  /**
   * Disconnect from the API.
   */
  const disconnect = useCallback(() => {
    setApiKey('')
    setIsConnected(false)
    setConnectionError(null)
    setExerciseTemplates([])
  }, [])

  /**
   * Load all exercise templates from Hevy.
   */
  const loadExerciseTemplates = useCallback(async () => {
    if (!client) {
      throw new Error('Not connected to Hevy API')
    }

    setIsLoadingTemplates(true)

    try {
      const templates = await client.getAllExerciseTemplates()
      setExerciseTemplates(templates)
    } finally {
      setIsLoadingTemplates(false)
    }
  }, [client])

  return {
    isConnected,
    isConnecting,
    connectionError,
    exerciseTemplates,
    isLoadingTemplates,
    connect,
    disconnect,
    loadExerciseTemplates,
  }
}
