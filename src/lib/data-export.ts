/**
 * Data Export Module
 *
 * Handles serializing application state and triggering download.
 */

import type { GZCLPState } from '@/types/state'
import { CURRENT_STATE_VERSION } from './constants'

/**
 * Export metadata added to exported files.
 */
interface ExportMeta {
  exportedAt: string
  appVersion: string
}

/**
 * Exported state structure with metadata.
 */
interface ExportedState extends GZCLPState {
  _exportMeta: ExportMeta
}

/**
 * Serialize application state to a JSON string.
 * Adds export metadata for tracking.
 */
export function serializeState(state: GZCLPState): string {
  const exportedState: ExportedState = {
    ...state,
    _exportMeta: {
      exportedAt: new Date().toISOString(),
      appVersion: CURRENT_STATE_VERSION,
    },
  }

  return JSON.stringify(exportedState, null, 2)
}

/**
 * Generate a timestamped filename for the export.
 * Format: gzclp-backup-YYYY-MM-DD_HHmmss.json
 */
export function generateExportFilename(): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0] // YYYY-MM-DD
  const time = now.toISOString().split('T')[1]?.split('.')[0]?.replace(/:/g, '') // HHmmss

  return `gzclp-backup-${date}_${time}.json`
}

/**
 * Trigger a file download in the browser.
 */
export function triggerDownload(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Export application state as a downloadable JSON file.
 * Main entry point for export functionality.
 */
export function exportState(state: GZCLPState): void {
  const serialized = serializeState(state)
  const filename = generateExportFilename()
  triggerDownload(serialized, filename)
}
