/**
 * UnitSelector Component
 *
 * Toggle between kg and lbs weight units.
 */

import type { WeightUnit } from '@/types/state'

export interface UnitSelectorProps {
  value: WeightUnit
  onChange: (unit: WeightUnit) => void
  disabled?: boolean
}

export function UnitSelector({ value, onChange, disabled = false }: UnitSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Weight Unit</label>
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => onChange('kg')}
          disabled={disabled}
          className={`px-4 py-2 rounded-md font-medium min-h-[44px] min-w-[80px]
                     ${
                       value === 'kg'
                         ? 'bg-blue-600 text-white'
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                     }
                     disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          kg
        </button>
        <button
          type="button"
          onClick={() => onChange('lbs')}
          disabled={disabled}
          className={`px-4 py-2 rounded-md font-medium min-h-[44px] min-w-[80px]
                     ${
                       value === 'lbs'
                         ? 'bg-blue-600 text-white'
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                     }
                     disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          lbs
        </button>
      </div>
    </div>
  )
}
