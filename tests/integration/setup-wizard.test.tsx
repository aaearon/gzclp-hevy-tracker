/**
 * Integration Tests: Setup Wizard Flow
 *
 * Tests the complete setup wizard flow from API key entry to configuration completion.
 * [US1] User Story 1 - Initial Program Setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetupWizard } from '@/components/SetupWizard'
import type { ExerciseTemplate } from '@/types/hevy'

// Mock the Hevy client
const mockTestConnection = vi.fn()
const mockGetAllExerciseTemplates = vi.fn()
const mockGetAllRoutines = vi.fn()

vi.mock('@/lib/hevy-client', () => ({
  createHevyClient: vi.fn(() => ({
    testConnection: mockTestConnection,
    getAllExerciseTemplates: mockGetAllExerciseTemplates,
    getAllRoutines: mockGetAllRoutines,
  })),
  HevyAuthError: class HevyAuthError extends Error {
    constructor() {
      super('Invalid API key')
      this.name = 'HevyAuthError'
    }
  },
}))

// Sample exercise templates for testing
const mockExerciseTemplates: ExerciseTemplate[] = [
  {
    id: 'squat-001',
    title: 'Squat (Barbell)',
    type: 'weight_reps',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: ['glutes', 'hamstrings'],
    is_custom: false,
  },
  {
    id: 'bench-001',
    title: 'Bench Press (Barbell)',
    type: 'weight_reps',
    primary_muscle_group: 'chest',
    secondary_muscle_groups: ['triceps', 'shoulders'],
    is_custom: false,
  },
  {
    id: 'deadlift-001',
    title: 'Deadlift (Barbell)',
    type: 'weight_reps',
    primary_muscle_group: 'lower_back',
    secondary_muscle_groups: ['glutes', 'hamstrings'],
    is_custom: false,
  },
  {
    id: 'ohp-001',
    title: 'Shoulder Press (Barbell)',
    type: 'weight_reps',
    primary_muscle_group: 'shoulders',
    secondary_muscle_groups: ['triceps'],
    is_custom: false,
  },
]

describe('[US1] Setup Wizard Flow', () => {
  const user = userEvent.setup()
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockTestConnection.mockResolvedValue(true)
    mockGetAllExerciseTemplates.mockResolvedValue(mockExerciseTemplates)
    mockGetAllRoutines.mockResolvedValue([]) // Default to no routines
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Welcome Step (Combined API Key + Path Selection)', () => {
    it('should render the API key input field', () => {
      render(<SetupWizard onComplete={mockOnComplete} />)

      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /validate/i })).toBeInTheDocument()
      // App branding should be visible
      expect(screen.getByText('GZCLP Hevy Tracker')).toBeInTheDocument()
    })

    it('should show validation error for invalid API key format', async () => {
      render(<SetupWizard onComplete={mockOnComplete} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, 'invalid-key')

      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument()
      })
    })

    it('should show error when connection fails', async () => {
      const { HevyAuthError } = await import('@/lib/hevy-client')
      mockTestConnection.mockRejectedValue(new HevyAuthError())

      render(<SetupWizard onComplete={mockOnComplete} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, '550e8400-e29b-41d4-a716-446655440000')

      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid api key/i)).toBeInTheDocument()
      })
    })

    it('should show path options and unit selector after successful API key validation', async () => {
      render(<SetupWizard onComplete={mockOnComplete} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, '550e8400-e29b-41d4-a716-446655440000')

      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)

      await waitFor(() => {
        // Path options should appear on same step after validation
        expect(screen.getByText(/how would you like to start/i)).toBeInTheDocument()
        expect(screen.getByText('Start New Program')).toBeInTheDocument()
        expect(screen.getByText('Import Existing Program')).toBeInTheDocument()
        // Unit selector should also be visible
        expect(screen.getByText('Weight Unit')).toBeInTheDocument()
      })
    })
  })

  // Note: Exercise selection and weight input steps are tested in:
  // - import-role-assignment.test.tsx (role-based exercise selection)
  // - weight-setup-step.test.tsx (weight input validation)
  // - setup-wizard-e2e.test.tsx (full flow integration)
})
