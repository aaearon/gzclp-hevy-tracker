/**
 * SyncButton Component
 *
 * Split button for Hevy synchronization with contextual primary action.
 * - When needsPush=true: Primary action is "Push to Hevy", dropdown offers "Fetch"
 * - When needsPush=false: Primary action is "Fetch", dropdown offers "Push to Hevy"
 *
 * Follows GitHub Desktop's contextual button pattern with escape hatch via dropdown.
 */

import { useState, useRef, useEffect } from 'react'

export interface SyncButtonProps {
  onSync: () => void | Promise<void>
  onPush: () => void | Promise<void>
  isSyncing: boolean
  isUpdating: boolean
  needsPush: boolean
  disabled?: boolean
}

// Shared spinner SVG component
function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// Download icon for Fetch action
function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  )
}

// Upload icon for Push action
function UploadIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  )
}

// Chevron down icon for dropdown
function ChevronDownIcon() {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}

export function SyncButton({
  onSync,
  onPush,
  isSyncing,
  isUpdating,
  needsPush,
  disabled = false,
}: SyncButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isLoading = isSyncing || isUpdating
  const isDisabled = disabled || isLoading

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => { document.removeEventListener('mousedown', handleClickOutside) }
    }
  }, [isDropdownOpen])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => { document.removeEventListener('keydown', handleEscape) }
    }
  }, [isDropdownOpen])

  const handlePrimaryClick = () => {
    if (needsPush) {
      void onPush()
    } else {
      void onSync()
    }
  }

  const handleSecondaryClick = () => {
    setIsDropdownOpen(false)
    if (needsPush) {
      void onSync()
    } else {
      void onPush()
    }
  }

  const toggleDropdown = () => {
    if (!isLoading) {
      setIsDropdownOpen(!isDropdownOpen)
    }
  }

  // Determine primary button content
  const getPrimaryContent = () => {
    if (isSyncing) {
      return (
        <>
          <Spinner className="-ml-1 mr-2 h-4 w-4" />
          <span>Fetching...</span>
        </>
      )
    }
    if (isUpdating) {
      return (
        <>
          <Spinner className="-ml-1 mr-2 h-4 w-4" />
          <span>Pushing...</span>
        </>
      )
    }
    if (needsPush) {
      return (
        <>
          <UploadIcon />
          <span className="ml-2">Push to Hevy</span>
        </>
      )
    }
    return (
      <>
        <DownloadIcon />
        <span className="ml-2">Fetch</span>
      </>
    )
  }

  // Determine secondary action content
  const getSecondaryContent = () => {
    if (needsPush) {
      return (
        <>
          <DownloadIcon />
          <span className="ml-2">Fetch</span>
        </>
      )
    }
    return (
      <>
        <UploadIcon />
        <span className="ml-2">Push to Hevy</span>
      </>
    )
  }

  const primaryAriaLabel = needsPush
    ? 'Push changes to Hevy'
    : 'Fetch workouts from Hevy'

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      {/* Amber dot indicator for pending push */}
      {needsPush && !isLoading && !disabled && (
        <span
          className="absolute -right-1 -top-1 z-10 flex h-3 w-3"
          aria-label="Changes need to be pushed to Hevy"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
        </span>
      )}

      {/* Primary action button */}
      <button
        type="button"
        onClick={handlePrimaryClick}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-label={primaryAriaLabel}
        className={`
          inline-flex items-center justify-center px-4 py-2 min-h-[44px]
          rounded-l-md font-medium transition-colors
          ${
            isLoading
              ? 'bg-blue-400 dark:bg-blue-500 text-white cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        `}
      >
        {getPrimaryContent()}
      </button>

      {/* Dropdown toggle button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={isDisabled}
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        aria-label="More sync options"
        className={`
          inline-flex items-center justify-center px-2 py-2 min-h-[44px]
          rounded-r-md font-medium transition-colors
          border-l border-blue-500 dark:border-blue-400
          ${
            isLoading
              ? 'bg-blue-400 dark:bg-blue-500 text-white cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        `}
      >
        <ChevronDownIcon />
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && !isLoading && (
        <div
          role="menu"
          className="
            absolute right-0 top-full z-20 mt-1 w-40
            rounded-md bg-white dark:bg-gray-800
            shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700
          "
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleSecondaryClick}
            disabled={!needsPush && disabled}
            className="
              flex w-full items-center px-4 py-2 text-sm text-left
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              disabled:opacity-50 disabled:cursor-not-allowed
              first:rounded-t-md last:rounded-b-md
            "
          >
            {getSecondaryContent()}
          </button>
        </div>
      )}
    </div>
  )
}
