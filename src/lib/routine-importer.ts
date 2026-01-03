/**
 * Routine Importer
 *
 * Extracts exercises and progression state from assigned Hevy routines.
 * Maps exercises to GZCLP roles based on position and day.
 */

import type { Routine, RoutineExerciseRead } from '@/types/hevy'
import type {
  ExerciseRole,
  GZCLPDay,
  AvailableRoutine,
  RoutineAssignment,
  ImportedExercise,
  ImportWarning,
  ImportResult,
  Tier,
} from '@/types/state'
import { getT1RoleForDay, getT2RoleForDay } from './role-utils'
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
 * Extract a single exercise from a routine position.
 * The tier is derived from the position (T1, T2, or T3).
 * The role is optionally assigned based on day position.
 */
function extractExercise(
  exercise: RoutineExerciseRead,
  tier: Tier,
  warnings: ImportWarning[],
  role?: ExerciseRole
): ImportedExercise {
  const stageResult = detectStage(exercise.sets, tier)
  const weight = extractWeight(exercise.sets)

  // Generate warnings
  if (stageResult === null) {
    warnings.push({
      type: 'stage_unknown',
      message: `${exercise.title}: Could not detect stage. Please select manually.`,
    })
  }

  if (weight === 0) {
    warnings.push({
      type: 'weight_null',
      message: `${exercise.title}: No weight found. Set to 0.`,
    })
  }

  // Count normal sets for original scheme display
  const normalSets = exercise.sets.filter((s) => s.type === 'normal')
  const setCount = normalSets.length
  const modalReps = getModalReps(normalSets)

  return {
    ...(role !== undefined && { role }),
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

  // Get the T1 and T2 roles for this day
  const t1Role = getT1RoleForDay(day)
  const t2Role = getT2RoleForDay(day)

  // Position 0 (first exercise) → T1 with the day's T1 role
  const t1Exercise = routine.exercises[0]
  if (t1Exercise) {
    exercises.push(extractExercise(t1Exercise, 'T1', warnings, t1Role))
  }

  // Position 1 (second exercise) → T2 with the day's T2 role
  const t2Exercise = routine.exercises[1]
  if (t2Exercise) {
    exercises.push(extractExercise(t2Exercise, 'T2', warnings, t2Role))
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
  // Import up to 3 T3 exercises from positions 2, 3, 4
  for (let i = 2; i < a1Routine.exercises.length && i < 5; i++) {
    const exercise = a1Routine.exercises[i]
    if (exercise) {
      exercises.push(extractExercise(exercise, 'T3', warnings, 't3'))
    }
  }

  return exercises
}

// =============================================================================
// Main Extraction Function
// =============================================================================

/**
 * Extract exercises and progression state from assigned routines.
 * Deduplicates exercises by templateId to avoid role conflicts.
 *
 * @param routines - Map of routine ID to full Routine object
 * @param assignment - Which routine is assigned to which day
 * @returns Extracted exercises and any warnings
 */
export function extractFromRoutines(
  routines: Map<string, Routine>,
  assignment: RoutineAssignment
): ImportResult {
  const rawExercises: ImportedExercise[] = []
  const warnings: ImportWarning[] = []

  // Check for duplicate routines
  const assignedIds = Object.entries(assignment)
    .filter((entry): entry is [string, string] => entry[1] !== null)
    .map(([day, id]) => ({ day: day as GZCLPDay, id }))

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
    rawExercises.push(...dayExercises)
  }

  // Extract T3s from A1 only
  const a1RoutineId = assignment.A1
  const a1Routine = a1RoutineId ? routines.get(a1RoutineId) : undefined
  const t3Exercises = extractT3Exercises(a1Routine, warnings)
  rawExercises.push(...t3Exercises)

  // Deduplicate by templateId - keep first occurrence's data but clear
  // auto-assigned role if there would be a conflict
  const seen = new Map<string, ImportedExercise>()
  const assignedMainLifts = new Set<ExerciseRole>()

  for (const exercise of rawExercises) {
    const existing = seen.get(exercise.templateId)

    if (!existing) {
      // First time seeing this templateId
      // Only keep the role if it's a main lift AND not already assigned
      let roleToAssign = exercise.role
      if (roleToAssign && isMainLift(roleToAssign)) {
        if (assignedMainLifts.has(roleToAssign)) {
          // This role is already assigned to another exercise - leave unassigned
          roleToAssign = undefined
        } else {
          assignedMainLifts.add(roleToAssign)
        }
      }
      // Build the deduplicated exercise, conditionally including role
      const deduped: ImportedExercise = {
        templateId: exercise.templateId,
        name: exercise.name,
        detectedWeight: exercise.detectedWeight,
        detectedStage: exercise.detectedStage,
        stageConfidence: exercise.stageConfidence,
        originalSetCount: exercise.originalSetCount,
        originalRepScheme: exercise.originalRepScheme,
        ...(exercise.userWeight !== undefined && { userWeight: exercise.userWeight }),
        ...(exercise.userStage !== undefined && { userStage: exercise.userStage }),
        ...(roleToAssign !== undefined && { role: roleToAssign }),
      }
      seen.set(exercise.templateId, deduped)
    }
    // If duplicate templateId, skip it (keep first occurrence)
  }

  const exercises = Array.from(seen.values())

  return {
    exercises,
    warnings,
    routineIds: assignment,
  }
}

/**
 * Check if a role is a main lift (exclusive) role.
 */
function isMainLift(role: ExerciseRole): boolean {
  return role === 'squat' || role === 'bench' || role === 'ohp' || role === 'deadlift'
}
