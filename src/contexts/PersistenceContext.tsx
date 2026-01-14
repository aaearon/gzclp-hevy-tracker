/**
 * PersistenceContext
 *
 * Provides full state management operations: reset and import.
 * Part of the granular context split to reduce unnecessary re-renders.
 *
 * This context depends on ALL other contexts (Config, Progression, History)
 * because reset and import affect all storage domains.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useDataPersistence, type ImportResult } from '@/hooks/useDataPersistence'
import { useConfigContext } from './ConfigContext'
import { useProgressionContext } from './ProgressionContext'
import { useHistoryContext } from './HistoryContext'
import type { GZCLPState } from '@/types/state'

// =============================================================================
// Context Value Type
// =============================================================================

export interface PersistenceContextValue {
  /** Reset all state (config, progression, history) */
  resetState: () => void

  /** Import full state from a GZCLPState object with atomic rollback on failure */
  importState: (state: GZCLPState) => ImportResult
}

// =============================================================================
// Context Creation
// =============================================================================

const PersistenceContext = createContext<PersistenceContextValue | null>(null)

// =============================================================================
// Provider Props
// =============================================================================

export interface PersistenceProviderProps {
  children: ReactNode
}

// =============================================================================
// Provider Component
// =============================================================================

export function PersistenceProvider({ children }: PersistenceProviderProps) {
  // Access storage from all contexts
  const { _configStorage: configStorage } = useConfigContext()
  const { _progressionStorage: progressionStorage } = useProgressionContext()
  const { _historyStorage: historyStorage } = useHistoryContext()

  // Use domain-specific hook for persistence operations
  const {
    resetState,
    importState,
  } = useDataPersistence({ configStorage, progressionStorage, historyStorage })

  // Memoize the context value
  const value = useMemo((): PersistenceContextValue => ({
    resetState,
    importState,
  }), [resetState, importState])

  return (
    <PersistenceContext.Provider value={value}>
      {children}
    </PersistenceContext.Provider>
  )
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Access the persistence context.
 * Must be used within a PersistenceProvider.
 *
 * @throws Error if used outside of PersistenceProvider
 */
export function usePersistenceContext(): PersistenceContextValue {
  const context = useContext(PersistenceContext)

  if (!context) {
    throw new Error('usePersistenceContext must be used within a PersistenceProvider')
  }

  return context
}

/**
 * Access the persistence context without throwing.
 * Returns null if not within a provider.
 */
export function usePersistenceContextOptional(): PersistenceContextValue | null {
  return useContext(PersistenceContext)
}
