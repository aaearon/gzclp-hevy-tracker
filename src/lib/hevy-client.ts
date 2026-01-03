/**
 * Hevy API Client
 *
 * HTTP client for interacting with the Hevy API.
 * Handles authentication, pagination, rate limiting, and error handling.
 */

import type {
  ExerciseTemplatesResponse,
  WorkoutsResponse,
  WorkoutCountResponse,
  Workout,
  RoutinesResponse,
  Routine,
  CreateRoutineRequest,
  UpdateRoutineRequest,
  HevyApiError,
  PaginatedRequest,
} from '@/types/hevy'

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_BASE_URL = 'https://api.hevyapp.com/v1'
const DEFAULT_TIMEOUT = 30000 // 30 seconds

export interface HevyClientConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// =============================================================================
// Error Types
// =============================================================================

export class HevyApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public originalError?: HevyApiError
  ) {
    super(message)
    this.name = 'HevyApiClientError'
  }
}

export class HevyRateLimitError extends HevyApiClientError {
  constructor(
    public retryAfter: number | null
  ) {
    super('Rate limit exceeded', 429)
    this.name = 'HevyRateLimitError'
  }
}

export class HevyAuthError extends HevyApiClientError {
  constructor() {
    super('Invalid API key', 401)
    this.name = 'HevyAuthError'
  }
}

// =============================================================================
// Client Implementation
// =============================================================================

export class HevyClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(config: HevyClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT
  }

  /**
   * Make an authenticated request to the Hevy API.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => { controller.abort() }, this.timeout)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string> | undefined),
        },
      })

      clearTimeout(timeoutId)

      // Handle error responses
      if (!response.ok) {
        await this.handleErrorResponse(response)
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof HevyApiClientError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new HevyApiClientError('Request timeout', 0)
      }

      throw new HevyApiClientError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      )
    }
  }

  /**
   * Handle non-2xx responses from the API.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    // Rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      throw new HevyRateLimitError(retryAfter ? parseInt(retryAfter, 10) : null)
    }

    // Authentication error
    if (response.status === 401) {
      throw new HevyAuthError()
    }

    // Try to parse error body
    let errorBody: HevyApiError | undefined
    try {
      errorBody = (await response.json()) as HevyApiError
    } catch {
      // Ignore parse errors
    }

    throw new HevyApiClientError(
      errorBody?.error ?? `HTTP ${response.status}`,
      response.status,
      errorBody
    )
  }

  /**
   * Build query string from pagination params.
   */
  private buildQueryString(params: PaginatedRequest): string {
    const searchParams = new URLSearchParams()
    if (params.page !== undefined) {
      searchParams.set('page', params.page.toString())
    }
    if (params.pageSize !== undefined) {
      searchParams.set('pageSize', params.pageSize.toString())
    }
    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  // ===========================================================================
  // Exercise Templates
  // ===========================================================================

  /**
   * Get exercise templates with pagination.
   * Max pageSize: 100
   */
  async getExerciseTemplates(
    params: PaginatedRequest = {}
  ): Promise<ExerciseTemplatesResponse> {
    const query = this.buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 100,
    })
    return this.request<ExerciseTemplatesResponse>(`/exercise_templates${query}`)
  }

  /**
   * Get all exercise templates (handles pagination automatically).
   */
  async getAllExerciseTemplates(): Promise<ExerciseTemplatesResponse['exercise_templates']> {
    const allTemplates: ExerciseTemplatesResponse['exercise_templates'] = []
    let page = 1
    const pageSize = 100

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const response = await this.getExerciseTemplates({ page, pageSize })
      allTemplates.push(...response.exercise_templates)

      if (page >= response.page_count) {
        break
      }
      page++
    }

    return allTemplates
  }

  // ===========================================================================
  // Workouts
  // ===========================================================================

  /**
   * Get workouts with pagination (most recent first).
   * Max pageSize: 10
   */
  async getWorkouts(params: PaginatedRequest = {}): Promise<WorkoutsResponse> {
    const query = this.buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    })
    return this.request<WorkoutsResponse>(`/workouts${query}`)
  }

  /**
   * Get total workout count.
   */
  async getWorkoutCount(): Promise<WorkoutCountResponse> {
    return this.request<WorkoutCountResponse>('/workouts/count')
  }

  /**
   * Get a single workout by ID.
   */
  async getWorkout(workoutId: string): Promise<Workout> {
    const response = await this.request<{ workout: Workout }>(`/workouts/${workoutId}`)
    return response.workout
  }

  // ===========================================================================
  // Routines
  // ===========================================================================

  /**
   * Get routines with pagination.
   * Max pageSize: 10
   */
  async getRoutines(params: PaginatedRequest = {}): Promise<RoutinesResponse> {
    const query = this.buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    })
    return this.request<RoutinesResponse>(`/routines${query}`)
  }

  /**
   * Get all routines (handles pagination automatically).
   */
  async getAllRoutines(): Promise<Routine[]> {
    const allRoutines: Routine[] = []
    let page = 1
    const pageSize = 10

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const response = await this.getRoutines({ page, pageSize })
      allRoutines.push(...response.routines)

      if (page >= response.page_count) {
        break
      }
      page++
    }

    return allRoutines
  }

  /**
   * Get a single routine by ID.
   */
  async getRoutine(routineId: string): Promise<Routine> {
    const response = await this.request<{ routine: Routine }>(`/routines/${routineId}`)
    return response.routine
  }

  /**
   * Create a new routine.
   */
  async createRoutine(request: CreateRoutineRequest): Promise<Routine> {
    const response = await this.request<{ routine: Routine }>('/routines', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return response.routine
  }

  /**
   * Update an existing routine.
   */
  async updateRoutine(routineId: string, request: UpdateRoutineRequest): Promise<Routine> {
    const response = await this.request<{ routine: Routine }>(`/routines/${routineId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    })
    return response.routine
  }

  // ===========================================================================
  // Connection Test
  // ===========================================================================

  /**
   * Test the API connection by fetching workout count.
   * Throws HevyAuthError if API key is invalid.
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getWorkoutCount()
      return true
    } catch (error) {
      if (error instanceof HevyAuthError) {
        throw error
      }
      throw error
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new HevyClient instance.
 */
export function createHevyClient(apiKey: string): HevyClient {
  return new HevyClient({ apiKey })
}
