/**
 * WeightSetupStep Component
 *
 * Configure starting weights for all assigned exercises (main lifts + T3s).
 * [US3] Main lifts now require T1+T2 weights (8 total for 4 lifts).
 */

import { useState, useCallback } from 'react'
import { WeightInput } from './WeightInput'
import { ValidatingWeightInput } from '@/components/common/WeightInput'
import { UnitSelector } from './UnitSelector'
import { ROLE_DISPLAY, T1_SCHEMES, T2_SCHEMES } from '@/lib/constants'
import { MAIN_LIFT_ROLES } from '@/types/state'
import { roundWeight } from '@/utils/formatting'
import type { CreatePathAssignments } from './SlotAssignment'
import type { ExerciseTemplate } from '@/types/hevy'
import type { WeightUnit, MainLiftRole, Stage, GZCLPDay } from '@/types/state'

// =============================================================================
// T2 Auto-Suggestion Constants
// =============================================================================

/** T2 weight as percentage of T1 */
const T2_PERCENTAGE = 0.7

export interface WeightSetupStepProps {
  assignments: CreatePathAssignments
  exercises: ExerciseTemplate[]
  weights: Record<string, number>
  onWeightChange: (key: string, weight: number) => void
  unit: WeightUnit
  onUnitChange: (unit: WeightUnit) => void
}

