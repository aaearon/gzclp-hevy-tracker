/**
 * Hevy API TypeScript Contracts
 *
 * Generated from official OpenAPI spec: docs/openapi-spec.json
 * API Version: 0.0.1
 * Base URL: https://api.hevyapp.com/v1/
 *
 * Authentication: api-key header (UUID format)
 * Note: API key requires Hevy Pro subscription
 */

// =============================================================================
// Common Types
// =============================================================================

export type SetType = 'warmup' | 'normal' | 'failure' | 'dropset';

export type MuscleGroup =
  | 'abdominals' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quadriceps' | 'hamstrings' | 'calves' | 'glutes' | 'abductors' | 'adductors'
  | 'lats' | 'upper_back' | 'traps' | 'lower_back' | 'chest'
  | 'cardio' | 'neck' | 'full_body' | 'other';

export type EquipmentCategory =
  | 'none' | 'barbell' | 'dumbbell' | 'kettlebell' | 'machine'
  | 'plate' | 'resistance_band' | 'suspension' | 'other';

export type ExerciseType =
  | 'weight_reps' | 'reps_only' | 'bodyweight_reps' | 'bodyweight_assisted_reps'
  | 'duration' | 'weight_duration' | 'distance_duration' | 'short_distance_weight';

// =============================================================================
// Pagination
// =============================================================================

export interface PaginatedRequest {
  page?: number;      // Default: 1, must be >= 1
  pageSize?: number;  // Default: 5, max varies by endpoint
}

export interface PaginatedResponse {
  page: number;
  page_count: number;
}

// =============================================================================
// Exercise Templates
// =============================================================================

export interface ExerciseTemplate {
  id: string;
  title: string;
  type: ExerciseType;
  primary_muscle_group: MuscleGroup;
  secondary_muscle_groups: MuscleGroup[];
  is_custom: boolean;
}

export interface ExerciseTemplatesResponse extends PaginatedResponse {
  exercise_templates: ExerciseTemplate[];
}

// GET /v1/exercise_templates - pageSize max: 100

// =============================================================================
// Workouts (Read)
// =============================================================================

export interface WorkoutSet {
  index: number;
  type: SetType;
  weight_kg: number | null;
  reps: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null;  // 6 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10
  custom_metric: number | null;
}

export interface WorkoutExercise {
  index: number;
  title: string;
  notes: string;
  exercise_template_id: string;
  supersets_id: number | null;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  routine_id: string;
  description: string;
  start_time: string;   // ISO 8601
  end_time: string;     // ISO 8601
  updated_at: string;   // ISO 8601
  created_at: string;   // ISO 8601
  exercises: WorkoutExercise[];
}

export interface WorkoutsResponse extends PaginatedResponse {
  workouts: Workout[];
}

export interface WorkoutCountResponse {
  workout_count: number;
}

// GET /v1/workouts - pageSize max: 10
// GET /v1/workouts/count
// GET /v1/workouts/{workoutId}

// =============================================================================
// Workout Events (for incremental sync)
// =============================================================================

export interface UpdatedWorkoutEvent {
  type: 'updated';
  workout: Workout;
}

export interface DeletedWorkoutEvent {
  type: 'deleted';
  id: string;
  deleted_at: string;
}

export type WorkoutEvent = UpdatedWorkoutEvent | DeletedWorkoutEvent;

export interface WorkoutEventsResponse extends PaginatedResponse {
  events: WorkoutEvent[];
}

// GET /v1/workouts/events?since={ISO8601} - pageSize max: 10

// =============================================================================
// Routines (Read)
// =============================================================================

export interface RoutineSetRead {
  index: number;
  type: SetType;
  weight_kg: number | null;
  reps: number | null;
  rep_range: { start: number | null; end: number | null } | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  custom_metric: number | null;
}

export interface RoutineExerciseRead {
  index: number;
  title: string;
  rest_seconds: number;
  notes: string;
  exercise_template_id: string;
  supersets_id: number | null;
  sets: RoutineSetRead[];
}

export interface Routine {
  id: string;
  title: string;
  folder_id: number | null;
  updated_at: string;
  created_at: string;
  exercises: RoutineExerciseRead[];
}

export interface RoutinesResponse extends PaginatedResponse {
  routines: Routine[];
}

export interface RoutineResponse {
  routine: Routine;
}

// GET /v1/routines - pageSize max: 10
// GET /v1/routines/{routineId}

// =============================================================================
// Routines (Write)
// =============================================================================

export interface RoutineSetWrite {
  type: SetType;
  weight_kg?: number | null;
  reps?: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  custom_metric?: number | null;
  rep_range?: { start: number | null; end: number | null } | null;
}

export interface RoutineExerciseWrite {
  exercise_template_id: string;
  superset_id?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  sets: RoutineSetWrite[];
}

export interface CreateRoutineRequest {
  routine: {
    title: string;
    folder_id?: number | null;
    notes?: string;
    exercises: RoutineExerciseWrite[];
  };
}

export interface UpdateRoutineRequest {
  routine: {
    title: string;
    notes?: string | null;
    exercises: RoutineExerciseWrite[];
  };
}

// POST /v1/routines - returns Routine
// PUT /v1/routines/{routineId} - returns Routine

// =============================================================================
// Routine Folders
// =============================================================================

export interface RoutineFolder {
  id: number;
  index: number;
  title: string;
  updated_at: string;
  created_at: string;
}

export interface RoutineFoldersResponse extends PaginatedResponse {
  routine_folders: RoutineFolder[];
}

export interface CreateRoutineFolderRequest {
  routine_folder: {
    title: string;
  };
}

// GET /v1/routine_folders - pageSize max: 10
// POST /v1/routine_folders - returns RoutineFolder

// =============================================================================
// Exercise History
// =============================================================================

export interface ExerciseHistoryEntry {
  workout_id: string;
  workout_title: string;
  workout_start_time: string;
  workout_end_time: string;
  exercise_template_id: string;
  weight_kg: number | null;
  reps: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  custom_metric: number | null;
  set_type: SetType;
}

export interface ExerciseHistoryResponse {
  exercise_history: ExerciseHistoryEntry[];
}

// GET /v1/exercise_history/{exerciseTemplateId}?start_date={ISO8601}&end_date={ISO8601}

// =============================================================================
// Error Response
// =============================================================================

export interface HevyApiError {
  error: string;
}

// Common errors:
// 400 - Invalid request body / Invalid page size
// 401 - Unauthorized (invalid API key)
// 403 - Routine limit exceeded / Custom exercise limit exceeded
// 404 - Resource not found
// 500 - Internal Server Error

// =============================================================================
// API Client Interface
// =============================================================================

export interface HevyApiConfig {
  apiKey: string;
  baseUrl?: string;  // Default: 'https://api.hevyapp.com/v1'
}

/**
 * API Endpoint Summary for GZCLP Tracker:
 *
 * REQUIRED ENDPOINTS:
 * - GET /v1/exercise_templates      - Fetch exercises for setup wizard
 * - GET /v1/workouts                - Fetch completed workouts for analysis
 * - GET /v1/routines                - List routines to find existing GZCLP
 * - POST /v1/routines               - Create GZCLP routines (A1/B1/A2/B2)
 * - PUT /v1/routines/{id}           - Update routines with new weights/schemes
 *
 * OPTIONAL ENDPOINTS:
 * - GET /v1/workouts/events         - Incremental sync (optimization)
 * - GET /v1/exercise_history/{id}   - Exercise-specific history for charts
 * - POST /v1/routine_folders        - Create "GZCLP" folder for organization
 */
