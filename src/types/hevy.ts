/**
 * Re-export Hevy API types from contracts
 *
 * NOTE: This file re-exports types from the contracts directory.
 * Do NOT duplicate type definitions here.
 */

export type {
  // Common Types
  SetType,
  MuscleGroup,
  EquipmentCategory,
  ExerciseType,

  // Pagination
  PaginatedRequest,
  PaginatedResponse,

  // Exercise Templates
  ExerciseTemplate,
  ExerciseTemplatesResponse,

  // Workouts
  WorkoutSet,
  WorkoutExercise,
  Workout,
  WorkoutsResponse,
  WorkoutCountResponse,

  // Workout Events
  UpdatedWorkoutEvent,
  DeletedWorkoutEvent,
  WorkoutEvent,
  WorkoutEventsResponse,

  // Routines (Read)
  RoutineSetRead,
  RoutineExerciseRead,
  Routine,
  RoutinesResponse,
  RoutineResponse,

  // Routines (Write)
  RoutineSetWrite,
  RoutineExerciseWrite,
  CreateRoutineRequest,
  UpdateRoutineRequest,

  // Routine Folders
  RoutineFolder,
  RoutineFoldersResponse,
  CreateRoutineFolderRequest,

  // Exercise History
  ExerciseHistoryEntry,
  ExerciseHistoryResponse,

  // Errors
  HevyApiError,

  // API Client
  HevyApiConfig,
} from '../../specs/001-gzclp-hevy-tracker/contracts/hevy-api'
