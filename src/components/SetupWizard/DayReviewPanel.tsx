/**
 * DayReviewPanel Component
 *
 * Displays T1/T2/T3 exercises for a single day during import review.
 * Uses ExerciseAnalysisCard when analysis data is available.
 * Allows weight editing for T1/T2 and removal of T3 exercises.
 *
 * @see docs/006-per-day-t3-and-import-ux.md - Phase 6
 * @see docs/009-intelligent-import-progression.md
 */

import { useCallback } from 'react'
import type { DayImportData, ImportedExercise, WeightUnit, Stage } from '@/types/state'
import { ExerciseAnalysisCard } from './ExerciseAnalysisCard'

export interface DayReviewPanelProps {
  /** Import data for this day */
  dayData: DayImportData
  /** Callback when T1 exercise is updated */
  onT1Update: (updates: Partial<ImportedExercise>) => void
  /** Callback when T2 exercise is updated */
  onT2Update: (updates: Partial<ImportedExercise>) => void
  /** Callback when a T3 exercise is removed */
  onT3Remove: (index: number) => void
  /** Callback when T3 weight is updated */
  onT3WeightUpdate?: (templateId: string, weight: number) => void
  /** Callback when T3 stage is updated */
  onT3StageUpdate?: (templateId: string, stage: Stage) => void
  /** Callback when T3 increment is updated */
  onT3IncrementUpdate?: (templateId: string, increment: number) => void
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
  const bgColor = isT1 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
  const badgeColor = isT1
    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'

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
          <span className="font-medium text-gray-900 dark:text-white">{exercise.name}</span>
        </div>
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{exercise.originalRepScheme}</span>
      </div>

      <div className="mt-3">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            className="w-24 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                       min-h-[44px]"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  )
}

interface T3ListItemProps {
  exercise: ImportedExercise
  onRemove: () => void
  onWeightChange?: ((weight: number) => void) | undefined
  onIncrementChange?: ((increment: number) => void) | undefined
  unit: WeightUnit
}

