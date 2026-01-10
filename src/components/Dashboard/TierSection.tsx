/**
 * TierSection Component
 *
 * Groups and displays exercises by tier (T1, T2, or T3).
 */

import type { ExerciseConfig, PendingChange, ProgressionState, Tier, WeightUnit } from '@/types/state'
import { ExerciseCard } from './ExerciseCard'

interface TierSectionProps {
  tier: Tier
  exercises: ExerciseConfig[]
  progression: Record<string, ProgressionState>
  weightUnit: WeightUnit
  pendingChanges: PendingChange[]
}

const tierNames: Record<Tier, string> = {
  T1: 'Tier 1',
  T2: 'Tier 2',
  T3: 'Tier 3',
}

const tierDescriptions: Record<Tier, string> = {
  T1: 'Primary compound lifts',
  T2: 'Secondary compound lifts',
  T3: 'Accessory exercises',
}

export function TierSection({
  tier,
  exercises,
  progression,
  weightUnit,
  pendingChanges,
}: TierSectionProps) {
  // Get exercises pending changes for quick lookup
  const pendingExerciseIds = new Set(pendingChanges.map((c) => c.exerciseId))

  if (exercises.length === 0) {
    return null
  }

  return (
    <section data-testid={`tier-section-${tier.toLowerCase()}`} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{tierNames[tier]}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{tierDescriptions[tier]}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => {
          const prog = progression[exercise.id]
          if (!prog) return null

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              progression={prog}
              weightUnit={weightUnit}
              tier={tier}
              hasPendingChange={pendingExerciseIds.has(exercise.id)}
            />
          )
        })}
      </div>
    </section>
  )
}
