/**
 * WeightEditor Component
 *
 * Inline weight editor for modifying proposed weight changes.
 */

import { useState, useRef, useEffect } from 'react'
import type { WeightUnit } from '@/types/state'

export interface WeightEditorProps {
  initialWeight: number
  unit: WeightUnit
  onConfirm: (newWeight: number) => void
  onCancel: () => void
}

export function WeightEditor({ initialWeight, unit, onConfirm, onCancel }: WeightEditorProps) {
  const [weight, setWeight] = useState(initialWeight.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleConfirm = () => {
    const numericWeight = parseFloat(weight)
    if (!isNaN(numericWeight) && numericWeight > 0) {
      onConfirm(numericWeight)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          role="spinbutton"
          value={weight}
          onChange={(e) => { setWeight(e.target.value) }}
          onKeyDown={handleKeyDown}
          step={unit === 'kg' ? '2.5' : '5'}
          min="0"
          className="w-20 px-2 py-1 text-lg font-semibold text-center border border-blue-400
                     rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="New weight"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          {unit}
        </span>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        aria-label="Confirm weight change"
        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50
                   rounded-md min-h-[44px] min-w-[44px] transition-colors"
      >
        <svg
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel weight change"
        className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100
                   rounded-md min-h-[44px] min-w-[44px] transition-colors"
      >
        <svg
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  )
}
