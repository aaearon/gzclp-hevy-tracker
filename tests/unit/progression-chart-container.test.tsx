/**
 * ProgressionChartContainer Tests
 *
 * Tests for progression chart component behavior.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import { ProgressionChartContainer } from '@/components/ProgressionChart'
import type {
  ExerciseConfig,
  ExerciseHistory,
  ProgressionState,
} from '@/types/state'

// Mock exercises config
const mockExercises: Record<string, ExerciseConfig> = {
  'ex-squat': {
    id: 'ex-squat',
    hevyTemplateId: 'hevy-squat',
    name: 'Barbell Back Squat',
    role: 'squat',
  },
}

// Mock progression state
const mockProgression: Record<string, ProgressionState> = {
  'squat-T1': {
    exerciseId: 'ex-squat',
    currentWeight: 100,
    stage: 0,
    baseWeight: 100,
    amrapRecord: 0,
  },
}

describe('ProgressionChartContainer', () => {
  describe('empty state', () => {
    it('shows empty state message when there is no historical data', () => {
      const emptyHistory: Record<string, ExerciseHistory> = {}

      render(
        <ProgressionChartContainer
          exercises={mockExercises}
          progression={mockProgression}
          progressionHistory={emptyHistory}
          unit="kg"
          workoutsPerWeek={3}
        />
      )

      expect(screen.getByText(/no workout history yet/i)).toBeInTheDocument()
    })

    it('shows exercise selector even in empty state', () => {
      const emptyHistory: Record<string, ExerciseHistory> = {}

      render(
        <ProgressionChartContainer
          exercises={mockExercises}
          progression={mockProgression}
          progressionHistory={emptyHistory}
          unit="kg"
          workoutsPerWeek={3}
        />
      )

      // Exercise selector should be visible
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('no exercises configured', () => {
    it('shows setup message when no exercises are configured', () => {
      render(
        <ProgressionChartContainer
          exercises={{}}
          progression={{}}
          progressionHistory={{}}
          unit="kg"
          workoutsPerWeek={3}
        />
      )

      expect(screen.getByText(/no exercises configured/i)).toBeInTheDocument()
    })
  })

  describe('with historical data', () => {
    it('displays chart with historical data', () => {
      const historyWithData: Record<string, ExerciseHistory> = {
        'squat-T1': {
          progressionKey: 'squat-T1',
          exerciseName: 'Barbell Back Squat',
          tier: 'T1',
          entries: [
            {
              date: '2024-01-01T10:00:00Z',
              workoutId: 'w1',
              weight: 100,
              stage: 0,
              tier: 'T1',
              success: true,
              changeType: 'progress',
            },
          ],
        },
      }

      render(
        <ProgressionChartContainer
          exercises={mockExercises}
          progression={mockProgression}
          progressionHistory={historyWithData}
          unit="kg"
          workoutsPerWeek={3}
        />
      )

      // Should not show empty state message
      expect(screen.queryByText(/no workout history yet/i)).not.toBeInTheDocument()

      // Should show chart legend
      expect(screen.getByText(/deload/i)).toBeInTheDocument()
    })
  })
})
