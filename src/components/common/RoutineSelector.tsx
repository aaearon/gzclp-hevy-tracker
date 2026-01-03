/**
 * RoutineSelector Component
 *
 * Full-screen modal for selecting a Hevy routine.
 * Includes search/filter when more than 10 routines.
 * Sorted by modification date (most recent first).
 */

import { useState, useMemo } from 'react'
import type { AvailableRoutine } from '@/types/state'

export interface RoutineSelectorProps {
  routines: AvailableRoutine[]
  selectedId: string | null
  onSelect: (routineId: string) => void
  onClose: () => void
  isOpen: boolean
}

export function RoutineSelector({
  routines,
  selectedId,
  onSelect,
  onClose,
  isOpen,
}: RoutineSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Sort by date (most recent first)
  const sortedRoutines = useMemo(() => {
    return [...routines].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [routines])

  // Filter by search term
  const filteredRoutines = useMemo(() => {
    if (!searchTerm.trim()) return sortedRoutines
    const term = searchTerm.toLowerCase()
    return sortedRoutines.filter((routine) =>
      routine.title.toLowerCase().includes(term)
    )
  }, [sortedRoutines, searchTerm])

  const showSearch = routines.length > 10

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Select routine"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Select Routine</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px]
                     flex items-center justify-center"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Search (only if more than 10 routines) */}
      {showSearch && (
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search routines..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>
      )}

      {/* Routine list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredRoutines.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No routines found</p>
        ) : (
          <div className="space-y-3">
            {filteredRoutines.map((routine) => (
              <button
                key={routine.id}
                type="button"
                onClick={() => onSelect(routine.id)}
                className={`w-full p-4 text-left border-2 rounded-lg transition-colors min-h-[44px]
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           ${
                             selectedId === routine.id
                               ? 'border-blue-500 bg-blue-50'
                               : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                           }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{routine.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {routine.exercisePreview.join(', ')}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400 ml-2 whitespace-nowrap">
                    {routine.exerciseCount} exercises
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
