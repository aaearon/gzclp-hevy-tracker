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
  DayImportData,
  Tier,
  MainLiftWeights,
  DetectedWeight,
  MainLiftRole,
} from '@/types/state'
import { MAIN_LIFT_ROLES } from '@/types/state'
import { getT1RoleForDay, getT2RoleForDay, T1_MAPPING, T2_MAPPING } from './role-utils'
import { WEIGHT_ROUNDING } from './constants'
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
 * Extract T1, T2, and T3 exercises from a routine assigned to a specific day.
 * Returns a DayImportData structure with t1, t2, and t3s.
 */
function extractDayExercises(
  day: GZCLPDay,
  routine: Routine,
  warnings: ImportWarning[]
): DayImportData {
  // Get the T1 and T2 roles for this day
  const t1Role = getT1RoleForDay(day)
  const t2Role = getT2RoleForDay(day)

  // Position 0 (first exercise) → T1 with the day's T1 role
  const t1Exercise = routine.exercises[0]
  const t1: ImportedExercise | null = t1Exercise
    ? extractExercise(t1Exercise, 'T1', warnings, t1Role)
    : null

  // Position 1 (second exercise) → T2 with the day's T2 role
  const t2Exercise = routine.exercises[1]
  let t2: ImportedExercise | null = null
  if (t2Exercise) {
    t2 = extractExercise(t2Exercise, 'T2', warnings, t2Role)
  } else {
    warnings.push({
      type: 'no_t2',
      day,
      message: `${day}: No T2 exercise found. Only ${routine.exercises.length} exercise(s) in routine.`,
    })
  }

  // Positions 2+ → T3s (no limit)
  const t3s: ImportedExercise[] = []
  for (let i = 2; i < routine.exercises.length; i++) {
    const exercise = routine.exercises[i]
    if (exercise) {
      t3s.push(extractExercise(exercise, 'T3', warnings, 't3'))
    }
  }

  return { day, t1, t2, t3s }
}

// =============================================================================
// Main Extraction Function
// =============================================================================

/**
 * Create an empty DayImportData for unassigned days.
 */
function createEmptyDayData(day: GZCLPDay): DayImportData {
  return { day, t1: null, t2: null, t3s: [] }
}

/**
 * Extract exercises and progression state from assigned routines.
 * Returns per-day structure with T1, T2, and T3s for each day.
 * Deduplicates exercises by templateId using "first wins" strategy.
 *
 * @param routines - Map of routine ID to full Routine object
 * @param assignment - Which routine is assigned to which day
 * @returns Per-day import data, warnings, and routine IDs
 */
export function extractFromRoutines(
  routines: Map<string, Routine>,
  assignment: RoutineAssignment
): ImportResult {
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

  // Extract T1/T2/T3s from each assigned day
  const rawByDay: Record<GZCLPDay, DayImportData> = {
    A1: createEmptyDayData('A1'),
    B1: createEmptyDayData('B1'),
    A2: createEmptyDayData('A2'),
    B2: createEmptyDayData('B2'),
  }

  for (const day of GZCLP_DAYS) {
    const routineId = assignment[day]
    if (!routineId) continue

    const routine = routines.get(routineId)
    if (!routine) continue

    rawByDay[day] = extractDayExercises(day, routine, warnings)
  }

  // Deduplicate exercises by templateId - "first wins" strategy
  // Collect all exercises from all days, dedupe, then replace references
  const seen = new Map<string, ImportedExercise>()
  const assignedMainLifts = new Set<ExerciseRole>()

  // Process in order: A1, B1, A2, B2 (first occurrence wins)
  for (const day of GZCLP_DAYS) {
    const dayData = rawByDay[day]

    // Process T1
    if (dayData.t1) {
      dayData.t1 = dedupeExercise(dayData.t1, seen, assignedMainLifts)
    }

    // Process T2
    if (dayData.t2) {
      dayData.t2 = dedupeExercise(dayData.t2, seen, assignedMainLifts)
    }

    // Process T3s
    dayData.t3s = dayData.t3s.map((t3) => dedupeExercise(t3, seen, assignedMainLifts))
  }

  // Build the final byDay structure (already deduplicated in place)
  const byDay = rawByDay as Record<GZCLPDay, DayImportData>

  return {
    byDay,
    warnings,
    routineIds: assignment,
  }
}

/**
 * Deduplicate an exercise using "first wins" strategy.
 * Returns the deduplicated exercise (either existing or newly added).
 */
function dedupeExercise(
  exercise: ImportedExercise,
  seen: Map<string, ImportedExercise>,
  assignedMainLifts: Set<ExerciseRole>
): ImportedExercise {
  const existing = seen.get(exercise.templateId)

  if (existing) {
    // Already seen - return existing (first wins)
    return existing
  }

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
  return deduped
}

