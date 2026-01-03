/**
 * ExportButton Component
 *
 * Button to trigger export of application state as JSON file.
 */

import type { GZCLPState } from '@/types/state'
import { exportState } from '@/lib/data-export'

interface ExportButtonProps {
  state: GZCLPState
  className?: string
}

export function ExportButton({ state, className = '' }: ExportButtonProps) {
  const handleExport = () => {
    exportState(state)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className={`
        min-h-[44px] min-w-[44px] px-4 py-2
        bg-blue-600 hover:bg-blue-700
        text-white font-medium rounded-lg
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      Export Data
    </button>
  )
}
