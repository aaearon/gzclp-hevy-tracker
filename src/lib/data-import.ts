/**
 * Data Import Module
 *
 * Handles parsing, validating, and importing exported state.
 */

import { z } from 'zod'
import type { GZCLPState } from '@/types/state'
import { CURRENT_STATE_VERSION } from './constants'

/**
 * Maximum import file size in bytes (5MB).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Semver regex pattern.
 */
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/

// =============================================================================
// Zod Schemas for Deep Validation
// =============================================================================

const GZCLPDaySchema = z.enum(['A1', 'B1', 'A2', 'B2'])
const StageSchema = z.union([z.literal(0), z.literal(1), z.literal(2)])
const WeightUnitSchema = z.enum(['kg', 'lbs'])
const ExerciseRoleSchema = z.enum(['squat', 'bench', 'ohp', 'deadlift', 't3']).optional()

const ExerciseConfigSchema = z.object({
  id: z.string(),
  hevyTemplateId: z.string(),
  name: z.string(),
  role: ExerciseRoleSchema,
}).loose() // Allow additional fields for backwards compatibility

const ProgressionStateSchema = z.object({
  exerciseId: z.string(),
  currentWeight: z.number(),
  stage: StageSchema,
  baseWeight: z.number(),
  lastWorkoutId: z.string().nullable(),
  lastWorkoutDate: z.string().nullable(),
  amrapRecord: z.number(),
}).loose() // Allow additional fields

const ProgramConfigSchema = z.object({
  name: z.string(),
  createdAt: z.string(),
  hevyRoutineIds: z.object({
    A1: z.string().nullable(),
    B1: z.string().nullable(),
    A2: z.string().nullable(),
    B2: z.string().nullable(),
  }),
  currentDay: GZCLPDaySchema,
}).loose()

const UserSettingsSchema = z.object({
  weightUnit: WeightUnitSchema,
  increments: z.object({
    upper: z.number(),
    lower: z.number(),
  }),
  restTimers: z.object({
    t1: z.number(),
    t2: z.number(),
    t3: z.number(),
  }),
}).loose()

/**
 * Deep validation schema for imported state.
 * Uses passthrough() to allow unknown fields for forward compatibility.
 */
const ImportStateSchema = z.object({
  version: z.string().regex(SEMVER_REGEX, 'Invalid version format (expected X.Y.Z)'),
  apiKey: z.string(),
  program: ProgramConfigSchema,
  exercises: z.record(z.string(), ExerciseConfigSchema),
  progression: z.record(z.string(), ProgressionStateSchema),
  settings: UserSettingsSchema,
}).loose()

/**
 * Parse raw JSON data from import string.
 * @throws Error if JSON is invalid or not an object.
 */
export function parseImportData(data: string): Record<string, unknown> {
  let parsed: unknown

  try {
    parsed = JSON.parse(data)
  } catch {
    throw new Error('Invalid JSON: Could not parse file contents')
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid import data: expected object')
  }

  return parsed as Record<string, unknown>
}

/**
 * Validate the structure of imported data using zod schema.
 * Provides deep validation of nested structures.
 * @throws Error if structure is invalid.
 */
export function validateImportStructure(data: Record<string, unknown>): void {
  const result = ImportStateSchema.safeParse(data)

  if (!result.success) {
    // Extract the first error for a clear message
    const firstIssue = result.error.issues[0]
    if (!firstIssue) {
      throw new Error('Invalid import: validation failed')
    }
    const path = firstIssue.path.join('.')
    const message = firstIssue.message
    const topLevelField = firstIssue.path[0] as string | undefined

    // Check if this is a missing required top-level field
    const requiredTopLevel = ['version', 'apiKey', 'program', 'exercises', 'progression', 'settings']
    if (topLevelField && requiredTopLevel.includes(topLevelField) && !(topLevelField in data)) {
      throw new Error(`Invalid import: missing required field: ${topLevelField}`)
    }

    // Provide user-friendly error messages
    if (path === '') {
      throw new Error(`Invalid import: ${message}`)
    } else if (path === 'version') {
      throw new Error('Invalid import: invalid version format (expected X.Y.Z)')
    } else if (path.startsWith('program')) {
      throw new Error(`Invalid import: invalid program structure (${path}: ${message})`)
    } else if (path.startsWith('settings')) {
      throw new Error(`Invalid import: invalid settings structure (${path}: ${message})`)
    } else if (path.startsWith('exercises')) {
      throw new Error(`Invalid import: invalid exercise data (${path}: ${message})`)
    } else if (path.startsWith('progression')) {
      throw new Error(`Invalid import: invalid progression data (${path}: ${message})`)
    } else {
      throw new Error(`Invalid import: ${path}: ${message}`)
    }
  }
}

