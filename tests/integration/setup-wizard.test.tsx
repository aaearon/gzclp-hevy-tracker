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

  describe('API Key Step', () => {
    it('should render the API key input field', () => {
      render(<SetupWizard onComplete={mockOnComplete} />)

      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
    })

    it('should show validation error for invalid API key format', async () => {
      render(<SetupWizard onComplete={mockOnComplete} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, 'invalid-key')

      const connectButton = screen.getByRole('button', { name: /connect/i })
      await user.click(connectButton)

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

      const connectButton = screen.getByRole('button', { name: /connect/i })
      await user.click(connectButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid api key/i)).toBeInTheDocument()
      })
    })

    it('should proceed to routine source step on successful connection', async () => {
      render(<SetupWizard onComplete={mockOnComplete} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, '550e8400-e29b-41d4-a716-446655440000')

      const connectButton = screen.getByRole('button', { name: /connect/i })
      await user.click(connectButton)

      await waitFor(() => {
        // Should show routine source selection after successful connection
        expect(screen.getByText(/how would you like to set up/i)).toBeInTheDocument()
      })
    })
  })

  describe('Exercise Selection Step', () => {
    beforeEach(async () => {
      render(<SetupWizard onComplete={mockOnComplete} />)

      // Complete API key step first
      const input = screen.getByLabelText(/api key/i)
      await user.type(input, '550e8400-e29b-41d4-a716-446655440000')
      const connectButton = screen.getByRole('button', { name: /connect/i })
      await user.click(connectButton)

      // Wait for routine source step
      await waitFor(() => {
        expect(screen.getByText(/how would you like to set up/i)).toBeInTheDocument()
      })

      // Select "Create New" to proceed to exercises step
      const createNewButton = screen.getByRole('button', { name: /create new routines/i })
      await user.click(createNewButton)

      await waitFor(() => {
        expect(screen.getByText(/select exercises/i)).toBeInTheDocument()
      })
    })

    it('should display exercise templates from Hevy when input focused', async () => {
      // Find T1 Squat slot input and focus it
      const squatInput = screen.getByLabelText(/squat \(t1\)/i)
      await user.click(squatInput)

      await waitFor(() => {
        expect(screen.getByText(/squat \(barbell\)/i)).toBeInTheDocument()
        expect(screen.getByText(/bench press \(barbell\)/i)).toBeInTheDocument()
      })
    })

    it('should allow selecting exercises for each slot', async () => {
      // Find T1 Squat slot input
      const squatSlot = screen.getByLabelText(/squat \(t1\)/i)
      expect(squatSlot).toBeInTheDocument()
    })
  })

  describe('Weight Input Step', () => {
    // These tests would require completing previous steps
    // Testing in isolation with a different approach
    it.todo('should accept weight input in kg')
    it.todo('should accept weight input in lbs')
    it.todo('should validate weight is positive')
  })

  describe('Completion', () => {
    it.todo('should call onComplete with configured state')
    it.todo('should save configuration to localStorage')
  })
})
