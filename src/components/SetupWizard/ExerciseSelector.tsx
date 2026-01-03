/**
 * ExerciseSelector Component
 *
 * Searchable dropdown for selecting exercises from Hevy templates.
 */

import { useState, useMemo } from 'react'
import type { ExerciseTemplate } from '@/types/hevy'

export interface ExerciseSelectorProps {
  exercises: ExerciseTemplate[]
  value: string | null
  onChange: (templateId: string | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function ExerciseSelector({
  exercises,
  value,
  onChange,
  placeholder = 'Select an exercise...',
  disabled = false,
  id,
}: ExerciseSelectorProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredExercises = useMemo(() => {
    if (!search) return exercises

    const lowerSearch = search.toLowerCase()
    return exercises.filter(
      (ex) =>
        ex.title.toLowerCase().includes(lowerSearch) ||
        ex.primary_muscle_group.toLowerCase().includes(lowerSearch)
    )
  }, [exercises, search])

  const selectedExercise = useMemo(
    () => exercises.find((ex) => ex.id === value),
    [exercises, value]
  )

  const handleSelect = (templateId: string) => {
    onChange(templateId)
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setSearch('')
  }

  return (
    <div className="relative">
      {/* Selected display or search input */}
      <div className="relative">
        <input
          id={id}
          type="text"
          value={isOpen ? search : selectedExercise?.title ?? ''}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm
                     focus:ring-blue-500 focus:border-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {selectedExercise && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                       disabled:cursor-not-allowed"
            aria-label="Clear selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg
                     max-h-60 overflow-auto"
        >
          {filteredExercises.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">No exercises found</div>
          ) : (
            filteredExercises.slice(0, 50).map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => handleSelect(exercise.id)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50
                           focus:outline-none min-h-[44px]"
              >
                <div className="font-medium text-gray-900">{exercise.title}</div>
                <div className="text-xs text-gray-500 capitalize">
                  {exercise.primary_muscle_group.replace('_', ' ')}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}
    </div>
  )
}
