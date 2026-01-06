/**
 * ExerciseSelector Component
 *
 * Dropdown to select which exercise's progression to view.
 */

import type { ExerciseConfig, Tier } from '@/types/state'

interface ExerciseOption {
  key: string
  name: string
  tier: Tier
}

interface ExerciseSelectorProps {
  options: ExerciseOption[]
  selectedKey: string
  onChange: (key: string) => void
}

export function ExerciseSelector({ options, selectedKey, onChange }: ExerciseSelectorProps) {
  // Group options by tier
  const t1Options = options.filter((o) => o.tier === 'T1')
  const t2Options = options.filter((o) => o.tier === 'T2')
  const t3Options = options.filter((o) => o.tier === 'T3')

  return (
    <div className="relative">
      <select
        value={selectedKey}
        onChange={(e) => { onChange(e.target.value) }}
        className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Select exercise"
      >
        {t1Options.length > 0 && (
          <optgroup label="T1 - Main Lifts">
            {t1Options.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.name}
              </option>
            ))}
          </optgroup>
        )}
        {t2Options.length > 0 && (
          <optgroup label="T2 - Secondary">
            {t2Options.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.name}
              </option>
            ))}
          </optgroup>
        )}
        {t3Options.length > 0 && (
          <optgroup label="T3 - Accessories">
            {t3Options.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  )
}

/**
 * Build exercise options from exercises and progression keys.
 */
export function buildExerciseOptions(
  exercises: Record<string, ExerciseConfig>,
  progressionKeys: string[]
): ExerciseOption[] {
  const options: ExerciseOption[] = []

  for (const key of progressionKeys) {
    // Main lift keys: "squat-T1", "bench-T2", etc.
    if (key.endsWith('-T1') || key.endsWith('-T2')) {
      const role = key.replace(/-T[12]$/, '')
      const tier = key.endsWith('-T1') ? 'T1' : 'T2'

      // Find exercise by role
      const exercise = Object.values(exercises).find((e) => e.role === role)
      const name = exercise?.name ?? role.charAt(0).toUpperCase() + role.slice(1)

      options.push({
        key,
        name: `${name} (${tier})`,
        tier: tier as Tier,
      })
    } else {
      // T3 exercises use exerciseId as key
      const exercise = exercises[key]
      if (exercise) {
        options.push({
          key,
          name: exercise.name,
          tier: 'T3',
        })
      }
    }
  }

  // Sort: T1 first, then T2, then T3
  return options.sort((a, b) => {
    const tierOrder = { T1: 0, T2: 1, T3: 2 }
    return tierOrder[a.tier] - tierOrder[b.tier]
  })
}
