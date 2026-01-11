/**
 * MainLiftCard Component
 *
 * Displays a main lift (squat, bench, ohp, deadlift) with separate T1 and T2 rows.
 * Each row shows current weight, stage indicator, and rep scheme.
 *
 * [T035] Create MainLiftCard component showing T1 and T2 rows
 * [T037] Add stage indicator and rep scheme display to each tier row
 * [T038] Highlight current day's focus lifts
 */

import type { GZCLPDay, MainLiftRole, ProgressionState, Stage, WeightUnit } from '@/types/state'
import { getRepScheme, ROLE_DISPLAY, STAGE_DISPLAY } from '@/lib/constants'
import { displayWeight } from '@/utils/formatting'
import { getTierForDay, getProgressionKey } from '@/lib/role-utils'
import { calculateWarmupSets } from '@/lib/warmup'

function formatWarmupWeight(weightKg: number, weightUnit: WeightUnit): string {
  return displayWeight(weightKg, weightUnit)
}

export interface MainLiftCardProps {
  role: MainLiftRole
  progression: Record<string, ProgressionState>
  weightUnit: WeightUnit
  currentDay: GZCLPDay
}

const stageColors: Record<Stage, string> = {
  0: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  1: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
  2: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
}

const tierRowStyles = {
  T1: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-l-red-500',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  T2: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
}

interface TierRowProps {
  tier: 'T1' | 'T2'
  progression: ProgressionState | undefined
  weightUnit: WeightUnit
  isActiveToday: boolean
}

function TierRow({ tier, progression, weightUnit, isActiveToday }: TierRowProps) {
  const styles = tierRowStyles[tier]

  if (!progression) {
    return (
      <div className={`rounded-md border-l-4 ${styles.border} ${styles.bg} p-3 opacity-50`}>
        <div className="flex items-center justify-between">
          <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${styles.badge}`}>
            {tier}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Not configured</span>
        </div>
      </div>
    )
  }

  const scheme = getRepScheme(tier, progression.stage)
  const stageLabel = STAGE_DISPLAY[progression.stage]
  const warmupSets = tier === 'T1' ? calculateWarmupSets(progression.currentWeight) : []

  return (
    <div
      data-testid={`tier-row-${tier.toLowerCase()}`}
      className={`
        rounded-md border-l-4 p-3 transition-all
        ${styles.border} ${styles.bg}
        ${isActiveToday ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
      `}
    >
      {/* Tier badge row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${styles.badge}`}>
          {tier}
        </span>
        {isActiveToday && (
          <span className="rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
            Today
          </span>
        )}
        <span className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${stageColors[progression.stage]}`}>
          {stageLabel}
        </span>
      </div>

      {/* Weight and scheme row */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {displayWeight(progression.currentWeight, weightUnit)}
        </span>
        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{scheme.display}</span>
      </div>

      {/* Warmup Sets - T1 only */}
      {warmupSets.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-yellow-500 text-[10px] font-bold text-white shrink-0">
            W
          </span>
          {warmupSets.map((set, index) => (
            <span
              key={index}
              className="rounded-full bg-yellow-100 dark:bg-yellow-800/50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800 dark:text-yellow-200"
            >
              {formatWarmupWeight(set.weight, weightUnit)} × {set.reps}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function MainLiftCard({ role, progression, weightUnit, currentDay }: MainLiftCardProps) {
  const displayName = ROLE_DISPLAY[role].label

  // Get progression states for T1 and T2
  const t1Key = getProgressionKey('', role, 'T1')
  const t2Key = getProgressionKey('', role, 'T2')
  const t1Progression = progression[t1Key]
  const t2Progression = progression[t2Key]

  // Check if this role is T1 or T2 today
  const tierToday = getTierForDay(role, currentDay)
  const isT1Today = tierToday === 'T1'
  const isT2Today = tierToday === 'T2'

  return (
    <div
      data-testid={`main-lift-card-${role}`}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
    >
      {/* Header with lift name */}
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{displayName}</h3>

      {/* T1 and T2 rows */}
      <div className="space-y-2">
        <TierRow
          tier="T1"
          progression={t1Progression}
          weightUnit={weightUnit}
          isActiveToday={isT1Today}
        />
        <TierRow
          tier="T2"
          progression={t2Progression}
          weightUnit={weightUnit}
          isActiveToday={isT2Today}
        />
      </div>
    </div>
  )
}
