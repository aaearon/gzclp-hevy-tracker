/**
 * HistoryContext
 *
 * Provides progression history state and mutations for charts.
 * Part of the granular context split to reduce unnecessary re-renders.
 *
 * This context depends on ConfigContext (needs exercises for history recording).
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useHistoryStorage, type UseHistoryStorageResult } from '@/hooks/useHistoryStorage'
import { useHistoryManager } from '@/hooks/useHistoryManager'
import { useConfigContext } from './ConfigContext'
import type {
  ExerciseHistory,
  PendingChange,
} from '@/types/state'

// =============================================================================
// Context Value Type
// =============================================================================

export interface HistoryContextValue {
  // Read-only state
  progressionHistory: Record<string, ExerciseHistory>

  // History mutations
  setProgressionHistory: (history: Record<string, ExerciseHistory>) => void
  recordHistoryEntry: (change: PendingChange) => void

  // Internal: expose storage for useProgram facade
  _historyStorage: UseHistoryStorageResult
}

// =============================================================================
// Context Creation
// =============================================================================

const HistoryContext = createContext<HistoryContextValue | null>(null)

// =============================================================================
// Provider Props
// =============================================================================

export interface HistoryProviderProps {
  children: ReactNode
}

// =============================================================================
// Provider Component
// =============================================================================

export function HistoryProvider({ children }: HistoryProviderProps) {
  // Use the storage hook
  const historyStorage = useHistoryStorage()
  const { history } = historyStorage

  // Access config for exercises (cross-context dependency)
  const { exercises } = useConfigContext()

  // Use domain-specific hook for history management
  const {
    setProgressionHistory,
    recordHistoryEntry,
  } = useHistoryManager({ historyStorage, exercises })

  // Memoize the context value
  const value = useMemo((): HistoryContextValue => ({
    // Read-only state
    progressionHistory: history.progressionHistory,

    // Mutations
    setProgressionHistory,
    recordHistoryEntry,

    // Internal
    _historyStorage: historyStorage,
  }), [
    history,
    historyStorage,
    setProgressionHistory,
    recordHistoryEntry,
  ])

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  )
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Access the history context.
 * Must be used within a HistoryProvider.
 *
 * @throws Error if used outside of HistoryProvider
 */
export function useHistoryContext(): HistoryContextValue {
  const context = useContext(HistoryContext)

  if (!context) {
    throw new Error('useHistoryContext must be used within a HistoryProvider')
  }

  return context
}

/**
 * Access the history context without throwing.
 * Returns null if not within a provider.
 */
export function useHistoryContextOptional(): HistoryContextValue | null {
  return useContext(HistoryContext)
}

// =============================================================================
// Selector Hooks
// =============================================================================

/**
 * Get progression history for all exercises.
 */
export function useProgressionHistory(): Record<string, ExerciseHistory> {
  const { progressionHistory } = useHistoryContext()
  return progressionHistory
}

/**
 * Get progression history for a specific exercise key.
 */
export function useExerciseHistory(progressionKey: string): ExerciseHistory | undefined {
  const { progressionHistory } = useHistoryContext()
  return progressionHistory[progressionKey]
}