/**
 * Compare two semver version strings.
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = a.split('.').map(Number)
  const [bMajor, bMinor, bPatch] = b.split('.').map(Number)

  if ((aMajor ?? 0) !== (bMajor ?? 0)) return (aMajor ?? 0) < (bMajor ?? 0) ? -1 : 1
  if ((aMinor ?? 0) !== (bMinor ?? 0)) return (aMinor ?? 0) < (bMinor ?? 0) ? -1 : 1
  if ((aPatch ?? 0) !== (bPatch ?? 0)) return (aPatch ?? 0) < (bPatch ?? 0) ? -1 : 1
  return 0
}

/**
 * Check version compatibility.
 * Returns whether migration is needed and if the version is newer than current.
 */
export function checkVersion(version: string): { needsMigration: boolean; isNewer: boolean } {
  const comparison = compareVersions(version, CURRENT_STATE_VERSION)

  return {
    needsMigration: comparison < 0,
    isNewer: comparison > 0,
  }
}

/**
 * Import and migrate data from exported JSON string.
 * @throws Error if import data is invalid.
 */
export function importData(data: string): GZCLPState {
  const parsed = parseImportData(data)
  validateImportStructure(parsed)

  // Remove export metadata before importing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _exportMeta, ...stateData } = parsed

  // Check version and log warning if newer
  const version = stateData.version as string
  const versionCheck = checkVersion(version)

  if (versionCheck.isNewer) {
    throw new Error(
      `Cannot import data from newer version ${version}. Current app version is ${CURRENT_STATE_VERSION}. Please update the app to import this file.`
    )
  }

  // Ensure required fields have defaults for backwards compatibility
  const state = {
    ...stateData,
    // Existing defaults
    progressionHistory: stateData.progressionHistory ?? {},
    acknowledgedDiscrepancies: stateData.acknowledgedDiscrepancies ?? [],
    // New defaults for fields added in later versions
    pendingChanges: stateData.pendingChanges ?? [],
    t3Schedule: stateData.t3Schedule ?? { A1: [], B1: [], A2: [], B2: [] },
    totalWorkouts: stateData.totalWorkouts ?? 0,
    mostRecentWorkoutDate: stateData.mostRecentWorkoutDate ?? null,
    needsPush: stateData.needsPush ?? false,
    lastSync: stateData.lastSync ?? null,
    // Always update version to current
    version: CURRENT_STATE_VERSION,
  } as GZCLPState

  return state
}

/**
 * Validation result for file import.
 */
export interface FileValidationResult {
  isValid: boolean
  error?: string
  data?: GZCLPState
  /** Timestamp when the backup was exported (if available) */
  exportedAt?: string
}

/**
 * Validate an import file and return the parsed state if valid.
 */
export async function validateImportFile(file: File): Promise<FileValidationResult> {
  // Check file type
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    return {
      isValid: false,
      error: 'Invalid file type. Please select a JSON file.',
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed (${String(MAX_FILE_SIZE / 1024 / 1024)}MB).`,
    }
  }

  try {
    const content = await file.text()
    const importedState = importData(content)

    // Extract export timestamp from raw JSON (before stripping metadata)
    let exportedAt: string | undefined
    try {
      const rawParsed = JSON.parse(content) as Record<string, unknown>
      const meta = rawParsed._exportMeta as { exportedAt?: string } | undefined
      exportedAt = meta?.exportedAt
    } catch {
      // Ignore - exportedAt will be undefined
    }

    return {
      isValid: true,
      data: importedState,
      ...(exportedAt != null && { exportedAt }),
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during import.',
    }
  }
}
