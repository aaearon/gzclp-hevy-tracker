/**
 * DashboardContent Component Tests
 *
 * Tests for the DashboardContent component that displays
 * the main content area with stats, workouts, and charts.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardContent } from '@/components/Dashboard/DashboardContent'
import type { GZCLPState } from '@/types/state'
import { createGZCLPState } from '../helpers/state-generator'

describe('DashboardContent', () => {
  // Create a minimal state with required data
  const createTestState = (): GZCLPState => {
    const state = createGZCLPState()
    // Add progression for main lifts
    state.progression['squat-T1'] = {
      exerciseId: 'squat-id',
      currentWeight: 60,
      stage: 0,
      baseWeight: 60,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    }
    state.progression['squat-T2'] = {
      exerciseId: 'squat-id',
      currentWeight: 50,
      stage: 0,
      baseWeight: 50,
      lastWorkoutId: null,
      lastWorkoutDate: null,
      amrapRecord: 0,
    }
    // Add exercise config with role
    state.exercises['squat-id'] = {
      id: 'squat-id',
      hevyTemplateId: 'template-1',
      name: 'Squat',
      role: 'squat',
    }
    return state
  }

  const defaultProps = {
    state: createTestState(),
  }

  describe('rendering', () => {
    it('renders QuickStats section', () => {
      render(<DashboardContent {...defaultProps} />)

      expect(screen.getByText('Current Week')).toBeInTheDocument()
      expect(screen.getByText('Total Workouts')).toBeInTheDocument()
      expect(screen.getByText('Days Since Last')).toBeInTheDocument()
    })

    it('renders CurrentWorkout section', () => {
      render(<DashboardContent {...defaultProps} />)

      expect(screen.getByTestId('current-workout')).toBeInTheDocument()
      expect(screen.getByText('Next Workout')).toBeInTheDocument()
    })

    it('renders Main Lifts section', () => {
      render(<DashboardContent {...defaultProps} />)

      expect(screen.getByText('Main Lifts')).toBeInTheDocument()
      expect(screen.getByText('T1 and T2 progression status for all main lifts')).toBeInTheDocument()
    })

    it('renders T3 Overview section', () => {
      const state = createTestState()
      // Add a T3 exercise
      state.exercises['lat-pulldown'] = {
        id: 'lat-pulldown',
        hevyTemplateId: 'template-t3',
        name: 'Lat Pulldown',
        role: 't3',
      }
      state.t3Schedule.A1 = ['lat-pulldown']
      state.progression['lat-pulldown'] = {
        exerciseId: 'lat-pulldown',
        currentWeight: 30,
        stage: 0,
        baseWeight: 30,
        lastWorkoutId: null,
        lastWorkoutDate: null,
        amrapRecord: 0,
      }

      render(<DashboardContent {...defaultProps} state={state} />)

      expect(screen.getByText('Accessories (T3)')).toBeInTheDocument()
    })

    it('renders Progression Charts collapsible section', () => {
      render(<DashboardContent {...defaultProps} />)

      expect(screen.getByText('Progression Charts')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('expands Progression Charts when clicked', async () => {
      const user = userEvent.setup()
      render(<DashboardContent {...defaultProps} />)

      const chartsSection = screen.getByText('Progression Charts')
      const details = chartsSection.closest('details')

      // Initially collapsed
      expect(details).not.toHaveAttribute('open')

      await user.click(chartsSection)

      // Should be expanded
      expect(details).toHaveAttribute('open')
    })
  })

  describe('day display', () => {
    it('displays the current day from state', () => {
      const state = createTestState()
      state.program.currentDay = 'B1'

      render(<DashboardContent {...defaultProps} state={state} />)

      expect(screen.getByText('GZCLP Day B1')).toBeInTheDocument()
    })
  })
})
