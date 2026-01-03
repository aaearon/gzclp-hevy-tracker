/**
 * GZCLP Program Constants
 *
 * Defines all the fixed values for the GZCLP program structure.
 */

import type { GZCLPDay, GZCLPSlot, Stage, Tier, WeightUnit } from '@/types/state'

// =============================================================================
// Tier Definitions
// =============================================================================

export const TIERS = ['T1', 'T2', 'T3'] as const satisfies readonly Tier[]

// =============================================================================
// Slot Definitions
// =============================================================================

export const T1_SLOTS = ['t1_squat', 't1_bench', 't1_ohp', 't1_deadlift'] as const
export const T2_SLOTS = ['t2_squat', 't2_bench', 't2_ohp', 't2_deadlift'] as const
export const T3_SLOTS = ['t3_1', 't3_2', 't3_3'] as const

export const ALL_SLOTS = [...T1_SLOTS, ...T2_SLOTS, ...T3_SLOTS] as const satisfies readonly GZCLPSlot[]

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

// Slot to Day mapping: which T1/T2 slots are used on which days
export const DAY_EXERCISES: Record<GZCLPDay, { t1: GZCLPSlot; t2: GZCLPSlot }> = {
  A1: { t1: 't1_squat', t2: 't2_bench' },
  B1: { t1: 't1_ohp', t2: 't2_deadlift' },
  A2: { t1: 't1_bench', t2: 't2_squat' },
  B2: { t1: 't1_deadlift', t2: 't2_ohp' },
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
  T1: 180, // 3 minutes
  T2: 120, // 2 minutes
  T3: 60, // 1 minute
}

// =============================================================================
// T3 Success Threshold
// =============================================================================

export const T3_SUCCESS_THRESHOLD = 25 // Total reps needed to progress

// =============================================================================
// Slot Display Names
// =============================================================================

export const SLOT_NAMES: Record<GZCLPSlot, string> = {
  t1_squat: 'Squat (T1)',
  t1_bench: 'Bench Press (T1)',
  t1_ohp: 'Overhead Press (T1)',
  t1_deadlift: 'Deadlift (T1)',
  t2_squat: 'Squat (T2)',
  t2_bench: 'Bench Press (T2)',
  t2_ohp: 'Overhead Press (T2)',
  t2_deadlift: 'Deadlift (T2)',
  t3_1: 'T3 Exercise 1',
  t3_2: 'T3 Exercise 2',
  t3_3: 'T3 Exercise 3',
}

export const SLOT_DEFAULT_MUSCLE_GROUP: Record<GZCLPSlot, 'upper' | 'lower'> = {
  t1_squat: 'lower',
  t1_bench: 'upper',
  t1_ohp: 'upper',
  t1_deadlift: 'lower',
  t2_squat: 'lower',
  t2_bench: 'upper',
  t2_ohp: 'upper',
  t2_deadlift: 'lower',
  t3_1: 'upper', // Default, can be changed by user
  t3_2: 'upper',
  t3_3: 'lower',
}

// =============================================================================
// State Versioning
// =============================================================================

export const CURRENT_STATE_VERSION = '1.0.0'

// =============================================================================
// localStorage Key
// =============================================================================

export const STORAGE_KEY = 'gzclp_state'

// =============================================================================
// Slot Mapping for Import (Day → T1/T2 slots)
// =============================================================================

/**
 * Fixed mapping from GZCLP day to T1/T2 exercise slots.
 * Used during routine import to determine which slot each exercise belongs to.
 */
export const SLOT_MAPPING: Record<GZCLPDay, { t1: GZCLPSlot; t2: GZCLPSlot }> = {
  A1: { t1: 't1_squat', t2: 't2_bench' },
  B1: { t1: 't1_ohp', t2: 't2_deadlift' },
  A2: { t1: 't1_bench', t2: 't2_squat' },
  B2: { t1: 't1_deadlift', t2: 't2_ohp' },
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
