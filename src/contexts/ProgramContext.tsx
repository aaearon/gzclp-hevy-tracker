/**
 * ProgramContext
 *
 * Provides read-only access to commonly-used program state.
 * Eliminates prop drilling through 6+ component levels for:
 * - weightUnit
 * - exercises
 * - progression
 * - t3Schedule
 * - currentDay
 *
 * Usage:
 * ```tsx
 * // Wrap your app
 * <ProgramProvider>
 *   <App />
 * </ProgramProvider>
 *
 * // Use in any component
 * const { weightUnit, exercises } = useProgramContext()
 * ```
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type {
  ExerciseConfig,
  ProgressionState,
  GZCLPDay,
  WeightUnit,
} from '@/types/state'

// =============================================================================
// Context Value Type
// =============================================================================

export interface ProgramContextValue {
  /** Current weight unit (kg or lbs) */
  weightUnit: WeightUnit
  /** All exercise configurations */
  exercises: Record<string, ExerciseConfig>
  /** Current progression state for all exercises */
  progression: Record<string, ProgressionState>
  /** T3 schedule mapping days to exercise IDs */
  t3Schedule: Record<GZCLPDay, string[]>
  /** Current day in the GZCLP rotation */
  currentDay: GZCLPDay
  /** Weight increments for upper/lower body */
  increments: { upper: number; lower: number }
}

// =============================================================================
// Context Creation
// =============================================================================

const ProgramContext = createContext<ProgramContextValue | null>(null)

// =============================================================================
// Provider Component
// =============================================================================

export interface ProgramProviderProps {
  /** Current weight unit */
  weightUnit: WeightUnit
  /** All exercise configurations */
  exercises: Record<string, ExerciseConfig>
  /** Current progression state */
  progression: Record<string, ProgressionState>
  /** T3 schedule */
  t3Schedule: Record<GZCLPDay, string[]>
  /** Current day */
  currentDay: GZCLPDay
  /** Weight increments */
  increments: { upper: number; lower: number }
  /** Children to render */
  children: ReactNode
}

export function ProgramProvider({
  weightUnit,
  exercises,
  progression,
  t3Schedule,
  currentDay,
  increments,
  children,
}: ProgramProviderProps) {
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    (): ProgramContextValue => ({
      weightUnit,
      exercises,
      progression,
      t3Schedule,
      currentDay,
      increments,
    }),
    [weightUnit, exercises, progression, t3Schedule, currentDay, increments]
  )

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access the program context.
 * Must be used within a ProgramProvider.
 *
 * @throws Error if used outside of ProgramProvider
 */
export function useProgramContext(): ProgramContextValue {
  const context = useContext(ProgramContext)

  if (!context) {
    throw new Error('useProgramContext must be used within a ProgramProvider')
  }

  return context
}

/**
 * Access the program context without throwing.
 * Returns null if not within a provider.
 * Useful for optional context access.
 */
export function useProgramContextOptional(): ProgramContextValue | null {
  return useContext(ProgramContext)
}

// =============================================================================
// Selector Hooks (for fine-grained subscriptions)
// =============================================================================

/**
 * Get just the weight unit.
 */
export function useWeightUnit(): WeightUnit {
  const { weightUnit } = useProgramContext()
  return weightUnit
}

/**
 * Get just the current day.
 */
export function useCurrentDay(): GZCLPDay {
  const { currentDay } = useProgramContext()
  return currentDay
}

/**
 * Get a specific exercise config by ID.
 */
export function useExercise(exerciseId: string): ExerciseConfig | undefined {
  const { exercises } = useProgramContext()
  return exercises[exerciseId]
}

/**
 * Get progression for a specific key.
 */
export function useProgressionByKey(key: string): ProgressionState | undefined {
  const { progression } = useProgramContext()
  return progression[key]
}

/**
 * Get T3 exercises for the current day.
 */
export function useCurrentDayT3s(): string[] {
  const { t3Schedule, currentDay } = useProgramContext()
  return t3Schedule[currentDay]
}