/**
 * Check if a role is a main lift (exclusive) role.
 */
function isMainLift(role: ExerciseRole): boolean {
  return role === 'squat' || role === 'bench' || role === 'ohp' || role === 'deadlift'
}

// =============================================================================
// Main Lift Weight Detection
// =============================================================================

/**
 * T2/T1 ratio for estimation when only one tier is detected.
 * T2 is typically ~70% of T1 weight.
 */
const T2_T1_RATIO = 0.7

/**
 * Round weight to nearest increment.
 */
function roundToIncrement(weight: number): number {
  const increment = WEIGHT_ROUNDING.kg // Default to kg
  return Math.round(weight / increment) * increment
}

/**
 * Get the day where a role is T1.
 */
function getT1Day(role: MainLiftRole): GZCLPDay {
  for (const [day, r] of Object.entries(T1_MAPPING)) {
    if (r === role) return day as GZCLPDay
  }
  return 'A1' // Fallback
}

/**
 * Get the day where a role is T2.
 */
function getT2Day(role: MainLiftRole): GZCLPDay {
  for (const [day, r] of Object.entries(T2_MAPPING)) {
    if (r === role) return day as GZCLPDay
  }
  return 'A2' // Fallback
}

/**
 * Detect T1 and T2 weights for all four main lifts from assigned routines.
 *
 * Returns an array of MainLiftWeights, one for each main lift role.
 * If a tier is not detected (routine not assigned), it will be estimated
 * from the other tier and hasWarning will be true.
 *
 * @param routines - Map of routine ID to full Routine object
 * @param assignment - Which routine is assigned to which day
 * @returns Array of detected weights for each main lift
 */
export function detectMainLiftWeights(
  routines: Map<string, Routine>,
  assignment: RoutineAssignment
): MainLiftWeights[] {
  const results: MainLiftWeights[] = []

  for (const role of MAIN_LIFT_ROLES) {
    // Find which days this role is T1 and T2
    const t1Day = getT1Day(role)
    const t2Day = getT2Day(role)

    // Try to get T1 weight from the routine assigned to the T1 day
    let t1Detected: DetectedWeight | null = null
    const t1RoutineId = assignment[t1Day]
    if (t1RoutineId) {
      const t1Routine = routines.get(t1RoutineId)
      if (t1Routine && t1Routine.exercises.length > 0) {
        // T1 is position 0
        const t1Exercise = t1Routine.exercises[0]
        if (t1Exercise) {
          const weight = extractWeight(t1Exercise.sets)
          const stageResult = detectStage(t1Exercise.sets, 'T1')
          t1Detected = {
            weight,
            source: `${t1Day}, position 1`,
            stage: stageResult?.stage ?? 0,
          }
        }
      }
    }

    // Try to get T2 weight from the routine assigned to the T2 day
    let t2Detected: DetectedWeight | null = null
    const t2RoutineId = assignment[t2Day]
    if (t2RoutineId) {
      const t2Routine = routines.get(t2RoutineId)
      if (t2Routine && t2Routine.exercises.length > 1) {
        // T2 is position 1
        const t2Exercise = t2Routine.exercises[1]
        if (t2Exercise) {
          const weight = extractWeight(t2Exercise.sets)
          const stageResult = detectStage(t2Exercise.sets, 'T2')
          t2Detected = {
            weight,
            source: `${t2Day}, position 2`,
            stage: stageResult?.stage ?? 0,
          }
        }
      }
    }

    // Determine hasWarning and estimate missing tier if needed
    let hasWarning = false
    let t1Final: DetectedWeight
    let t2Final: DetectedWeight

    if (t1Detected && t2Detected) {
      // Both detected
      t1Final = t1Detected
      t2Final = t2Detected
    } else if (t1Detected && !t2Detected) {
      // Only T1 detected, estimate T2
      hasWarning = true
      t1Final = t1Detected
      t2Final = {
        weight: roundToIncrement(t1Detected.weight * T2_T1_RATIO),
        source: `Estimated from T1 (${t1Day})`,
        stage: 0,
      }
    } else if (!t1Detected && t2Detected) {
      // Only T2 detected, estimate T1
      hasWarning = true
      t1Final = {
        weight: roundToIncrement(t2Detected.weight / T2_T1_RATIO),
        source: `Estimated from T2 (${t2Day})`,
        stage: 0,
      }
      t2Final = t2Detected
    } else {
      // Neither detected - use placeholder with warning
      hasWarning = true
      t1Final = {
        weight: 0,
        source: 'Not detected',
        stage: 0,
      }
      t2Final = {
        weight: 0,
        source: 'Not detected',
        stage: 0,
      }
    }

    results.push({
      role,
      t1: t1Final,
      t2: t2Final,
      hasWarning,
    })
  }

  return results
}