export function WeightSetupStep({
  assignments,
  exercises,
  weights,
  onWeightChange,
  unit,
  onUnitChange,
}: WeightSetupStepProps) {
  // Get assigned main lifts with exercise info
  const assignedMainLifts = MAIN_LIFT_ROLES
    .filter((role) => assignments.mainLifts[role] !== null)
    .map((role) => {
      const templateId = assignments.mainLifts[role]!
      const exercise = exercises.find((ex) => ex.id === templateId)
      return {
        key: role,
        label: ROLE_DISPLAY[role].label,
        exerciseName: exercise?.title ?? 'Unknown Exercise',
        description: ROLE_DISPLAY[role].description,
      }
    })

  // Phase 9: Get unique T3s across all days (deduplicated by templateId)
  const uniqueT3TemplateIds = new Set<string>()
  const t3DayMap = new Map<string, GZCLPDay[]>() // templateId -> days it appears on

  for (const day of ['A1', 'B1', 'A2', 'B2'] as GZCLPDay[]) {
    for (const templateId of assignments.t3Exercises[day]) {
      if (!templateId) continue
      uniqueT3TemplateIds.add(templateId)
      const days = t3DayMap.get(templateId) || []
      if (!days.includes(day)) {
        days.push(day)
        t3DayMap.set(templateId, days)
      }
    }
  }

  const assignedT3s = Array.from(uniqueT3TemplateIds).map((templateId) => {
    const exercise = exercises.find((ex) => ex.id === templateId)
    const days = t3DayMap.get(templateId) || []
    const dayLabel = days.length > 1 ? `(${days.join(', ')})` : `(${days[0]})`
    return {
      key: `t3_${templateId}`,  // Use templateId as key for deduplication
      label: `T3: ${exercise?.title ?? 'Unknown Exercise'} ${dayLabel}`,
      exerciseName: exercise?.title ?? 'Unknown Exercise',
    }
  })

  const hasNoAssignments = assignedMainLifts.length === 0 && assignedT3s.length === 0

  if (hasNoAssignments) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <p className="text-gray-600">No exercises have been assigned. Please go back and select exercises first.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Set Starting Weights</h2>
      <p className="text-gray-600 mb-6">
        Enter your current working weight for each exercise. These should be weights you can complete with good form for the prescribed rep scheme.
      </p>

      {/* Unit selector */}
      <div className="mb-8">
        <UnitSelector value={unit} onChange={onUnitChange} />
      </div>

      {/* Main Lifts Weight Inputs */}
      {assignedMainLifts.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
            Main Lifts
          </h3>
          <div className="space-y-6">
            {assignedMainLifts.map(({ key, label, exerciseName, description }) => (
              <WeightInput
                key={key}
                id={`weight-${key}`}
                label={`${label}: ${exerciseName}`}
                hint={description}
                value={weights[key] ?? 0}
                onChange={(weight) => { onWeightChange(key, weight) }}
                unit={unit}
              />
            ))}
          </div>
        </section>
      )}

      {/* T3 Weight Inputs */}
      {assignedT3s.length > 0 && (
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
            T3 Accessories
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            T3 exercises use 3x15+ rep scheme. Progress when you hit 25+ total reps.
          </p>
          <div className="space-y-6">
            {assignedT3s.map(({ key, label }) => (
              <WeightInput
                key={key}
                id={`weight-${key}`}
                label={label}
                value={weights[key] ?? 0}
                onChange={(weight) => { onWeightChange(key, weight) }}
                unit={unit}
              />
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-sm text-gray-500">
        Tip: If unsure, start lighter. You can always increase weights as you progress.
      </p>
    </div>
  )
}

// =============================================================================
// MainLiftWeightSetup Component
// =============================================================================

/** Weight keys for 8-weight form (T1+T2 per main lift) */
export type MainLiftWeightKey =
  | 'squat-T1' | 'squat-T2'
  | 'bench-T1' | 'bench-T2'
  | 'ohp-T1' | 'ohp-T2'
  | 'deadlift-T1' | 'deadlift-T2'

export interface MainLiftWeightSetupProps {
  /** Current weights keyed by progression key (e.g., "squat-T1", "squat-T2") */
  weights: Record<MainLiftWeightKey, number>
  /** Called when a weight changes */
  onWeightChange: (key: MainLiftWeightKey, weight: number) => void
  /** Weight unit */
  unit: WeightUnit
}

/**
 * 8-weight form for main lifts (T1+T2 per lift).
 *
 * Features:
 * - Groups weights by main lift (Squat, Bench, OHP, Deadlift)
 * - Shows T1 and T2 rep schemes in labels
 * - Auto-suggests T2 as 70% of T1 when T1 is entered
 * - Real-time validation with inline errors
 * - T1/T2 relationship warnings
 */
export function MainLiftWeightSetup({
  weights,
  onWeightChange,
  unit,
}: MainLiftWeightSetupProps) {
  // Track which T2 fields have been manually touched by user
  const [t2Touched, setT2Touched] = useState<Record<string, boolean>>({})

  // T1 rep scheme display (Stage 0)
  const t1Scheme = T1_SCHEMES[0 as Stage].display

  // T2 rep scheme display (Stage 0)
  const t2Scheme = T2_SCHEMES[0 as Stage].display

  // Handle T1 weight change - may trigger T2 auto-suggestion
  const handleT1Change = useCallback((role: MainLiftRole, value: string) => {
    const numValue = parseFloat(value) || 0
    onWeightChange(`${role}-T1` as MainLiftWeightKey, numValue)

    // Auto-suggest T2 if:
    // 1. T2 hasn't been manually touched
    // 2. T2 is currently 0 (not yet entered)
    // 3. New T1 value is positive
    const t2Key = `${role}-T2` as MainLiftWeightKey
    if (!t2Touched[role] && weights[t2Key] === 0 && numValue > 0) {
      const suggestedT2 = roundWeight(numValue * T2_PERCENTAGE, unit)
      onWeightChange(t2Key, suggestedT2)
    }
  }, [onWeightChange, weights, t2Touched, unit])

  // Handle T2 weight change - mark as touched
  const handleT2Change = useCallback((role: MainLiftRole, value: string) => {
    const numValue = parseFloat(value) || 0
    onWeightChange(`${role}-T2` as MainLiftWeightKey, numValue)
    setT2Touched((prev) => ({ ...prev, [role]: true }))
  }, [onWeightChange])

  // Calculate suggested T2 weight for a role
  const getSuggestedT2 = (role: MainLiftRole): number | null => {
    const t1Weight = weights[`${role}-T1` as MainLiftWeightKey]
    if (t1Weight > 0) {
      return roundWeight(t1Weight * T2_PERCENTAGE, unit)
    }
    return null
  }

  return (
    <div className="space-y-8">
      {MAIN_LIFT_ROLES.map((role) => {
        const t1Key = `${role}-T1` as MainLiftWeightKey
        const t2Key = `${role}-T2` as MainLiftWeightKey
        const t1Weight = weights[t1Key]
        const t2Weight = weights[t2Key]
        const suggestedT2 = getSuggestedT2(role)
        const displayName = ROLE_DISPLAY[role].label

        return (
          <div key={role} className="space-y-4">
            {/* Lift name header */}
            <h4 className="text-base font-medium text-gray-800">{displayName}</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* T1 Input */}
              <ValidatingWeightInput
                id={`weight-${t1Key}`}
                label={`T1 ${displayName} (${t1Scheme})`}
                value={t1Weight > 0 ? t1Weight.toString() : ''}
                onChange={(value) => { handleT1Change(role, value) }}
                unit={unit}
              />

              {/* T2 Input */}
              <div>
                <ValidatingWeightInput
                  id={`weight-${t2Key}`}
                  label={`T2 ${displayName} (${t2Scheme})`}
                  value={t2Weight > 0 ? t2Weight.toString() : ''}
                  onChange={(value) => { handleT2Change(role, value) }}
                  unit={unit}
                  t1Weight={t1Weight}
                  hint={
                    suggestedT2 && t2Weight === 0
                      ? `Suggested: ${String(suggestedT2)} ${unit}`
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
