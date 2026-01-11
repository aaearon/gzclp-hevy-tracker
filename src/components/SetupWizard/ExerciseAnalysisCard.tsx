/**
 * ExerciseAnalysisCard Component
 *
 * Displays workout analysis for a single exercise during import review.
 * Shows source workout data, detected performance, and progression suggestions.
 *
 * @see docs/009-intelligent-import-progression.md
 */

import { useCallback } from 'react'
import type { ImportedExercise, Stage, Tier, WeightUnit } from '@/types/state'
import type { ProgressionSuggestion } from '@/types/import'
import { roundWeight, formatWeight } from '@/utils/formatting'

export interface ExerciseAnalysisCardProps {
  exercise: ImportedExercise
  tier: Tier
  onWeightChange: (weight: number) => void
  onStageChange: (stage: Stage) => void
  unit: WeightUnit
}

type VisualState = 'progress' | 'repeat' | 'stage_change' | 'deload' | 'no_data'

interface VisualConfig {
  borderColor: string
  bgColor: string
  resultBgColor: string
  resultTextColor: string
  label: string
}

const VISUAL_CONFIGS: Record<VisualState, VisualConfig> = {
  progress: {
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    resultBgColor: 'bg-green-100 dark:bg-green-900/30',
    resultTextColor: 'text-green-800 dark:text-green-300',
    label: 'SUCCESS',
  },
  repeat: {
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    resultBgColor: 'bg-blue-100 dark:bg-blue-900/30',
    resultTextColor: 'text-blue-800 dark:text-blue-300',
    label: 'SUCCESS',
  },
  stage_change: {
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    resultBgColor: 'bg-amber-100 dark:bg-amber-900/30',
    resultTextColor: 'text-amber-800 dark:text-amber-300',
    label: 'FAIL',
  },
  deload: {
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    resultBgColor: 'bg-red-100 dark:bg-red-900/30',
    resultTextColor: 'text-red-800 dark:text-red-300',
    label: 'FAIL',
  },
  no_data: {
    borderColor: 'border-gray-300 dark:border-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    resultBgColor: 'bg-gray-100 dark:bg-gray-700',
    resultTextColor: 'text-gray-600 dark:text-gray-400',
    label: 'NO DATA',
  },
}

function getVisualState(suggestion: ProgressionSuggestion | null | undefined): VisualState {
  if (!suggestion) {
    return 'no_data'
  }

  switch (suggestion.type) {
    case 'progress':
      return 'progress'
    case 'repeat':
      return 'repeat'
    case 'stage_change':
      return 'stage_change'
    case 'deload':
      return 'deload'
    default:
      return 'no_data'
  }
}

function formatReps(reps: number[]): string {
  return reps.join(', ') + ' reps'
}

function formatWorkoutDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return isoDate
  }
}

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 0, label: 'Stage A (5x3+)' },
  { value: 1, label: 'Stage B (6x2+)' },
  { value: 2, label: 'Stage C (10x1+)' },
]

const T2_STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 0, label: 'Stage A (3x10)' },
  { value: 1, label: 'Stage B (3x8)' },
  { value: 2, label: 'Stage C (3x6)' },
]

const T3_STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 0, label: 'Stage A (3x15+)' },
  { value: 1, label: 'Stage B (3x12+)' },
  { value: 2, label: 'Stage C (3x10+)' },
]

function getStageOptionsForTier(tier: Tier): { value: Stage; label: string }[] {
  switch (tier) {
    case 'T1':
      return STAGE_OPTIONS
    case 'T2':
      return T2_STAGE_OPTIONS
    case 'T3':
      return T3_STAGE_OPTIONS
  }
}

export function ExerciseAnalysisCard({
  exercise,
  tier,
  onWeightChange,
  onStageChange,
  unit,
}: ExerciseAnalysisCardProps) {
  const analysis = exercise.analysis
  const hasData = analysis?.hasWorkoutData ?? false
  const performance = analysis?.performance
  const suggestion = analysis?.suggestion

  // Determine visual state based on suggestion type
  const visualState = getVisualState(suggestion)
  const config = VISUAL_CONFIGS[visualState]

  // Current effective values (user override or suggested or detected)
  const effectiveWeight = exercise.userWeight ?? suggestion?.suggestedWeight ?? exercise.detectedWeight
  const effectiveStage = exercise.userStage ?? suggestion?.suggestedStage ?? exercise.detectedStage

  const inputId = `analysis-weight-${exercise.templateId}`
  const stageId = `analysis-stage-${exercise.templateId}`
  const increment = unit === 'kg' ? 2.5 : 5

  const handleWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = parseFloat(e.target.value)
      if (!isNaN(rawValue)) {
        onWeightChange(roundWeight(rawValue, unit))
      }
    },
    [onWeightChange, unit]
  )

  const handleWeightBlur = useCallback(() => {
    onWeightChange(roundWeight(effectiveWeight, unit))
  }, [effectiveWeight, onWeightChange, unit])

  const handleStageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.target.value, 10) as Stage
      onStageChange(value)
    },
    [onStageChange]
  )

  const showStageDropdown = suggestion?.type === 'stage_change'
  const stageOptions = getStageOptionsForTier(tier)

  return (
    <div
      className={`rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} p-4 shadow-sm`}
      role="article"
      aria-label={`Analysis for ${exercise.name}`}
    >
      {/* Header: Exercise name and scheme */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">{exercise.name}</h4>
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{exercise.originalRepScheme}</span>
      </div>

      {/* Source information */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        <span className="font-medium">Source: </span>
        {hasData && performance ? (
          <span>{formatWorkoutDate(performance.workoutDate)}</span>
        ) : (
          <span className="italic text-gray-400 dark:text-gray-500">No workout data</span>
        )}
      </div>

      {/* Performance details (only if has workout data) */}
      {hasData && performance && (
        <div className="space-y-2 mb-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Lifted: </span>
            <span>
              {formatWeight(performance.weight, unit)} x {performance.totalSets} sets (
              {formatReps(performance.reps)})
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${config.resultBgColor} ${config.resultTextColor}`}
            >
              {config.label}
            </span>
            {suggestion?.reason && <span className="text-gray-700 dark:text-gray-300">{suggestion.reason}</span>}
          </div>
        </div>
      )}

      {/* No data message */}
      {!hasData && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 italic">
          No recent workout data found. Using detected values from routine.
        </div>
      )}

      {/* Next target section */}
      <div
        className={`rounded-md border ${config.borderColor} bg-white dark:bg-gray-800 p-3`}
        role="group"
        aria-label="Next workout target"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Weight input */}
          <div className="flex items-center gap-2">
            <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Next Target:
            </label>
            <input
              id={inputId}
              type="number"
              value={effectiveWeight || ''}
              onChange={handleWeightChange}
              onBlur={handleWeightBlur}
              step={increment}
              min={0}
              placeholder="0"
              aria-describedby={suggestion?.reason ? `${inputId}-explanation` : undefined}
              className="w-24 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                         min-h-[44px]"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>
          </div>

          {/* Progression explanation */}
          {suggestion?.reason && (
            <span id={`${inputId}-explanation`} className="text-sm text-gray-600 dark:text-gray-400">
              <span className="mr-1" aria-hidden="true">
                &#8592;
              </span>
              {suggestion.reason}
            </span>
          )}
        </div>

        {/* Stage change info */}
        {showStageDropdown && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            <label htmlFor={stageId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New scheme:
            </label>
            <select
              id={stageId}
              value={effectiveStage}
              onChange={handleStageChange}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                         min-h-[44px]"
            >
              {stageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              (was {exercise.originalRepScheme})
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
