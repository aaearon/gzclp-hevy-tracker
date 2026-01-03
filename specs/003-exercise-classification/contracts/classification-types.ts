/**
 * Exercise Classification Types
 *
 * Type definitions for the exercise classification system.
 * These types define the contract for classification storage and operations.
 *
 * @module specs/003-exercise-classification/contracts
 */

// =============================================================================
// Category Types
// =============================================================================

/**
 * All possible exercise categories.
 * - T1, T2, T3: GZCLP-managed with automated progression
 * - Warmup, Cooldown, Supplemental: Non-GZCLP, manual tracking only
 */
export type ExerciseCategory =
  | 'T1'
  | 'T2'
  | 'T3'
  | 'Warmup'
  | 'Cooldown'
  | 'Supplemental'

/**
 * GZCLP-only categories (subject to progression rules).
 */
export type GZCLPCategory = 'T1' | 'T2' | 'T3'

/**
 * Non-GZCLP categories (manual tracking only).
 */
export type NonGZCLPCategory = 'Warmup' | 'Cooldown' | 'Supplemental'

/**
 * All valid category values for validation.
 */
export const EXERCISE_CATEGORIES: readonly ExerciseCategory[] = [
  'T1',
  'T2',
  'T3',
  'Warmup',
  'Cooldown',
  'Supplemental',
] as const

/**
 * GZCLP category values.
 */
export const GZCLP_CATEGORIES: readonly GZCLPCategory[] = ['T1', 'T2', 'T3'] as const

/**
 * Non-GZCLP category values.
 */
export const NON_GZCLP_CATEGORIES: readonly NonGZCLPCategory[] = [
  'Warmup',
  'Cooldown',
  'Supplemental',
] as const

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard: Is this a GZCLP category?
 */
export function isGZCLPCategory(category: ExerciseCategory): category is GZCLPCategory {
  return category === 'T1' || category === 'T2' || category === 'T3'
}

/**
 * Type guard: Is this a non-GZCLP category?
 */
export function isNonGZCLPCategory(
  category: ExerciseCategory
): category is NonGZCLPCategory {
  return category === 'Warmup' || category === 'Cooldown' || category === 'Supplemental'
}

/**
 * Type guard: Is this a valid category?
 */
export function isValidCategory(value: unknown): value is ExerciseCategory {
  return (
    typeof value === 'string' &&
    EXERCISE_CATEGORIES.includes(value as ExerciseCategory)
  )
}

// =============================================================================
// Classification Entity
// =============================================================================

/**
 * Classification of an exercise from Hevy.
 * Stored globally - same classification applies across all routines.
 */
export interface ExerciseClassification {
  /** Hevy exercise template ID (unique identifier) */
  hevyTemplateId: string

  /** Display name from Hevy */
  name: string

  /** User-assigned category */
  category: ExerciseCategory

  /** ISO timestamp when classification was set/last modified */
  classifiedAt: string
}

// =============================================================================
// Storage Types
// =============================================================================

/**
 * localStorage structure for exercise classifications.
 * Key: 'gzclp_classifications'
 */
export interface ClassificationStore {
  /** Schema version for migrations */
  version: string

  /** Map of hevyTemplateId -> classification */
  classifications: Record<string, ExerciseClassification>
}

/**
 * Default empty store for initialization.
 */
export const EMPTY_CLASSIFICATION_STORE: ClassificationStore = {
  version: '1.0.0',
  classifications: {},
}

/**
 * localStorage key for classification store.
 */
export const CLASSIFICATION_STORAGE_KEY = 'gzclp_classifications'

// =============================================================================
// Sync Queue Types
// =============================================================================

/**
 * Queued sync operation for retry when offline.
 */
export interface SyncQueueItem {
  /** Unique ID for this queue item */
  id: string

  /** Operation type */
  type: 'update_routine'

  /** Data to sync */
  payload: {
    routineId: string
    exercises: Array<{
      hevyTemplateId: string
      sets: Array<{ weight_kg: number; reps: number }>
    }>
  }

  /** ISO timestamp when queued */
  createdAt: string

  /** Number of retry attempts */
  retryCount: number

  /** Last error message if retry failed */
  lastError?: string
}

/**
 * localStorage structure for sync queue.
 * Key: 'gzclp_sync_queue'
 */
export interface SyncQueue {
  items: SyncQueueItem[]
}

/**
 * Default empty sync queue.
 */
export const EMPTY_SYNC_QUEUE: SyncQueue = {
  items: [],
}

/**
 * localStorage key for sync queue.
 */
export const SYNC_QUEUE_STORAGE_KEY = 'gzclp_sync_queue'

/**
 * Maximum retry attempts before removing from queue.
 */
export const MAX_SYNC_RETRIES = 5

// =============================================================================
// Operation Types
// =============================================================================

/**
 * Result of classifying an exercise.
 */
export interface ClassifyResult {
  success: boolean
  classification?: ExerciseClassification
  error?: string
}

/**
 * Result of a conflict check during import.
 */
export interface ConflictCheckResult {
  hasConflict: boolean
  existingClassification?: ExerciseClassification
  incomingCategory?: ExerciseCategory
}

/**
 * Display metadata for category UI.
 */
export interface CategoryDisplayInfo {
  category: ExerciseCategory
  label: string
  shortLabel: string
  description: string
  color: string
  isGZCLP: boolean
}

/**
 * Category display metadata for UI rendering.
 */
export const CATEGORY_DISPLAY: Record<ExerciseCategory, CategoryDisplayInfo> = {
  T1: {
    category: 'T1',
    label: 'Tier 1',
    shortLabel: 'T1',
    description: 'Primary compound lift (5x3+, 6x2+, 10x1+)',
    color: 'red',
    isGZCLP: true,
  },
  T2: {
    category: 'T2',
    label: 'Tier 2',
    shortLabel: 'T2',
    description: 'Secondary compound lift (3x10, 3x8, 3x6)',
    color: 'orange',
    isGZCLP: true,
  },
  T3: {
    category: 'T3',
    label: 'Tier 3',
    shortLabel: 'T3',
    description: 'Accessory work (3x15+)',
    color: 'yellow',
    isGZCLP: true,
  },
  Warmup: {
    category: 'Warmup',
    label: 'Warmup',
    shortLabel: 'WU',
    description: 'Pre-workout preparation',
    color: 'green',
    isGZCLP: false,
  },
  Cooldown: {
    category: 'Cooldown',
    label: 'Cooldown',
    shortLabel: 'CD',
    description: 'Post-workout recovery',
    color: 'blue',
    isGZCLP: false,
  },
  Supplemental: {
    category: 'Supplemental',
    label: 'Supplemental',
    shortLabel: 'SUP',
    description: 'Additional work outside GZCLP',
    color: 'purple',
    isGZCLP: false,
  },
}
