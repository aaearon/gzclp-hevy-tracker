/**
 * CollapsibleSection Component
 *
 * A collapsible section using native details/summary elements.
 * Used for warmup/cooldown sections in the Dashboard.
 */

import type { ReactNode } from 'react'

export interface CollapsibleSectionProps {
  /** Section title displayed in the summary */
  title: string
  /** Content to display when expanded */
  children: ReactNode
  /** Whether the section is expanded by default */
  defaultOpen?: boolean
  /** Callback when the section is toggled */
  onToggle?: (isOpen: boolean) => void
  /** Additional CSS classes for the details element */
  className?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  onToggle,
  className = '',
}: CollapsibleSectionProps) {
  const handleToggle = (event: React.SyntheticEvent<HTMLDetailsElement>) => {
    const details = event.currentTarget
    onToggle?.(details.open)
  }

  return (
    <details
      open={defaultOpen}
      onToggle={handleToggle}
      className={`group ${className}`}
      role="group"
    >
      <summary className="flex items-center justify-between cursor-pointer list-none py-2 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <svg
          className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  )
}
