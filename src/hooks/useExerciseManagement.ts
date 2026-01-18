/**
 * useExerciseManagement Hook
 *
 * Domain-specific hook for exercise CRUD operations with cross-domain coordination.
 * Manages updates to both config storage (exercise definitions) and progression
 * storage (initial progression state) atomically.
 *
 * This hook receives storage hooks via dependency injection for:
 * - Easier unit testing with mocked storage
 * - Avoiding duplicate localStorage subscriptions
 * - Clear dependency graph
 */

import { useCallback } from 'react'
import { generateId } from '@/utils/id'
import type { UseConfigStorageResult } from './useConfigStorage'
import type { UseProgressionStorageResult } from './useProgressionStorage'
import type { ExerciseConfig, ExerciseRole } from '@/types/state'

// =============================================================================
// Role Helpers
// =============================================================================

/** Main lift roles that use role-based progression keys (squat-T1, squat-T2) */
const MAIN_LIFT_ROLES: ExerciseRole[] = ['squat', 'bench', 'ohp', 'deadlift']

function isMainLiftRole(role: ExerciseRole | undefined): boolean {
  return role !== undefined && MAIN_LIFT_ROLES.includes(role)
}

/**
 * Get progression keys for an exercise based on its role.
 * - Main lifts use: ${role}-T1, ${role}-T2
 * - T3 exercises use: ${exerciseId}
 */
function getProgressionKeysForRole(exerciseId: string, role: ExerciseRole | undefined): string[] {
  if (!role) return []
  if (isMainLiftRole(role)) {
    return [`${role}-T1`, `${role}-T2`]
  }
  return [exerciseId]
}

/**
 * Parameters for useExerciseManagement hook.
 * Storage hooks are injected to enable testing and avoid duplicate subscriptions.
 */
export interface UseExerciseManagementParams {
  /** Config storage hook result (for exercise definitions) */
  configStorage: UseConfigStorageResult
  /** Progression storage hook result (for initial progression state) */
  progressionStorage: UseProgressionStorageResult
}

/**
 * Result interface for useExerciseManagement hook.
 */
export interface UseExerciseManagementResult {
  /**
   * Add a new exercise with initial progression state.
   * Creates entries in both config and progression storage.
   * @param config - Exercise config without ID (ID is auto-generated)
   * @returns The generated exercise ID
   */
  addExercise: (config: Omit<ExerciseConfig, 'id'>) => string

  /**
   * Update an existing exercise's config.
   * Only touches config storage (progression is unchanged).
   * @param id - Exercise ID to update
   * @param updates - Partial config updates to apply
   */
  updateExercise: (id: string, updates: Partial<ExerciseConfig>) => void

  /**
   * Remove an exercise and its progression state.
   * Removes entries from both config and progression storage.
   * @param id - Exercise ID to remove
   */
  removeExercise: (id: string) => void
}

/**
 * Hook for managing exercise CRUD operations with cross-domain coordination.
 *
 * @example
 * ```tsx
 * const configStorage = useConfigStorage()
 * const progressionStorage = useProgressionStorage()
 *
 * const { addExercise, updateExercise, removeExercise } = useExerciseManagement({
 *   configStorage,
 *   progressionStorage,
 * })
 *
 * // Add exercise (creates both config and progression entries)
 * const exerciseId = addExercise({
 *   hevyTemplateId: 'template-1',
 *   name: 'Back Squat',
 *   role: 'squat',
 * })
 *
 * // Update exercise (config only)
 * updateExercise(exerciseId, { name: 'Updated Name' })
 *
 * // Remove exercise (removes from both config and progression)
 * removeExercise(exerciseId)
 * ```
 */
export function useExerciseManagement({
  configStorage,
  progressionStorage,
}: UseExerciseManagementParams): UseExerciseManagementResult {
  /**
   * Add a new exercise with initial progression state.
   * Coordinates updates to both config and progression storage atomically.
   */
  const addExercise = useCallback(
    (exerciseConfig: Omit<ExerciseConfig, 'id'>): string => {
      const id = generateId()
      const fullConfig: ExerciseConfig = { ...exerciseConfig, id }

      // Add exercise to config storage
      configStorage.addExercise(fullConfig)

      // Add initial progression entry to progression storage
      progressionStorage.setProgression({
        ...progressionStorage.store.progression,
        [id]: {
          exerciseId: id,
          currentWeight: 0,
          stage: 0,
          baseWeight: 0,
          amrapRecord: 0,
          amrapRecordDate: null,
          amrapRecordWorkoutId: null,
        },
      })

      return id
    },
    [configStorage, progressionStorage]
  )

  /**
   * Update an existing exercise's config.
   * If the role changes, cleans up old progression keys and creates new ones.
   */
  const updateExercise = useCallback(
    (id: string, updates: Partial<ExerciseConfig>) => {
      const existingExercise = configStorage.config.exercises[id]
      if (!existingExercise) return

      const oldRole = existingExercise.role
      const newRole = updates.role

      // Handle role change - clean up old progression keys and create new ones
      if (newRole !== undefined && newRole !== oldRole) {
        // Get keys to remove (from old role)
        const oldKeys = getProgressionKeysForRole(id, oldRole)

        // Get keys to create (for new role)
        const newKeys = getProgressionKeysForRole(id, newRole)

        // Remove old progression keys
        for (const key of oldKeys) {
          progressionStorage.removeProgression(key)
        }

        // Create new progression entries with default values
        for (const key of newKeys) {
          progressionStorage.setProgressionByKey(key, id, 0, 0)
        }
      }

      // Update the exercise config
      configStorage.updateExercise(id, updates)
    },
    [configStorage, progressionStorage]
  )

  /**
   * Remove an exercise and its progression state.
   * Coordinates removal from both config and progression storage.
   */
  const removeExercise = useCallback(
    (id: string) => {
      const exercise = configStorage.config.exercises[id]

      // Remove all progression keys associated with this exercise's role
      if (exercise) {
        const keysToRemove = getProgressionKeysForRole(id, exercise.role)
        for (const key of keysToRemove) {
          progressionStorage.removeProgression(key)
        }
      }

      // Remove from config
      configStorage.removeExercise(id)
    },
    [configStorage, progressionStorage]
  )

  return {
    addExercise,
    updateExercise,
    removeExercise,
  }
}
