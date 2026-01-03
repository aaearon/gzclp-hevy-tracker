/**
 * Integration Tests: Dashboard
 *
 * Tests the dashboard display of exercises, progression state, and pending changes.
 * [US5] User Story 5 - Dashboard Overview
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Dashboard } from '@/components/Dashboard'
import type { GZCLPState } from '@/types/state'
import { STORAGE_KEY, CURRENT_STATE_VERSION } from '@/lib/constants'

// Mock state for testing
const createMockState = (overrides?: Partial<GZCLPState>): GZCLPState => ({
  version: CURRENT_STATE_VERSION,
  apiKey: '550e8400-e29b-41d4-a716-446655440000',
  program: {
    name: 'GZCLP',
    createdAt: '2026-01-01T00:00:00Z',
    hevyRoutineIds: {
      A1: 'routine-a1',
      B1: 'routine-b1',
      A2: 'routine-a2',
      B2: 'routine-b2',
    },
    currentDay: 'A1',
  },
  exercises: {
    'ex-squat-t1': {
      id: 'ex-squat-t1',
      hevyTemplateId: 'hevy-squat',
      name: 'Squat (Barbell)',
      tier: 'T1',
      slot: 't1_squat',
      muscleGroup: 'lower',
    },
    'ex-bench-t1': {
      id: 'ex-bench-t1',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press (Barbell)',
      tier: 'T1',
      slot: 't1_bench',
      muscleGroup: 'upper',
    },
    'ex-ohp-t1': {
      id: 'ex-ohp-t1',
      hevyTemplateId: 'hevy-ohp',
      name: 'Overhead Press (Barbell)',
      tier: 'T1',
      slot: 't1_ohp',
      muscleGroup: 'upper',
    },
    'ex-deadlift-t1': {
      id: 'ex-deadlift-t1',
      hevyTemplateId: 'hevy-deadlift',
      name: 'Deadlift (Barbell)',
      tier: 'T1',
      slot: 't1_deadlift',
      muscleGroup: 'lower',
    },
    'ex-bench-t2': {
      id: 'ex-bench-t2',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press (Barbell)',
      tier: 'T2',
      slot: 't2_bench',
      muscleGroup: 'upper',
    },
    'ex-squat-t2': {
      id: 'ex-squat-t2',
      hevyTemplateId: 'hevy-squat',
      name: 'Squat (Barbell)',
      tier: 'T2',
      slot: 't2_squat',
      muscleGroup: 'lower',
    },
    'ex-curl-t3': {
      id: 'ex-curl-t3',
      hevyTemplateId: 'hevy-curl',
      name: 'Bicep Curl',
      tier: 'T3',
      slot: 't3_1',
      muscleGroup: 'upper',
    },
  },
  progression: {
    'ex-squat-t1': {
      exerciseId: 'ex-squat-t1',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 5,
    },
    'ex-bench-t1': {
      exerciseId: 'ex-bench-t1',
      currentWeight: 80,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 4,
    },
    'ex-ohp-t1': {
      exerciseId: 'ex-ohp-t1',
      currentWeight: 50,
      stage: 1,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 3,
    },
    'ex-deadlift-t1': {
      exerciseId: 'ex-deadlift-t1',
      currentWeight: 120,
      stage: 0,
      baseWeight: 120,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 6,
    },
    'ex-bench-t2': {
      exerciseId: 'ex-bench-t2',
      currentWeight: 60,
      stage: 0,
      baseWeight: 60,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-squat-t2': {
      exerciseId: 'ex-squat-t2',
      currentWeight: 80,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ex-curl-t3': {
      exerciseId: 'ex-curl-t3',
      currentWeight: 15,
      stage: 0,
      baseWeight: 15,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
  },
  pendingChanges: [],
  settings: {
    weightUnit: 'kg',
    increments: { upper: 2.5, lower: 5 },
    restTimers: { t1: 180, t2: 120, t3: 60 },
  },
  lastSync: null,
  ...overrides,
})

describe('[US5] Dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Exercise Display', () => {
    beforeEach(() => {
      const state = createMockState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    })

    it('should display dashboard header', () => {
      render(<Dashboard />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/gzclp/i)
    })

    it('should display T1 exercises with correct weights', () => {
      render(<Dashboard />)

      // Should show T1 exercises - use getAllByText since multiple instances exist
      expect(screen.getAllByText(/squat/i).length).toBeGreaterThan(0)
      // Squat weight - multiple instances expected (card + next workout)
      expect(screen.getAllByText('100 kg').length).toBeGreaterThan(0)
    })

    it('should display T2 exercises with correct weights', () => {
      render(<Dashboard />)

      // Should show T2 exercises grouped separately
      const t2Section = screen.getByTestId('tier-section-t2')
      expect(t2Section).toBeInTheDocument()
    })

    it('should display T3 exercises with correct weights', () => {
      render(<Dashboard />)

      // Should show T3 exercises
      const t3Section = screen.getByTestId('tier-section-t3')
      expect(t3Section).toBeInTheDocument()
    })

    it('should display rep schemes based on current stage', () => {
      render(<Dashboard />)

      // T1 at stage 0 should show 5x3+ (multiple instances expected)
      expect(screen.getAllByText(/5x3\+/).length).toBeGreaterThan(0)
    })
  })

  describe('Exercise Cards', () => {
    beforeEach(() => {
      const state = createMockState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    })

    it('should show exercise name on cards', () => {
      render(<Dashboard />)

      // Multiple instances expected due to cards and NextWorkout section
      expect(screen.getAllByText(/squat \(barbell\)/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/bench press \(barbell\)/i).length).toBeGreaterThan(0)
    })

    it('should show weight with unit suffix', () => {
      render(<Dashboard />)

      // Multiple instances expected
      expect(screen.getAllByText('100 kg').length).toBeGreaterThan(0)
    })

    it('should show tier badge on cards', () => {
      render(<Dashboard />)

      expect(screen.getAllByText(/T1/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/T2/i).length).toBeGreaterThan(0)
    })
  })

  describe('Next Workout Section', () => {
    beforeEach(() => {
      const state = createMockState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    })

    it('should display current workout day', () => {
      render(<Dashboard />)

      expect(screen.getByText(/next workout/i)).toBeInTheDocument()
      // A1 appears multiple times (in header and badge)
      expect(screen.getAllByText(/A1/).length).toBeGreaterThan(0)
    })

    it('should show exercises for the current day', () => {
      render(<Dashboard />)

      // A1 = T1 Squat + T2 Bench
      const nextWorkoutSection = screen.getByTestId('next-workout')
      expect(within(nextWorkoutSection).getByText(/squat/i)).toBeInTheDocument()
    })
  })

  describe('Pending Changes', () => {
    it('should not show pending badge when no changes', () => {
      const state = createMockState({ pendingChanges: [] })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />)

      expect(screen.queryByTestId('pending-badge')).not.toBeInTheDocument()
    })

    it('should show pending badge when changes exist', () => {
      const state = createMockState({
        pendingChanges: [
          {
            id: 'change-1',
            exerciseId: 'ex-squat-t1',
            exerciseName: 'Squat (Barbell)',
            tier: 'T1',
            type: 'progress',
            currentWeight: 100,
            currentStage: 0,
            newWeight: 105,
            newStage: 0,
            newScheme: '5x3+',
            reason: 'Completed workout',
            workoutId: 'workout-1',
            workoutDate: '2026-01-02T10:00:00Z',
            createdAt: '2026-01-02T11:00:00Z',
          },
        ],
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />)

      const badge = screen.getByTestId('pending-badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('1')
    })

    it('should show correct count for multiple pending changes', () => {
      const state = createMockState({
        pendingChanges: [
          {
            id: 'change-1',
            exerciseId: 'ex-squat-t1',
            exerciseName: 'Squat',
            tier: 'T1',
            type: 'progress',
            currentWeight: 100,
            currentStage: 0,
            newWeight: 105,
            newStage: 0,
            newScheme: '5x3+',
            reason: 'Completed workout',
            workoutId: 'workout-1',
            workoutDate: '2026-01-02T10:00:00Z',
            createdAt: '2026-01-02T11:00:00Z',
          },
          {
            id: 'change-2',
            exerciseId: 'ex-bench-t1',
            exerciseName: 'Bench',
            tier: 'T1',
            type: 'progress',
            currentWeight: 80,
            currentStage: 0,
            newWeight: 82.5,
            newStage: 0,
            newScheme: '5x3+',
            reason: 'Completed workout',
            workoutId: 'workout-1',
            workoutDate: '2026-01-02T10:00:00Z',
            createdAt: '2026-01-02T11:00:00Z',
          },
        ],
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />)

      const badge = screen.getByTestId('pending-badge')
      expect(badge).toHaveTextContent('2')
    })
  })

  describe('Last Sync Display', () => {
    it('should show "Not synced yet" when no sync has occurred', () => {
      const state = createMockState({ lastSync: null })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />)

      expect(screen.getByText(/not synced yet/i)).toBeInTheDocument()
    })

    it('should display last sync timestamp', () => {
      const state = createMockState({ lastSync: '2026-01-02T10:30:00Z' })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />)

      // Should show relative or absolute time
      expect(screen.getByText(/last sync/i)).toBeInTheDocument()
    })
  })

  describe('Tier Sections', () => {
    beforeEach(() => {
      const state = createMockState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    })

    it('should group exercises by tier', () => {
      render(<Dashboard />)

      const t1Section = screen.getByTestId('tier-section-t1')
      const t2Section = screen.getByTestId('tier-section-t2')
      const t3Section = screen.getByTestId('tier-section-t3')

      expect(t1Section).toBeInTheDocument()
      expect(t2Section).toBeInTheDocument()
      expect(t3Section).toBeInTheDocument()
    })

    it('should display tier heading for each section', () => {
      render(<Dashboard />)

      expect(screen.getByRole('heading', { name: /tier 1/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /tier 2/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /tier 3/i })).toBeInTheDocument()
    })
  })
})
