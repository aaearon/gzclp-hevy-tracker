/**
 * Data Import Module
 *
 * Handles parsing, validating, and importing exported state.
 */

import type { GZCLPState } from '@/types/state'
import { CURRENT_STATE_VERSION } from './constants'
import { migrateState } from './migrations'

/**
 * Maximum import file size in bytes (5MB).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Semver regex pattern.
 */
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/

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
 * Validate the structure of imported data.
 * @throws Error if structure is invalid.
 */
export function validateImportStructure(data: Record<string, unknown>): void {
  // Check required top-level fields
  const requiredFields = ['version', 'apiKey', 'program', 'exercises', 'progression', 'settings']

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Invalid import: missing required field: ${field}`)
    }
  }

  // Validate version format
  const version = data.version
  if (typeof version !== 'string' || !SEMVER_REGEX.test(version)) {
    throw new Error('Invalid import: invalid version format (expected X.Y.Z)')
  }

  // Validate program structure
  const program = data.program as Record<string, unknown> | undefined
  if (!program || typeof program !== 'object') {
    throw new Error('Invalid import: invalid program structure')
  }

  const programFields = ['name', 'createdAt', 'hevyRoutineIds', 'currentDay']
  for (const field of programFields) {
    if (!(field in program)) {
      throw new Error('Invalid import: invalid program structure')
    }
  }

  // Validate settings structure
  const settings = data.settings as Record<string, unknown> | undefined
  if (!settings || typeof settings !== 'object') {
    throw new Error('Invalid import: invalid settings structure')
  }

  const settingsFields = ['weightUnit', 'increments', 'restTimers']
  for (const field of settingsFields) {
    if (!(field in settings)) {
      throw new Error('Invalid import: invalid settings structure')
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
  const { _exportMeta, ...stateData } = parsed

  // Check version and log warning if newer
  const version = stateData.version as string
  const versionCheck = checkVersion(version)

  if (versionCheck.isNewer) {
    console.warn(
      `Importing data from newer version ${version}. Current version is ${CURRENT_STATE_VERSION}. Some features may not work correctly.`
    )
  }

  // Apply migrations if needed
  const migratedState = migrateState(stateData)

  return migratedState
}

/**
 * Validation result for file import.
 */
export interface FileValidationResult {
  isValid: boolean
  error?: string
  data?: GZCLPState
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
      error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB).`,
    }
  }

  try {
    const content = await file.text()
    const importedState = importData(content)

    return {
      isValid: true,
      data: importedState,
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during import.',
    }
  }
}
