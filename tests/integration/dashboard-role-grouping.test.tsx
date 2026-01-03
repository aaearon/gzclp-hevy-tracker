/**
 * Integration Test: Dashboard Role-Based Grouping
 *
 * Verifies that the dashboard correctly groups exercises by role and derives tier from day.
 * Tests that Supplemental section does NOT exist (concept removed).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '@/components/Dashboard'
import type { GZCLPState } from '@/types/state'
import { STORAGE_KEY, CURRENT_STATE_VERSION } from '@/lib/constants'

// Mock state with role-based exercises
const createMockState = (): GZCLPState => ({
  version: CURRENT_STATE_VERSION,
  apiKey: 'test-key',
  program: {
    name: 'Test Program',
    createdAt: '2024-01-01T00:00:00Z',
    hevyRoutineIds: {
      A1: null,
      B1: null,
      A2: null,
      B2: null,
    },
    currentDay: 'A1',
  },
  exercises: {
    squat: {
      id: 'squat',
      hevyTemplateId: 'hevy-squat',
      name: 'Back Squat',
      role: 'squat',
    },
    bench: {
      id: 'bench',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press',
      role: 'bench',
    },
    ohp: {
      id: 'ohp',
      hevyTemplateId: 'hevy-ohp',
      name: 'Overhead Press',
      role: 'ohp',
    },
    deadlift: {
      id: 'deadlift',
      hevyTemplateId: 'hevy-deadlift',
      name: 'Deadlift',
      role: 'deadlift',
    },
    curls: {
      id: 'curls',
      hevyTemplateId: 'hevy-curls',
      name: 'Bicep Curls',
      role: 't3',
    },
    rows: {
      id: 'rows',
      hevyTemplateId: 'hevy-rows',
      name: 'Cable Rows',
      role: 't3',
    },
    stretch: {
      id: 'stretch',
      hevyTemplateId: 'hevy-stretch',
      name: 'Dynamic Stretching',
      role: 'warmup',
    },
    foam: {
      id: 'foam',
      hevyTemplateId: 'hevy-foam',
      name: 'Foam Rolling',
      role: 'cooldown',
    },
  },
  progression: {
    squat: {
      exerciseId: 'squat',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    bench: {
      exerciseId: 'bench',
      currentWeight: 80,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    ohp: {
      exerciseId: 'ohp',
      currentWeight: 50,
      stage: 0,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    deadlift: {
      exerciseId: 'deadlift',
      currentWeight: 120,
      stage: 0,
      baseWeight: 120,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    curls: {
      exerciseId: 'curls',
      currentWeight: 20,
      stage: 0,
      baseWeight: 20,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    rows: {
      exerciseId: 'rows',
      currentWeight: 40,
      stage: 0,
      baseWeight: 40,
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
})

describe('Dashboard Role-Based Grouping', () => {
  beforeEach(() => {
    localStorage.clear()
    const state = createMockState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('section rendering on day A1', () => {
    it('should render Warmup section', () => {
      render(<Dashboard />)
      expect(screen.getByText('Warmup')).toBeInTheDocument()
      expect(screen.getAllByText('Dynamic Stretching').length).toBeGreaterThan(0)
    })

    it('should render T1 section with squat (T1 on A1)', () => {
      render(<Dashboard />)
      // Find the T1 heading
      expect(screen.getByText('Tier 1')).toBeInTheDocument()

      // Verify Back Squat appears (will be in both TierSection and NextWorkout)
      expect(screen.getAllByText('Back Squat').length).toBeGreaterThan(0)
    })

    it('should render T2 section with bench (T2 on A1)', () => {
      render(<Dashboard />)
      // Find the T2 heading
      expect(screen.getByText('Tier 2')).toBeInTheDocument()

      // Verify Bench Press appears
      expect(screen.getAllByText('Bench Press').length).toBeGreaterThan(0)
    })

    it('should render T3 section with accessories', () => {
      render(<Dashboard />)
      // Find the T3 heading
      expect(screen.getByText('Tier 3')).toBeInTheDocument()

      expect(screen.getAllByText('Bicep Curls').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Cable Rows').length).toBeGreaterThan(0)
    })

    it('should render Cooldown section', () => {
      render(<Dashboard />)
      expect(screen.getByText('Cooldown')).toBeInTheDocument()
      expect(screen.getAllByText('Foam Rolling').length).toBeGreaterThan(0)
    })

    it('should NOT render Supplemental section (concept removed)', () => {
      render(<Dashboard />)
      expect(screen.queryByText('Supplemental')).not.toBeInTheDocument()
    })
  })

  describe('tier rotation across days', () => {
    it('should show bench as T1 on day A2', () => {
      const state = createMockState()
      state.program.currentDay = 'A2'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />)

      // Find T1 section (data-testid)
      const t1Section = screen.getByTestId('tier-section-t1')
      expect(t1Section).toHaveTextContent('Bench Press')

      // Also verify it appears in Next Workout
      const nextWorkout = screen.getByTestId('next-workout')
      expect(nextWorkout).toHaveTextContent('Bench Press')
    })

    it('should show ohp as T1 on day B1', () => {
      const state = createMockState()
      state.program.currentDay = 'B1'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />)

      const t1Section = screen.getByTestId('tier-section-t1')
      expect(t1Section).toHaveTextContent('Overhead Press')

      const nextWorkout = screen.getByTestId('next-workout')
      expect(nextWorkout).toHaveTextContent('Overhead Press')
    })

    it('should show deadlift as T1 on day B2', () => {
      const state = createMockState()
      state.program.currentDay = 'B2'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />)

      const t1Section = screen.getByTestId('tier-section-t1')
      expect(t1Section).toHaveTextContent('Deadlift')

      const nextWorkout = screen.getByTestId('next-workout')
      expect(nextWorkout).toHaveTextContent('Deadlift')
    })
  })
})
