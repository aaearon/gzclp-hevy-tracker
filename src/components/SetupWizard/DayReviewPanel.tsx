/**
 * DayReviewPanel Component
 *
 * Displays T1/T2/T3 exercises for a single day during import review.
 * Allows weight editing for T1/T2 and removal of T3 exercises.
 *
 * @see docs/006-per-day-t3-and-import-ux.md - Phase 6
 */

import { useCallback } from 'react'
import type { DayImportData, ImportedExercise, WeightUnit } from '@/types/state'

export interface DayReviewPanelProps {
  /** Import data for this day */
  dayData: DayImportData
  /** Callback when T1 exercise is updated */
  onT1Update: (updates: Partial<ImportedExercise>) => void
  /** Callback when T2 exercise is updated */
  onT2Update: (updates: Partial<ImportedExercise>) => void
  /** Callback when a T3 exercise is removed */
  onT3Remove: (index: number) => void
  /** Weight unit for display */
  unit: WeightUnit
}

interface TierCardProps {
  tier: 'T1' | 'T2'
  exercise: ImportedExercise
  onWeightChange: (weight: number) => void
  unit: WeightUnit
}

function TierCard({ tier, exercise, onWeightChange, unit }: TierCardProps) {
  const isT1 = tier === 'T1'
  const borderColor = isT1 ? 'border-l-red-500' : 'border-l-blue-500'
  const bgColor = isT1 ? 'bg-red-50' : 'bg-blue-50'
  const badgeColor = isT1 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'

  const currentWeight = exercise.userWeight ?? exercise.detectedWeight

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      if (!isNaN(value)) {
        onWeightChange(value)
      }
    },
    [onWeightChange]
  )

  const inputId = `${tier.toLowerCase()}-weight-${exercise.templateId}`

  return (
    <div className={`rounded-md border-l-4 ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>{tier}</span>
          <span className="font-medium text-gray-900">{exercise.name}</span>
        </div>
        <span className="font-mono text-sm text-gray-600">{exercise.originalRepScheme}</span>
      </div>

      <div className="mt-3">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {tier} weight
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id={inputId}
            type="number"
            value={currentWeight}
            onChange={handleChange}
            step="0.5"
            min="0"
            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                       min-h-[44px]"
          />
          <span className="text-sm text-gray-600">{unit}</span>
        </div>
      </div>
    </div>
  )
}

interface T3ListItemProps {
  exercise: ImportedExercise
  onRemove: () => void
}

function T3ListItem({ exercise, onRemove }: T3ListItemProps) {
  return (
    <li className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">T3</span>
        <span className="text-gray-900">{exercise.name}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${exercise.name}`}
        className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50
                   min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        Remove
      </button>
    </li>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
      {text}
    </div>
  )
}

export function DayReviewPanel({
  dayData,
  onT1Update,
  onT2Update,
  onT3Remove,
  unit,
}: DayReviewPanelProps) {
  const handleT1WeightChange = useCallback(
    (weight: number) => {
      onT1Update({ userWeight: weight })
    },
    [onT1Update]
  )

  const handleT2WeightChange = useCallback(
    (weight: number) => {
      onT2Update({ userWeight: weight })
    },
    [onT2Update]
  )

  return (
    <div className="space-y-6">
      {/* T1 Section */}
      <section>
        <h3 className="mb-3 text-lg font-medium text-gray-900">T1 - Main Lift</h3>
        {dayData.t1 ? (
          <TierCard
            tier="T1"
            exercise={dayData.t1}
            onWeightChange={handleT1WeightChange}
            unit={unit}
          />
        ) : (
          <EmptyState text="No T1 exercise assigned" />
        )}
      </section>

      {/* T2 Section */}
      <section>
        <h3 className="mb-3 text-lg font-medium text-gray-900">T2 - Secondary Lift</h3>
        {dayData.t2 ? (
          <TierCard
            tier="T2"
            exercise={dayData.t2}
            onWeightChange={handleT2WeightChange}
            unit={unit}
          />
        ) : (
          <EmptyState text="No T2 exercise assigned" />
        )}
      </section>

      {/* T3 Section */}
      <section>
        <h3 className="mb-3 text-lg font-medium text-gray-900">T3 - Accessories</h3>
        {dayData.t3s.length > 0 ? (
          <ul className="space-y-2">
            {dayData.t3s.map((t3, index) => (
              <T3ListItem
                key={`${t3.templateId}-${index}`}
                exercise={t3}
                onRemove={() => onT3Remove(index)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState text="No T3 accessories" />
        )}
      </section>
    </div>
  )
}