function T3ListItem({ exercise, onRemove, onWeightChange, onIncrementChange, unit }: T3ListItemProps) {
  const currentWeight = exercise.userWeight ?? exercise.detectedWeight
  const currentIncrement = exercise.customIncrementKg ?? 2.5
  const inputId = `t3-weight-${exercise.templateId}`
  const incrementId = `t3-increment-${exercise.templateId}`

  const handleWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      if (!isNaN(value) && onWeightChange) {
        onWeightChange(value)
      }
    },
    [onWeightChange]
  )

  const handleIncrementChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      if (!isNaN(value) && value >= 0.5 && value <= 10 && onIncrementChange) {
        onIncrementChange(value)
      }
    },
    [onIncrementChange]
  )

  return (
    <li className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">T3</span>
          <span className="text-gray-900 dark:text-white">{exercise.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* T3 weight input */}
          <label htmlFor={inputId} className="sr-only">
            {exercise.name} weight
          </label>
          <input
            id={inputId}
            type="number"
            value={currentWeight}
            onChange={handleWeightChange}
            step="0.5"
            min="0"
            aria-label={`${exercise.name} weight`}
            className="w-20 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                       min-h-[36px]"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${exercise.name}`}
            className="rounded-md px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                       min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            Remove
          </button>
        </div>
      </div>
      {/* Increment input row */}
      <div className="flex items-center gap-2 mt-2 pl-16">
        <label htmlFor={incrementId} className="text-sm text-gray-600 dark:text-gray-400">
          Increment:
        </label>
        <input
          id={incrementId}
          type="number"
          step="0.5"
          min="0.5"
          max="10"
          value={currentIncrement}
          onChange={handleIncrementChange}
          aria-label={`${exercise.name} increment`}
          className="w-20 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                     min-h-[36px]"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">kg</span>
      </div>
    </li>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
      {text}
    </div>
  )
}

export function DayReviewPanel({
  dayData,
  onT1Update,
  onT2Update,
  onT3Remove,
  onT3WeightUpdate,
  onT3StageUpdate,
  onT3IncrementUpdate,
  unit,
}: DayReviewPanelProps) {
  // T1 handlers
  const handleT1WeightChange = useCallback(
    (weight: number) => {
      onT1Update({ userWeight: weight })
    },
    [onT1Update]
  )

  const handleT1StageChange = useCallback(
    (stage: Stage) => {
      onT1Update({ userStage: stage })
    },
    [onT1Update]
  )

  // T2 handlers
  const handleT2WeightChange = useCallback(
    (weight: number) => {
      onT2Update({ userWeight: weight })
    },
    [onT2Update]
  )

  const handleT2StageChange = useCallback(
    (stage: Stage) => {
      onT2Update({ userStage: stage })
    },
    [onT2Update]
  )

  // Check if exercises have analysis data to determine which component to use
  const t1HasAnalysis = dayData.t1?.analysis !== undefined
  const t2HasAnalysis = dayData.t2?.analysis !== undefined

  return (
    <div className="space-y-6">
      {/* T1 Section */}
      <section>
        <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">T1 - Main Lift</h3>
        {dayData.t1 ? (
          t1HasAnalysis ? (
            <ExerciseAnalysisCard
              exercise={dayData.t1}
              tier="T1"
              onWeightChange={handleT1WeightChange}
              onStageChange={handleT1StageChange}
              unit={unit}
            />
          ) : (
            <TierCard
              tier="T1"
              exercise={dayData.t1}
              onWeightChange={handleT1WeightChange}
              unit={unit}
            />
          )
        ) : (
          <EmptyState text="No T1 exercise assigned" />
        )}
      </section>

      {/* T2 Section */}
      <section>
        <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">T2 - Secondary Lift</h3>
        {dayData.t2 ? (
          t2HasAnalysis ? (
            <ExerciseAnalysisCard
              exercise={dayData.t2}
              tier="T2"
              onWeightChange={handleT2WeightChange}
              onStageChange={handleT2StageChange}
              unit={unit}
            />
          ) : (
            <TierCard
              tier="T2"
              exercise={dayData.t2}
              onWeightChange={handleT2WeightChange}
              unit={unit}
            />
          )
        ) : (
          <EmptyState text="No T2 exercise assigned" />
        )}
      </section>

      {/* T3 Section */}
      <section>
        <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">T3 - Accessories</h3>
        {dayData.t3s.length > 0 ? (
          <ul className="space-y-2">
            {dayData.t3s.map((t3, index) => (
              t3.analysis ? (
                <li key={`${t3.templateId}-${String(index)}`}>
                  <div className="relative">
                    <ExerciseAnalysisCard
                      exercise={t3}
                      tier="T3"
                      onWeightChange={(weight: number) => {
                        if (onT3WeightUpdate) {
                          onT3WeightUpdate(t3.templateId, weight)
                        }
                      }}
                      onStageChange={(stage: Stage) => {
                        if (onT3StageUpdate) {
                          onT3StageUpdate(t3.templateId, stage)
                        }
                      }}
                      onIncrementChange={
                        onT3IncrementUpdate
                          ? ((increment: number) => { onT3IncrementUpdate(t3.templateId, increment) })
                          : (undefined as ((increment: number) => void) | undefined)
                      }
                      unit={unit}
                    />
                    <button
                      type="button"
                      onClick={() => { onT3Remove(index) }}
                      aria-label={`Remove ${t3.name}`}
                      className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ) : (
                <T3ListItem
                  key={`${t3.templateId}-${String(index)}`}
                  exercise={t3}
                  onRemove={() => { onT3Remove(index) }}
                  onWeightChange={
                    onT3WeightUpdate
                      ? (weight: number) => { onT3WeightUpdate(t3.templateId, weight) }
                      : undefined
                  }
                  onIncrementChange={
                    onT3IncrementUpdate
                      ? (increment: number) => { onT3IncrementUpdate(t3.templateId, increment) }
                      : undefined
                  }
                  unit={unit}
                />
              )
            ))}
          </ul>
        ) : (
          <EmptyState text="No T3 accessories" />
        )}
      </section>
    </div>
  )
}
