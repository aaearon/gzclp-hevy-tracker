/**
 * Routine Importer Internal Contracts
 *
 * TypeScript interfaces for the routine import module.
 * These are internal contracts - no new API endpoints are added.
 *
 * Date: 2026-01-03
 * Branch: 002-routine-selection-wizard
 */

import type { GZCLPDay, GZCLPSlot } from '@/types/state';
import type { Routine, RoutineExerciseRead, RoutineSetRead } from '@/types/hevy';

// =============================================================================
// Routine Source Selection
// =============================================================================

export type RoutineSourceMode = 'create' | 'import';

export interface RoutineSourceChoice {
  mode: RoutineSourceMode;
  hasExistingRoutines: boolean;
}

// =============================================================================
// Available Routines (for selector display)
// =============================================================================

export interface AvailableRoutine {
  id: string;
  title: string;
  exerciseCount: number;
  exercisePreview: string[];
  updatedAt: string;
}

/**
 * Convert Hevy Routine to AvailableRoutine summary.
 */
export function toAvailableRoutine(routine: Routine): AvailableRoutine;

// =============================================================================
// Routine Assignment
// =============================================================================

export interface RoutineAssignment {
  A1: string | null;
  B1: string | null;
  A2: string | null;
  B2: string | null;
}

export const EMPTY_ASSIGNMENT: RoutineAssignment = {
  A1: null,
  B1: null,
  A2: null,
  B2: null,
};

// =============================================================================
// Stage Detection
// =============================================================================

export type StageConfidence = 'high' | 'manual';

export interface StageDetectionResult {
  stage: 0 | 1 | 2;
  confidence: StageConfidence;
  setCount: number;
  repScheme: string;  // e.g., "5x3+", "3x10"
}

/**
 * Detect progression stage from routine sets.
 *
 * @param sets - All sets for the exercise (will filter to 'normal' internally)
 * @param tier - 'T1' or 'T2' (T3 always returns stage 0)
 * @returns Detection result or null if cannot detect
 */
export function detectStage(
  sets: RoutineSetRead[],
  tier: 'T1' | 'T2' | 'T3'
): StageDetectionResult | null;

// =============================================================================
// Weight Extraction
// =============================================================================

/**
 * Extract working weight from routine sets.
 *
 * @param sets - All sets for the exercise (will filter to 'normal' internally)
 * @returns Weight in kg, or 0 if no weight found
 */
export function extractWeight(sets: RoutineSetRead[]): number;

// =============================================================================
// Imported Exercise
// =============================================================================

export interface ImportedExercise {
  slot: GZCLPSlot;
  templateId: string;
  name: string;

  detectedWeight: number;
  detectedStage: 0 | 1 | 2;
  stageConfidence: StageConfidence;

  originalSetCount: number;
  originalRepScheme: string;

  userWeight?: number;
  userStage?: 0 | 1 | 2;
}

// =============================================================================
// Import Warnings
// =============================================================================

export type ImportWarningType =
  | 'no_t2'
  | 'stage_unknown'
  | 'duplicate_routine'
  | 'weight_null';

export interface ImportWarning {
  type: ImportWarningType;
  day?: GZCLPDay;
  slot?: GZCLPSlot;
  message: string;
}

// =============================================================================
// Import Result
// =============================================================================

export interface ImportResult {
  exercises: ImportedExercise[];
  warnings: ImportWarning[];
  routineIds: RoutineAssignment;
}

/**
 * Extract exercises and progression state from assigned routines.
 *
 * @param routines - Map of day to full Routine object
 * @param assignment - Which routine is assigned to which day
 * @returns Extracted exercises and any warnings
 */
export function extractFromRoutines(
  routines: Map<string, Routine>,
  assignment: RoutineAssignment
): ImportResult;

// =============================================================================
// Slot Mapping
// =============================================================================

export interface DaySlotMapping {
  t1: GZCLPSlot;
  t2: GZCLPSlot;
}

export const SLOT_MAPPING: Record<GZCLPDay, DaySlotMapping> = {
  A1: { t1: 't1_squat', t2: 't2_bench' },
  B1: { t1: 't1_ohp', t2: 't2_deadlift' },
  A2: { t1: 't1_bench', t2: 't2_squat' },
  B2: { t1: 't1_deadlift', t2: 't2_ohp' },
};

export const T3_SLOTS: GZCLPSlot[] = ['t3_1', 't3_2', 't3_3'];

// =============================================================================
// Stage Detection Patterns
// =============================================================================

/**
 * T1 patterns: [setCount, repCount, stageIndex]
 */
export const T1_STAGE_PATTERNS: readonly [number, number, 0 | 1 | 2][] = [
  [5, 3, 0],   // 5x3+ = Stage 1
  [6, 2, 1],   // 6x2+ = Stage 2
  [10, 1, 2],  // 10x1+ = Stage 3
];

/**
 * T2 patterns: [setCount, repCount, stageIndex]
 */
export const T2_STAGE_PATTERNS: readonly [number, number, 0 | 1 | 2][] = [
  [3, 10, 0],  // 3x10 = Stage 1
  [3, 8, 1],   // 3x8 = Stage 2
  [3, 6, 2],   // 3x6 = Stage 3
];

/**
 * Display names for stages.
 */
export const STAGE_DISPLAY: Record<0 | 1 | 2, string> = {
  0: 'Stage 1',
  1: 'Stage 2',
  2: 'Stage 3',
};

/**
 * Rep scheme display strings.
 */
export const STAGE_SCHEMES: Record<'T1' | 'T2', Record<0 | 1 | 2, string>> = {
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
};
