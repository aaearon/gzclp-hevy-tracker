/**
 * WeightInput Component
 *
 * Input for entering starting weights for exercises.
 */

import { roundWeight } from '@/utils/formatting'
import type { WeightUnit } from '@/types/state'

export interface WeightInputProps {
  value: number
  onChange: (weight: number) => void
  unit: WeightUnit
  label: string
  id?: string
  hint?: string
  disabled?: boolean
}

export function WeightInput({
  value,
  onChange,
  unit,
  label,
  id,
  hint,
  disabled = false,
}: WeightInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value)
    if (isNaN(rawValue)) {
      onChange(0)
    } else {
      // Round to nearest valid increment
      onChange(roundWeight(rawValue, unit))
    }
  }

  const handleBlur = () => {
    // Ensure value is rounded on blur
    onChange(roundWeight(value, unit))
  }

  const increment = unit === 'kg' ? 2.5 : 5

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {hint && (
        <p className="text-xs text-gray-500 mb-1">{hint}</p>
      )}
      <div className="flex items-center space-x-2">
        <input
          id={id}
          type="number"
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          step={increment}
          min={0}
          disabled={disabled}
          placeholder="0"
          className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm
                     focus:ring-blue-500 focus:border-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     min-h-[44px]"
        />
        <span className="text-gray-600">{unit}</span>
      </div>
    </div>
  )
}
