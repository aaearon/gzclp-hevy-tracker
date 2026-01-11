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
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_BASE_DELAY = 1000 // 1 second

/** Status codes that should trigger a retry */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])

export interface HevyClientConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  maxRetries?: number
  retryBaseDelay?: number
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
  private readonly maxRetries: number
  private readonly retryBaseDelay: number

  constructor(config: HevyClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES
    this.retryBaseDelay = config.retryBaseDelay ?? DEFAULT_RETRY_BASE_DELAY
  }

  /**
   * Sleep for a specified duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => { setTimeout(resolve, ms) })
  }

  /**
   * Calculate delay for retry with exponential backoff.
   * @param attempt - Current attempt number (0-indexed)
   * @param retryAfter - Optional Retry-After header value in seconds
   */
  private calculateRetryDelay(attempt: number, retryAfter?: number | null): number {
    if (retryAfter !== undefined && retryAfter !== null && retryAfter > 0) {
      // Respect Retry-After header, but cap at 60 seconds
      return Math.min(retryAfter * 1000, 60000)
    }
    // Exponential backoff: 1s, 2s, 4s, ...
    return this.retryBaseDelay * Math.pow(2, attempt)
  }

  /**
   * Make a single HTTP request attempt.
   * @returns Response object or throws an error
   */
  private async makeRequestAttempt(
    endpoint: string,
    options: RequestInit,
    externalSignal?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => { controller.abort() }, this.timeout)

    // Listen for external abort and propagate to internal controller
    const abortHandler = () => { controller.abort() }
    externalSignal?.addEventListener('abort', abortHandler)

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
      externalSignal?.removeEventListener('abort', abortHandler)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      externalSignal?.removeEventListener('abort', abortHandler)

      if (error instanceof Error && error.name === 'AbortError') {
        // Distinguish between external abort (unmount) and timeout
        if (externalSignal?.aborted) {
          throw new HevyApiClientError('Request cancelled', 0)
        }
        throw new HevyApiClientError('Request timeout', 0)
      }

      throw new HevyApiClientError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      )
    }
  }

  /**
   * Make an authenticated request to the Hevy API with automatic retry.
   * Retries on transient errors (429, 5xx) with exponential backoff.
   * @param endpoint - API endpoint path
   * @param options - Fetch options
   * @param externalSignal - Optional AbortSignal for external cancellation (e.g., on unmount)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    externalSignal?: AbortSignal
  ): Promise<T> {
    let lastError: HevyApiClientError | null = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      // Check if externally aborted before attempting
      if (externalSignal?.aborted) {
        throw new HevyApiClientError('Request cancelled', 0)
      }

      try {
        const response = await this.makeRequestAttempt(endpoint, options, externalSignal)

        // Handle successful responses
        if (response.ok) {
          return (await response.json()) as T
        }

        // Check if this is a retryable status code
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
          // Extract Retry-After header for 429 responses
          const retryAfter = response.status === 429
            ? parseInt(response.headers.get('Retry-After') ?? '', 10) || null
            : null

          const delay = this.calculateRetryDelay(attempt, retryAfter)
          await this.sleep(delay)
          continue
        }

        // Non-retryable error or max retries reached
        await this.handleErrorResponse(response)
      } catch (error) {
        // Re-throw if it's a known error type that shouldn't be retried
        if (error instanceof HevyApiClientError) {
          // Don't retry auth errors or cancellation
          if (error instanceof HevyAuthError || error.status === 0) {
            throw error
          }
          lastError = error

          // Retry on rate limit or server errors
          if ((error instanceof HevyRateLimitError || error.status >= 500) && attempt < this.maxRetries) {
            const retryAfter = error instanceof HevyRateLimitError ? error.retryAfter : null
            const delay = this.calculateRetryDelay(attempt, retryAfter)
            await this.sleep(delay)
            continue
          }
          throw error
        }

        // Unknown error - wrap and throw
        throw new HevyApiClientError(
          error instanceof Error ? error.message : 'Unknown error',
          0
        )
      }
    }

    // Should not reach here, but just in case
    throw lastError ?? new HevyApiClientError('Request failed after retries', 0)
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
      errorBody?.error ?? `HTTP ${String(response.status)}`,
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
    params: PaginatedRequest = {},
    signal?: AbortSignal
  ): Promise<ExerciseTemplatesResponse> {
    const query = this.buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 100,
    })
    return this.request<ExerciseTemplatesResponse>(`/exercise_templates${query}`, {}, signal)
  }

  /**
   * Get all exercise templates (handles pagination automatically).
   */
  async getAllExerciseTemplates(signal?: AbortSignal): Promise<ExerciseTemplatesResponse['exercise_templates']> {
    const allTemplates: ExerciseTemplatesResponse['exercise_templates'] = []
    let page = 1
    const pageSize = 100

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const response = await this.getExerciseTemplates({ page, pageSize }, signal)
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
  async getWorkouts(params: PaginatedRequest = {}, signal?: AbortSignal): Promise<WorkoutsResponse> {
    const query = this.buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    })
    return this.request<WorkoutsResponse>(`/workouts${query}`, {}, signal)
  }

  /**
   * Get total workout count.
   */
  async getWorkoutCount(signal?: AbortSignal): Promise<WorkoutCountResponse> {
    return this.request<WorkoutCountResponse>('/workouts/count', {}, signal)
  }

  /**
   * Get a single workout by ID.
   */
  async getWorkout(workoutId: string, signal?: AbortSignal): Promise<Workout> {
    const response = await this.request<{ workout: Workout }>(`/workouts/${workoutId}`, {}, signal)
    return response.workout
  }

  /**
   * Get all workouts (handles pagination automatically).
   * Used for calculating "weeks on program" from workout history.
   */
  async getAllWorkouts(signal?: AbortSignal): Promise<Workout[]> {
    const allWorkouts: Workout[] = []
    let page = 1
    const pageSize = 10

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const response = await this.getWorkouts({ page, pageSize }, signal)
      allWorkouts.push(...response.workouts)

      if (page >= response.page_count) {
        break
      }
      page++
    }

    return allWorkouts
  }

  // ===========================================================================
  // Routines
  // ===========================================================================

  /**
   * Get routines with pagination.
   * Max pageSize: 10
   */
  async getRoutines(params: PaginatedRequest = {}, signal?: AbortSignal): Promise<RoutinesResponse> {
    const query = this.buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    })
    return this.request<RoutinesResponse>(`/routines${query}`, {}, signal)
  }

  /**
   * Get all routines (handles pagination automatically).
   */
  async getAllRoutines(signal?: AbortSignal): Promise<Routine[]> {
    const allRoutines: Routine[] = []
    let page = 1
    const pageSize = 10

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const response = await this.getRoutines({ page, pageSize }, signal)
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
  async getRoutine(routineId: string, signal?: AbortSignal): Promise<Routine> {
    const response = await this.request<{ routine: Routine }>(`/routines/${routineId}`, {}, signal)
    return response.routine
  }

  /**
   * Create a new routine.
   */
  async createRoutine(request: CreateRoutineRequest, signal?: AbortSignal): Promise<Routine> {
    const response = await this.request<{ routine: Routine }>('/routines', {
      method: 'POST',
      body: JSON.stringify(request),
    }, signal)
    return response.routine
  }

  /**
   * Update an existing routine.
   */
  async updateRoutine(routineId: string, request: UpdateRoutineRequest, signal?: AbortSignal): Promise<Routine> {
    const response = await this.request<{ routine: Routine }>(`/routines/${routineId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, signal)
    return response.routine
  }

  // ===========================================================================
  // Connection Test
  // ===========================================================================

  /**
   * Test the API connection by fetching workout count.
   * Throws HevyAuthError if API key is invalid.
   */
  async testConnection(signal?: AbortSignal): Promise<boolean> {
    try {
      await this.getWorkoutCount(signal)
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
