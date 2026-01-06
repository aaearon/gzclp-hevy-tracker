/**
 * GZCLP Program Constants
 *
 * Defines all the fixed values for the GZCLP program structure.
 */

import type { ExerciseRole, GZCLPDay, Stage, Tier, WeightUnit } from '@/types/state'

// =============================================================================
// Exercise Role System (NEW)
// =============================================================================

/** All 5 roles in display order (warmup/cooldown removed - Task 2.1b) */
export const EXERCISE_ROLES: readonly ExerciseRole[] = [
  'squat',
  'bench',
  'ohp',
  'deadlift',
  't3',
] as const

/** Metadata for each role for display purposes */
export const ROLE_DISPLAY: Record<
  ExerciseRole,
  { label: string; description: string; color: string }
> = {
  squat: {
    label: 'Squat',
    description: 'T1 on A1, T2 on A2',
    color: 'blue',
  },
  bench: {
    label: 'Bench Press',
    description: 'T1 on A2, T2 on A1',
    color: 'blue',
  },
  ohp: {
    label: 'Overhead Press',
    description: 'T1 on B1, T2 on B2',
    color: 'blue',
  },
  deadlift: {
    label: 'Deadlift',
    description: 'T1 on B2, T2 on B1',
    color: 'blue',
  },
  t3: {
    label: 'T3 Accessory',
    description: 'Accessory work (3x15+)',
    color: 'green',
  },
}

// =============================================================================
// Tier Definitions
// =============================================================================

export const TIERS = ['T1', 'T2', 'T3'] as const satisfies readonly Tier[]

// =============================================================================
// Day Definitions
// =============================================================================

export const GZCLP_DAYS = ['A1', 'B1', 'A2', 'B2'] as const satisfies readonly GZCLPDay[]

export const DAY_CYCLE: Record<GZCLPDay, GZCLPDay> = {
  A1: 'B1',
  B1: 'A2',
  A2: 'B2',
  B2: 'A1',
}

// =============================================================================
// Rep Schemes by Tier and Stage
// =============================================================================

export interface RepScheme {
  sets: number
  reps: number
  amrap: boolean
  display: string
}

export const T1_SCHEMES: Record<Stage, RepScheme> = {
  0: { sets: 5, reps: 3, amrap: true, display: '5x3+' },
  1: { sets: 6, reps: 2, amrap: true, display: '6x2+' },
  2: { sets: 10, reps: 1, amrap: true, display: '10x1+' },
}

export const T2_SCHEMES: Record<Stage, RepScheme> = {
  0: { sets: 3, reps: 10, amrap: false, display: '3x10' },
  1: { sets: 3, reps: 8, amrap: false, display: '3x8' },
  2: { sets: 3, reps: 6, amrap: false, display: '3x6' },
}

export const T3_SCHEME: RepScheme = {
  sets: 3,
  reps: 15,
  amrap: true,
  display: '3x15+',
}

export function getRepScheme(tier: Tier, stage: Stage): RepScheme {
  switch (tier) {
    case 'T1':
      return T1_SCHEMES[stage]
    case 'T2':
      return T2_SCHEMES[stage]
    case 'T3':
      return T3_SCHEME
  }
}

// =============================================================================
// Warmup Configuration
// =============================================================================

export const WARMUP_CONFIG = {
  percentages: [0, 0.5, 0.7, 0.85], // 0 = bar only
  reps: [10, 5, 3, 2],
  minWeight: 20, // kg - bar weight
} as const

// =============================================================================
// Weight Increments
// =============================================================================

export const WEIGHT_INCREMENTS: Record<WeightUnit, { upper: number; lower: number }> = {
  kg: { upper: 2.5, lower: 5 },
  lbs: { upper: 5, lower: 10 },
}

export const DELOAD_PERCENTAGE = 0.85

// Weight rounding increments (for deload calculations)
export const WEIGHT_ROUNDING: Record<WeightUnit, number> = {
  kg: 2.5,
  lbs: 5,
}

// =============================================================================
// Rest Timers (in seconds)
// =============================================================================

export const DEFAULT_REST_TIMERS: Record<Tier, number> = {
  T1: 240, // 4 minutes (spec: 3-5 min midpoint)
  T2: 150, // 2.5 minutes (spec: 2-3 min midpoint)
  T3: 75, // 1.25 minutes (spec: 60-90s midpoint)
}

// =============================================================================
// T3 Success Threshold
// =============================================================================

export const T3_SUCCESS_THRESHOLD = 25 // Total reps needed to progress

// =============================================================================
// State Versioning
// =============================================================================

export const CURRENT_STATE_VERSION = '2.1.0'

// =============================================================================
// localStorage Key
// =============================================================================

export const STORAGE_KEY = 'gzclp_state'

// =============================================================================
// Initial T3 Schedule
// =============================================================================

/** Initial empty T3 schedule for new state */
export const INITIAL_T3_SCHEDULE: Record<GZCLPDay, string[]> = {
  A1: [],
  B1: [],
  A2: [],
  B2: [],
}

// =============================================================================
// Stage Detection Patterns for Import
// =============================================================================

/**
 * T1 patterns: [setCount, repCount, stageIndex]
 * Used to detect which stage a T1 exercise is in based on logged sets.
 */
export const T1_STAGE_PATTERNS: readonly [number, number, Stage][] = [
  [5, 3, 0], // 5x3+ = Stage 1 (index 0)
  [6, 2, 1], // 6x2+ = Stage 2 (index 1)
  [10, 1, 2], // 10x1+ = Stage 3 (index 2)
]

/**
 * T2 patterns: [setCount, repCount, stageIndex]
 * Used to detect which stage a T2 exercise is in based on logged sets.
 */
export const T2_STAGE_PATTERNS: readonly [number, number, Stage][] = [
  [3, 10, 0], // 3x10 = Stage 1 (index 0)
  [3, 8, 1], // 3x8 = Stage 2 (index 1)
  [3, 6, 2], // 3x6 = Stage 3 (index 2)
]

/**
 * Display names for stages.
 */
export const STAGE_DISPLAY: Record<Stage, string> = {
  0: 'Stage 1',
  1: 'Stage 2',
  2: 'Stage 3',
}

/**
 * Rep scheme display strings by tier and stage.
 */
export const STAGE_SCHEMES: Record<'T1' | 'T2', Record<Stage, string>> = {
  T1: {
    0: '5x3+',
    1: '6x2+',
    2: '10x1+',
  },
  T2: {
    0: '3x10',
    1: '3x8',
    2: '3x6',
  },
}
