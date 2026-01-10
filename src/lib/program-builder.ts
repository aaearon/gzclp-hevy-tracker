/**
 * Program Builder
 *
 * Pure functions to build GZCLPState from wizard inputs.
 * Used by SetupWizard to atomically create program state.
 */

import { generateId } from '@/utils/id'
import { createInitialState, createDefaultSettings } from '@/lib/state-factory'
import { getProgressionKey, getT1RoleForDay, getT2RoleForDay } from '@/lib/role-utils'
import type {
  GZCLPState,
  GZCLPDay,
  ImportResult,
  ImportedExercise,
  ExerciseConfig,
  ProgressionState,
  ExerciseHistory,
  WeightUnit,
  MainLiftRole,
  Stage,
} from '@/types/state'

// =============================================================================
// Import Path Types
// =============================================================================

export interface ImportPathParams {
  importResult: ImportResult
  selectedDay: GZCLPDay
  apiKey: string
  unit: WeightUnit
  workoutsPerWeek: number
  workoutStats: {
    createdAt: string
    totalWorkouts: number
    mostRecentWorkoutDate: string | null
  }
  progressionHistory: Record<string, ExerciseHistory>
}

// =============================================================================
// Create Path Types
// =============================================================================

export interface CreatePathParams {
  assignments: {
    mainLifts: Record<MainLiftRole, string | null>
    t3Exercises: Record<GZCLPDay, string[]>
  }
  weights: Record<string, number>
  exerciseTemplates: { id: string; title: string }[]
  selectedDay: GZCLPDay
  apiKey: string
  unit: WeightUnit
  workoutsPerWeek: number
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a progression state entry for an exercise.
 */
function createProgressionEntry(
  exerciseId: string,
  weight: number,
  stage: Stage,
  lastWorkoutId: string | null = null,
  lastWorkoutDate: string | null = null,
  amrapRecord = 0
): ProgressionState {
  return {
    exerciseId,
    currentWeight: weight,
    baseWeight: weight,
    stage,
    lastWorkoutId,
    lastWorkoutDate,
    amrapRecord,
  }
}

/**
 * Get the effective weight from an imported exercise.
 * Priority: userWeight > suggestion > detected
 */
function getEffectiveWeight(imported: ImportedExercise): number {
  return (
    imported.userWeight ??
    imported.analysis?.suggestion?.suggestedWeight ??
    imported.detectedWeight
  )
}

/**
 * Get the effective stage from an imported exercise.
 * Priority: userStage > suggestion > detected
 */
function getEffectiveStage(imported: ImportedExercise): Stage {
  return (
    imported.userStage ??
    imported.analysis?.suggestion?.suggestedStage ??
    imported.detectedStage
  )
}

// =============================================================================
// Import Path Builder
// =============================================================================

/**
 * Build complete GZCLPState from import wizard data.
 *
 * This function:
 * 1. Creates exercises with deduplication (same templateId = same exercise)
 * 2. Creates progression entries with correct keys (role-tier for main lifts, exerciseId for T3)
 * 3. Builds t3Schedule from byDay structure
 * 4. Sets all metadata (workout stats, history, settings)
 */
export function buildImportProgramState(params: ImportPathParams): GZCLPState {
  const {
    importResult,
    selectedDay,
    apiKey,
    unit,
    workoutsPerWeek,
    workoutStats,
    progressionHistory,
  } = params

  const { byDay, routineIds } = importResult

  // Start with initial state as base (ensures schema compliance)
  const state = createInitialState(unit)

  // Override with import-specific values
  state.apiKey = apiKey
  state.program.currentDay = selectedDay
  state.program.workoutsPerWeek = workoutsPerWeek
  state.program.createdAt = workoutStats.createdAt
  state.program.hevyRoutineIds = { ...routineIds }
  state.totalWorkouts = workoutStats.totalWorkouts
  state.mostRecentWorkoutDate = workoutStats.mostRecentWorkoutDate
  state.progressionHistory = progressionHistory
  state.settings = createDefaultSettings(unit)

  // Track saved exercise IDs for deduplication (templateId -> exerciseId)
  const savedExerciseIds = new Map<string, string>()
  // Track which main lift progression keys have been set (to avoid duplicates)
  const processedProgressionKeys = new Set<string>()

  // Process all days
  const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

  for (const day of days) {
    const dayData = byDay[day]

    // Process T1 exercise
    if (dayData.t1) {
      const imported = dayData.t1
      const dayRole = getT1RoleForDay(day)

      // Add exercise if not already added
      let exerciseId = savedExerciseIds.get(imported.templateId)
      if (!exerciseId) {
        exerciseId = generateId()
        const exercise: ExerciseConfig = {
          id: exerciseId,
          hevyTemplateId: imported.templateId,
          name: imported.name,
          role: dayRole,
        }
        state.exercises[exerciseId] = exercise
        savedExerciseIds.set(imported.templateId, exerciseId)
      }

      // Set T1 progression using role-tier key
      const t1Key = getProgressionKey(exerciseId, dayRole, 'T1')
      if (!processedProgressionKeys.has(t1Key)) {
        const weight = getEffectiveWeight(imported)
        const stage = getEffectiveStage(imported)

        state.progression[t1Key] = createProgressionEntry(
          exerciseId,
          weight,
          stage,
          imported.analysis?.performance?.workoutId ?? null,
          imported.analysis?.performance?.workoutDate ?? null,
          imported.analysis?.suggestion?.amrapReps ?? 0
        )
        processedProgressionKeys.add(t1Key)
      }
    }

    // Process T2 exercise
    if (dayData.t2) {
      const imported = dayData.t2
      const dayRole = getT2RoleForDay(day)

      // Add exercise if not already added
      let exerciseId = savedExerciseIds.get(imported.templateId)
      if (!exerciseId) {
        exerciseId = generateId()
        const exercise: ExerciseConfig = {
          id: exerciseId,
          hevyTemplateId: imported.templateId,
          name: imported.name,
          role: dayRole,
        }
        state.exercises[exerciseId] = exercise
        savedExerciseIds.set(imported.templateId, exerciseId)
      }

      // Set T2 progression using role-tier key
      const t2Key = getProgressionKey(exerciseId, dayRole, 'T2')
      if (!processedProgressionKeys.has(t2Key)) {
        const weight = getEffectiveWeight(imported)
        const stage = getEffectiveStage(imported)

        state.progression[t2Key] = createProgressionEntry(
          exerciseId,
          weight,
          stage,
          imported.analysis?.performance?.workoutId ?? null,
          imported.analysis?.performance?.workoutDate ?? null,
          0 // T2 doesn't track AMRAP
        )
        processedProgressionKeys.add(t2Key)
      }
    }

    // Process T3 exercises
    for (const t3 of dayData.t3s) {
      if (!t3.templateId) continue

      // Add exercise if not already added
      let exerciseId = savedExerciseIds.get(t3.templateId)
      if (!exerciseId) {
        exerciseId = generateId()
        const exercise: ExerciseConfig = {
          id: exerciseId,
          hevyTemplateId: t3.templateId,
          name: t3.name,
          role: t3.role ?? 't3',
        }
        state.exercises[exerciseId] = exercise
        savedExerciseIds.set(t3.templateId, exerciseId)
      }

      // Create T3 progression if not already set
      // (handles case where same template used for both main lift and T3)
      if (!state.progression[exerciseId]) {
        const weight = getEffectiveWeight(t3)
        state.progression[exerciseId] = createProgressionEntry(
          exerciseId,
          weight,
          0, // T3 always stage 0
          t3.analysis?.performance?.workoutId ?? null,
          t3.analysis?.performance?.workoutDate ?? null,
          t3.analysis?.suggestion?.amrapReps ?? 0
        )
      }

      // Add to t3Schedule for this day
      state.t3Schedule[day].push(exerciseId)
    }
  }

  return state
}

// =============================================================================
// Create Path Builder
// =============================================================================

/**
 * Build complete GZCLPState from create wizard data.
 *
 * This function:
 * 1. Creates exercises from assignments
 * 2. Creates progression entries with initial weights
 * 3. Builds t3Schedule with deduplication
 * 4. Sets all metadata
 */
export function buildCreateProgramState(params: CreatePathParams): GZCLPState {
  const {
    assignments,
    weights,
    exerciseTemplates,
    selectedDay,
    apiKey,
    unit,
    workoutsPerWeek,
  } = params

  // Start with initial state as base
  const state = createInitialState(unit)

  // Override with create-specific values
  state.apiKey = apiKey
  state.program.currentDay = selectedDay
  state.program.workoutsPerWeek = workoutsPerWeek
  state.settings = createDefaultSettings(unit)

  // Create main lift exercises and progressions
  const mainLiftRoles: MainLiftRole[] = ['squat', 'bench', 'ohp', 'deadlift']

  for (const role of mainLiftRoles) {
    const templateId = assignments.mainLifts[role]
    if (!templateId) continue

    const template = exerciseTemplates.find((t) => t.id === templateId)
    if (!template) continue

    const exerciseId = generateId()
    const exercise: ExerciseConfig = {
      id: exerciseId,
      hevyTemplateId: templateId,
      name: template.title,
      role,
    }
    state.exercises[exerciseId] = exercise

    // Get initial weight (from weights map, keyed by role)
    const initialWeight = weights[role] ?? 0

    // Create both T1 and T2 progressions for this main lift
    const t1Key = getProgressionKey(exerciseId, role, 'T1')
    const t2Key = getProgressionKey(exerciseId, role, 'T2')

    state.progression[t1Key] = createProgressionEntry(exerciseId, initialWeight, 0)
    state.progression[t2Key] = createProgressionEntry(exerciseId, initialWeight, 0)
  }

  // Create T3 exercises with deduplication
  const savedT3Ids = new Map<string, string>() // templateId -> exerciseId
  const days: GZCLPDay[] = ['A1', 'B1', 'A2', 'B2']

  for (const day of days) {
    for (const templateId of assignments.t3Exercises[day]) {
      if (!templateId) continue

      // Deduplicate: same T3 on multiple days uses same exerciseId
      let exerciseId = savedT3Ids.get(templateId)
      if (!exerciseId) {
        const template = exerciseTemplates.find((t) => t.id === templateId)
        if (!template) continue

        exerciseId = generateId()
        const exercise: ExerciseConfig = {
          id: exerciseId,
          hevyTemplateId: templateId,
          name: template.title,
          role: 't3',
        }
        state.exercises[exerciseId] = exercise
        savedT3Ids.set(templateId, exerciseId)

        // Set T3 weight (keyed by t3_templateId)
        const t3Weight = weights[`t3_${templateId}`] ?? 0

        // T3 uses exerciseId as progression key
        state.progression[exerciseId] = createProgressionEntry(exerciseId, t3Weight, 0)
      }

      state.t3Schedule[day].push(exerciseId)
    }
  }

  return state
}
