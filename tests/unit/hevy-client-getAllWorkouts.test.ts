/**
 * HevyClient.getAllWorkouts() Tests
 *
 * Tests for the pagination logic of getAllWorkouts method.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HevyClient } from '@/lib/hevy-client'
import type { WorkoutsResponse, Workout } from '@/types/hevy'
import { createMockWorkout } from '../helpers/workout-mocks'

// =============================================================================
// Test Setup
// =============================================================================

function createMockWorkoutsResponse(
  workouts: Workout[],
  page: number,
  pageCount: number
): WorkoutsResponse {
  return {
    page,
    page_count: pageCount,
    workouts,
  }
}

describe('HevyClient.getAllWorkouts', () => {
  let client: HevyClient
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
    client = new HevyClient({ apiKey: 'test-api-key' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return empty array when no workouts exist', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => createMockWorkoutsResponse([], 1, 0),
    })

    const workouts = await client.getAllWorkouts()

    expect(workouts).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('should return all workouts from single page', async () => {
    const mockWorkouts = [
      createMockWorkout('routine-1', { id: 'workout-1' }),
      createMockWorkout('routine-2', { id: 'workout-2' }),
    ]

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => createMockWorkoutsResponse(mockWorkouts, 1, 1),
    })

    const workouts = await client.getAllWorkouts()

    expect(workouts).toHaveLength(2)
    expect(workouts[0].id).toBe('workout-1')
    expect(workouts[1].id).toBe('workout-2')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('should paginate through multiple pages', async () => {
    const page1Workouts = Array.from({ length: 10 }, (_, i) =>
      createMockWorkout('routine-1', { id: `workout-p1-${i}` })
    )
    const page2Workouts = Array.from({ length: 10 }, (_, i) =>
      createMockWorkout('routine-1', { id: `workout-p2-${i}` })
    )
    const page3Workouts = Array.from({ length: 5 }, (_, i) =>
      createMockWorkout('routine-1', { id: `workout-p3-${i}` })
    )

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockWorkoutsResponse(page1Workouts, 1, 3),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockWorkoutsResponse(page2Workouts, 2, 3),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockWorkoutsResponse(page3Workouts, 3, 3),
      })

    const workouts = await client.getAllWorkouts()

    expect(workouts).toHaveLength(25)
    expect(fetchMock).toHaveBeenCalledTimes(3)

    // Verify pagination params in URLs
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('page=1'),
      expect.any(Object)
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('page=2'),
      expect.any(Object)
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('page=3'),
      expect.any(Object)
    )
  })

  it('should stop pagination when page reaches page_count', async () => {
    const page1Workouts = Array.from({ length: 10 }, (_, i) =>
      createMockWorkout('routine-1', { id: `workout-${i}` })
    )
    const page2Workouts = Array.from({ length: 3 }, (_, i) =>
      createMockWorkout('routine-1', { id: `workout-p2-${i}` })
    )

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockWorkoutsResponse(page1Workouts, 1, 2),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createMockWorkoutsResponse(page2Workouts, 2, 2),
      })

    const workouts = await client.getAllWorkouts()

    expect(workouts).toHaveLength(13)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('should handle API errors gracefully', async () => {
    // Create a client with no retries to avoid test timeout
    const noRetryClient = new HevyClient({ apiKey: 'test-api-key', maxRetries: 0 })
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    })

    await expect(noRetryClient.getAllWorkouts()).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('should handle rate limit errors', async () => {
    // Create a client with no retries for this test to avoid timeout
    const noRetryClient = new HevyClient({ apiKey: 'test-api-key', maxRetries: 0 })
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '60' }),
      json: async () => ({}),
    })

    await expect(noRetryClient.getAllWorkouts()).rejects.toThrow('Rate limit')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('should handle large workout histories (50+ pages)', async () => {
    // Simulate 50 pages of workouts (500 total)
    const totalPages = 50

    for (let page = 1; page <= totalPages; page++) {
      const workouts = Array.from({ length: 10 }, (_, i) =>
        createMockWorkout('routine-1', { id: `workout-p${page}-${i}` })
      )
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockWorkoutsResponse(workouts, page, totalPages),
      })
    }

    const workouts = await client.getAllWorkouts()

    expect(workouts).toHaveLength(500)
    expect(fetchMock).toHaveBeenCalledTimes(50)
  })
})
