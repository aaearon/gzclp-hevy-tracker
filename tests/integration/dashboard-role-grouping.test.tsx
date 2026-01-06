/**
 * Integration Test: Dashboard Role-Based Grouping
 *
 * Verifies that the dashboard correctly groups exercises by role and derives tier from day.
 * Tests CurrentWorkout component displays correct exercises with proper weights.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Dashboard } from '@/components/Dashboard'
import { ToastProvider } from '@/contexts/ToastContext'
import type { GZCLPState } from '@/types/state'
import { STORAGE_KEY, CURRENT_STATE_VERSION } from '@/lib/constants'

// Mock Chart.js components (not supported in JSDOM)
vi.mock('@/components/ProgressionChart', () => ({
  ProgressionChartContainer: () => <div data-testid="progression-chart-mock">Chart Mock</div>,
}))

// Wrapper component for tests that require ToastProvider
function TestWrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

// Mock state with role-based exercises and CORRECT progression keys
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
    workoutsPerWeek: 3,
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
  },
  progression: {
    // Main lifts use role-tier format: "squat-T1", "squat-T2", etc.
    'squat-T1': {
      exerciseId: 'squat',
      currentWeight: 100,
      stage: 0,
      baseWeight: 100,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'squat-T2': {
      exerciseId: 'squat',
      currentWeight: 70,
      stage: 0,
      baseWeight: 70,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'bench-T1': {
      exerciseId: 'bench',
      currentWeight: 80,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'bench-T2': {
      exerciseId: 'bench',
      currentWeight: 55,
      stage: 0,
      baseWeight: 55,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ohp-T1': {
      exerciseId: 'ohp',
      currentWeight: 50,
      stage: 0,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'ohp-T2': {
      exerciseId: 'ohp',
      currentWeight: 35,
      stage: 0,
      baseWeight: 35,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'deadlift-T1': {
      exerciseId: 'deadlift',
      currentWeight: 120,
      stage: 0,
      baseWeight: 120,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    'deadlift-T2': {
      exerciseId: 'deadlift',
      currentWeight: 85,
      stage: 0,
      baseWeight: 85,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    },
    // T3s use exerciseId directly
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
  t3Schedule: {
    A1: ['curls', 'rows'],
    B1: ['curls', 'rows'],
    A2: ['curls', 'rows'],
    B2: ['curls', 'rows'],
  },
  progressionHistory: {},
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

  describe('CurrentWorkout component on day A1', () => {
    it('should render CurrentWorkout with correct exercises', () => {
      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      expect(currentWorkout).toBeInTheDocument()

      // On A1: T1=Squat, T2=Bench
      expect(currentWorkout).toHaveTextContent('Back Squat')
      expect(currentWorkout).toHaveTextContent('Bench Press')
    })

    it('should show correct T1 weight (100 kg for squat on A1)', () => {
      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      // Squat T1 weight is 100kg
      expect(currentWorkout).toHaveTextContent('100')
    })

    it('should show correct T2 weight (55 kg for bench on A1)', () => {
      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      // Bench T2 weight is 55kg
      expect(currentWorkout).toHaveTextContent('55')
    })

    it('should show T3 accessories for the day', () => {
      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      expect(currentWorkout).toHaveTextContent('Bicep Curls')
      expect(currentWorkout).toHaveTextContent('Cable Rows')
    })

    it('should NOT render Supplemental section (concept removed)', () => {
      render(<Dashboard />, { wrapper: TestWrapper })
      expect(screen.queryByText('Supplemental')).not.toBeInTheDocument()
    })
  })

  describe('tier rotation across days', () => {
    it('should show bench as T1 on day A2', () => {
      const state = createMockState()
      state.program.currentDay = 'A2'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      // On A2: T1=Bench (80kg), T2=Squat (70kg)
      expect(currentWorkout).toHaveTextContent('Bench Press')
      expect(currentWorkout).toHaveTextContent('80') // bench-T1 weight
    })

    it('should show ohp as T1 on day B1', () => {
      const state = createMockState()
      state.program.currentDay = 'B1'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      // On B1: T1=OHP (50kg), T2=Deadlift (85kg)
      expect(currentWorkout).toHaveTextContent('Overhead Press')
      expect(currentWorkout).toHaveTextContent('50') // ohp-T1 weight
    })

    it('should show deadlift as T1 on day B2', () => {
      const state = createMockState()
      state.program.currentDay = 'B2'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      // On B2: T1=Deadlift (120kg), T2=OHP (35kg)
      expect(currentWorkout).toHaveTextContent('Deadlift')
      expect(currentWorkout).toHaveTextContent('120') // deadlift-T1 weight
    })
  })

  describe('per-day T3 schedule in CurrentWorkout', () => {
    it('should show only A1 T3s when on day A1', () => {
      const state = createMockState()
      state.t3Schedule = {
        A1: ['curls'],
        B1: ['rows'],
        A2: ['curls', 'rows'],
        B2: [],
      }
      state.program.currentDay = 'A1'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      expect(currentWorkout).toHaveTextContent('Bicep Curls')
      expect(currentWorkout).not.toHaveTextContent('Cable Rows')
    })

    it('should show only B1 T3s when on day B1', () => {
      const state = createMockState()
      state.t3Schedule = {
        A1: ['curls'],
        B1: ['rows'],
        A2: ['curls', 'rows'],
        B2: [],
      }
      state.program.currentDay = 'B1'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      expect(currentWorkout).toHaveTextContent('Cable Rows')
      expect(currentWorkout).not.toHaveTextContent('Bicep Curls')
    })

    it('should show combined T3s for day with multiple', () => {
      const state = createMockState()
      state.t3Schedule = {
        A1: ['curls'],
        B1: ['rows'],
        A2: ['curls', 'rows'],
        B2: [],
      }
      state.program.currentDay = 'A2'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      render(<Dashboard />, { wrapper: TestWrapper })

      const currentWorkout = screen.getByTestId('current-workout')
      expect(currentWorkout).toHaveTextContent('Bicep Curls')
      expect(currentWorkout).toHaveTextContent('Cable Rows')
    })
  })

  describe('T3Overview component', () => {
    it('should render T3Overview with all T3 exercises', () => {
      render(<Dashboard />, { wrapper: TestWrapper })

      const t3Overview = screen.getByTestId('t3-overview')
      expect(t3Overview).toBeInTheDocument()
      expect(t3Overview).toHaveTextContent('Bicep Curls')
      expect(t3Overview).toHaveTextContent('Cable Rows')
    })

    it('should show T3 weights', () => {
      render(<Dashboard />, { wrapper: TestWrapper })

      const t3Overview = screen.getByTestId('t3-overview')
      expect(t3Overview).toHaveTextContent('20') // curls weight
      expect(t3Overview).toHaveTextContent('40') // rows weight
    })
  })
})
