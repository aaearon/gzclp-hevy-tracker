/**
 * ImportButton Component
 *
 * Button and file input to import exported state from JSON file.
 */

import { useRef, useState } from 'react'
import type { GZCLPState } from '@/types/state'
import { validateImportFile } from '@/lib/data-import'

interface ImportButtonProps {
  onImport: (state: GZCLPState) => void
  onError?: (error: string) => void
  className?: string
}

export function ImportButton({ onImport, onError, className = '' }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      const result = await validateImportFile(file)

      if (result.isValid && result.data) {
        onImport(result.data)
      } else if (result.error) {
        onError?.(result.error)
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to import file')
    } finally {
      setIsLoading(false)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`
          min-h-[44px] min-w-[44px] px-4 py-2
          bg-gray-600 hover:bg-gray-700
          text-white font-medium rounded-lg
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isLoading ? 'Importing...' : 'Import Data'}
      </button>
    </>
  )
}
