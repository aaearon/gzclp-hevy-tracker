/**
 * State Migration System
 *
 * Version-based schema migrations for localStorage state.
 * Migrations are applied sequentially when loading older state versions.
 */

import type { GZCLPState } from '@/types/state'
import { CURRENT_STATE_VERSION } from './constants'

/**
 * Migration function type.
 * Takes the old state and returns the migrated state.
 */
type MigrationFn = (state: unknown) => unknown

/**
 * Registry of migrations keyed by target version.
 * Each migration transforms state FROM the previous version TO this version.
 */
const MIGRATIONS: Record<string, MigrationFn> = {
  // Initial version - no migration needed
  '1.0.0': (state) => state,

  // Future migrations example:
  // '1.1.0': (state) => ({
  //   ...(state as Record<string, unknown>),
  //   newField: 'defaultValue',
  // }),
}

/**
 * Get all versions in ascending order for sequential migration.
 */
function getSortedVersions(): string[] {
  return Object.keys(MIGRATIONS).sort((a, b) => {
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number)
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number)

    if (aMajor !== bMajor) return (aMajor ?? 0) - (bMajor ?? 0)
    if (aMinor !== bMinor) return (aMinor ?? 0) - (bMinor ?? 0)
    return (aPatch ?? 0) - (bPatch ?? 0)
  })
}

/**
 * Compare two version strings.
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
 * Migrate state from stored version to current version.
 * Applies all migrations in sequence.
 */
export function migrateState(state: unknown): GZCLPState {
  if (!state || typeof state !== 'object') {
    throw new Error('Invalid state: expected object')
  }

  const stateObj = state as Record<string, unknown>
  const storedVersion = (stateObj.version as string) || '1.0.0'

  // Already at current version
  if (storedVersion === CURRENT_STATE_VERSION) {
    return state as GZCLPState
  }

  // Check if stored version is newer than current (downgrade not supported)
  if (compareVersions(storedVersion, CURRENT_STATE_VERSION) > 0) {
    console.warn(
      `State version ${storedVersion} is newer than current ${CURRENT_STATE_VERSION}. Using as-is.`
    )
    return state as GZCLPState
  }

  // Apply migrations sequentially
  const versions = getSortedVersions()
  let migratedState: Record<string, unknown> = state as Record<string, unknown>

  for (const version of versions) {
    // Skip versions we've already passed
    if (compareVersions(version, storedVersion) <= 0) {
      continue
    }

    // Apply migration
    const migration = MIGRATIONS[version]
    if (migration) {
      migratedState = migration(migratedState) as Record<string, unknown>
    }

    // Stop after reaching current version
    if (version === CURRENT_STATE_VERSION) {
      break
    }
  }

  // Update version in migrated state
  return {
    ...migratedState,
    version: CURRENT_STATE_VERSION,
  } as GZCLPState
}

/**
 * Check if state needs migration.
 */
export function needsMigration(state: unknown): boolean {
  if (!state || typeof state !== 'object') {
    return false
  }

  const stateObj = state as Record<string, unknown>
  const storedVersion = stateObj.version as string | undefined

  if (!storedVersion) {
    return true
  }

  return compareVersions(storedVersion, CURRENT_STATE_VERSION) < 0
}
