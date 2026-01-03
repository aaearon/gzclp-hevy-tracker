/**
 * Routine Importer
 *
 * Extracts exercises and progression state from assigned Hevy routines.
 * Maps exercises to GZCLP slots based on position and day.
 */

import type { Routine, RoutineExerciseRead } from '@/types/hevy'
import type {
  GZCLPDay,
  GZCLPSlot,
  AvailableRoutine,
  RoutineAssignment,
  ImportedExercise,
  ImportWarning,
  ImportResult,
} from '@/types/state'
import { SLOT_MAPPING, T3_SLOTS } from './constants'
import { detectStage, extractWeight } from './stage-detector'

// =============================================================================
// Constants
// =============================================================================

const GZCLP_DAYS: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

// =============================================================================
// Routine Summary Conversion
// =============================================================================

/**
 * Convert a Hevy Routine to an AvailableRoutine summary for display.
 */
export function toAvailableRoutine(routine: Routine): AvailableRoutine {
  return {
    id: routine.id,
    title: routine.title,
    exerciseCount: routine.exercises.length,
    exercisePreview: routine.exercises.slice(0, 3).map((ex) => ex.title),
    updatedAt: routine.updated_at,
  }
}

// =============================================================================
// Exercise Extraction
// =============================================================================

/**
 * Determine the tier from a slot name.
 */
function getTierFromSlot(slot: GZCLPSlot): 'T1' | 'T2' | 'T3' {
  if (slot.startsWith('t1_')) return 'T1'
  if (slot.startsWith('t2_')) return 'T2'
  return 'T3'
}

/**
 * Extract a single exercise from a routine position.
 */
function extractExercise(
  exercise: RoutineExerciseRead,
  slot: GZCLPSlot,
  warnings: ImportWarning[]
): ImportedExercise {
  const tier = getTierFromSlot(slot)
  const stageResult = detectStage(exercise.sets, tier)
  const weight = extractWeight(exercise.sets)

  // Generate warnings
  if (stageResult === null) {
    warnings.push({
      type: 'stage_unknown',
      slot,
      message: `${exercise.title}: Could not detect stage. Please select manually.`,
    })
  }

  if (weight === 0) {
    warnings.push({
      type: 'weight_null',
      slot,
      message: `${exercise.title}: No weight found. Set to 0.`,
    })
  }

  // Count normal sets for original scheme display
  const normalSets = exercise.sets.filter((s) => s.type === 'normal')
  const setCount = normalSets.length
  const modalReps = getModalReps(normalSets)

  return {
    slot,
    templateId: exercise.exercise_template_id,
    name: exercise.title,
    detectedWeight: weight,
    detectedStage: stageResult?.stage ?? 0,
    stageConfidence: stageResult?.confidence ?? 'manual',
    originalSetCount: setCount,
    originalRepScheme: stageResult?.repScheme ?? `${setCount}x${modalReps}`,
  }
}

/**
 * Get modal (most common) rep count from sets.
 */
function getModalReps(sets: RoutineExerciseRead['sets']): number {
  if (sets.length === 0) return 0

  const counts = new Map<number, number>()
  for (const set of sets) {
    const reps = set.reps ?? 0
    counts.set(reps, (counts.get(reps) ?? 0) + 1)
  }

  let maxCount = 0
  let mode = 0
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      mode = value
    }
  }

  return mode
}

/**
 * Extract T1 and T2 exercises from a routine assigned to a specific day.
 */
function extractDayExercises(
  day: GZCLPDay,
  routine: Routine,
  warnings: ImportWarning[]
): ImportedExercise[] {
  const exercises: ImportedExercise[] = []
  const slots = SLOT_MAPPING[day]

  // Position 0 (first exercise) → T1 slot
  const t1Exercise = routine.exercises[0]
  if (t1Exercise) {
    exercises.push(extractExercise(t1Exercise, slots.t1, warnings))
  }

  // Position 1 (second exercise) → T2 slot
  const t2Exercise = routine.exercises[1]
  if (t2Exercise) {
    exercises.push(extractExercise(t2Exercise, slots.t2, warnings))
  } else {
    warnings.push({
      type: 'no_t2',
      day,
      message: `${day}: No T2 exercise found. Only ${routine.exercises.length} exercise(s) in routine.`,
    })
  }

  return exercises
}

/**
 * Extract T3 exercises from the A1 routine only.
 * T3s are shared across all days in GZCLP.
 */
function extractT3Exercises(
  a1Routine: Routine | undefined,
  warnings: ImportWarning[]
): ImportedExercise[] {
  if (!a1Routine) return []

  const exercises: ImportedExercise[] = []

  // T3s start at position 2 (after T1 and T2)
  for (let i = 2; i < a1Routine.exercises.length && i < 5; i++) {
    const exercise = a1Routine.exercises[i]
    const slot = T3_SLOTS[i - 2] // t3_1, t3_2, t3_3

    if (slot && exercise) {
      exercises.push(extractExercise(exercise, slot, warnings))
    }
  }

  return exercises
}

// =============================================================================
// Main Extraction Function
// =============================================================================

/**
 * Extract exercises and progression state from assigned routines.
 *
 * @param routines - Map of routine ID to full Routine object
 * @param assignment - Which routine is assigned to which day
 * @returns Extracted exercises and any warnings
 */
export function extractFromRoutines(
  routines: Map<string, Routine>,
  assignment: RoutineAssignment
): ImportResult {
  const exercises: ImportedExercise[] = []
  const warnings: ImportWarning[] = []

  // Check for duplicate routines
  const assignedIds = Object.entries(assignment)
    .filter(([_, id]) => id !== null)
    .map(([day, id]) => ({ day: day as GZCLPDay, id: id as string }))

  const idCounts = new Map<string, GZCLPDay[]>()
  for (const { day, id } of assignedIds) {
    const days = idCounts.get(id) ?? []
    days.push(day)
    idCounts.set(id, days)
  }

  for (const [, days] of idCounts) {
    if (days.length > 1) {
      warnings.push({
        type: 'duplicate_routine',
        message: `Warning: same routine selected for ${days.join(' and ')}.`,
      })
    }
  }

  // Extract T1/T2 from each assigned day
  for (const day of GZCLP_DAYS) {
    const routineId = assignment[day]
    if (!routineId) continue

    const routine = routines.get(routineId)
    if (!routine) continue

    const dayExercises = extractDayExercises(day, routine, warnings)
    exercises.push(...dayExercises)
  }

  // Extract T3s from A1 only
  const a1RoutineId = assignment.A1
  const a1Routine = a1RoutineId ? routines.get(a1RoutineId) : undefined
  const t3Exercises = extractT3Exercises(a1Routine, warnings)
  exercises.push(...t3Exercises)

  return {
    exercises,
    warnings,
    routineIds: assignment,
  }
}
