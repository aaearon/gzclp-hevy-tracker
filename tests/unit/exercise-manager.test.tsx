/**
 * ExerciseManager Component Tests
 *
 * Tests for the ExerciseManager component that allows changing
 * exercise roles with conflict detection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseManager } from '@/components/Settings/ExerciseManager'
import * as ConfigContext from '@/contexts/ConfigContext'
import type { ExerciseConfig } from '@/types/state'

// Mock the useConfigContext hook
vi.mock('@/contexts/ConfigContext', () => ({
  useConfigContext: vi.fn(),
}))

const mockUseConfigContext = vi.mocked(ConfigContext.useConfigContext)

describe('ExerciseManager', () => {
  const mockUpdateExercise = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('shows empty message when no exercises exist', () => {
      mockUseConfigContext.mockReturnValue({
        exercises: {},
        updateExercise: mockUpdateExercise,
      } as any)

      render(<ExerciseManager />)

      expect(screen.getByText('No exercises have been configured yet.')).toBeInTheDocument()
    })
  })

  describe('exercise list display', () => {
    const mockExercises: Record<string, ExerciseConfig> = {
      'ex-1': {
        id: 'ex-1',
        hevyTemplateId: 'hevy-1',
        name: 'Bench Press',
        role: 'bench',
      },
      'ex-2': {
        id: 'ex-2',
        hevyTemplateId: 'hevy-2',
        name: 'Lat Pulldown',
        role: 't3',
      },
      'ex-3': {
        id: 'ex-3',
        hevyTemplateId: 'hevy-3',
        name: 'Squat',
        role: 'squat',
      },
    }

    beforeEach(() => {
      mockUseConfigContext.mockReturnValue({
        exercises: mockExercises,
        updateExercise: mockUpdateExercise,
      } as any)
    })

    it('renders all exercises in alphabetical order', () => {
      render(<ExerciseManager />)

      const exerciseRows = screen.getAllByRole('row').slice(1) // Skip header row
      expect(exerciseRows).toHaveLength(3)

      // Check exercises are displayed by finding the specific text in the cells
      const cells = screen.getAllByRole('cell')
      const exerciseNameCells = cells.filter((cell) =>
        cell.querySelector('.text-sm.font-medium.text-gray-900')
      )

      expect(exerciseNameCells[0]).toHaveTextContent('Bench Press')
      expect(exerciseNameCells[1]).toHaveTextContent('Lat Pulldown')
      expect(exerciseNameCells[2]).toHaveTextContent('Squat')
    })

    it('displays role dropdown for each exercise', () => {
      render(<ExerciseManager />)

      // Query within the table (desktop view) to avoid counting mobile dropdowns
      const table = screen.getByRole('table')
      const dropdowns = within(table).getAllByRole('combobox')
      expect(dropdowns).toHaveLength(3)
    })

    it('shows current role in dropdown', () => {
      render(<ExerciseManager />)

      const dropdowns = screen.getAllByRole('combobox')
      expect(dropdowns[0]).toHaveValue('bench') // Bench Press
      expect(dropdowns[1]).toHaveValue('t3') // Lat Pulldown
      expect(dropdowns[2]).toHaveValue('squat') // Squat
    })
  })

  describe('role change with conflict detection (T027)', () => {
    it('detects conflict when changing to an already-assigned main lift role', async () => {
      const user = userEvent.setup()

      const mockExercises: Record<string, ExerciseConfig> = {
        'ex-1': {
          id: 'ex-1',
          hevyTemplateId: 'hevy-1',
          name: 'Front Squat',
          role: 't3',
        },
        'ex-2': {
          id: 'ex-2',
          hevyTemplateId: 'hevy-2',
          name: 'Back Squat',
          role: 'squat',
        },
      }

      mockUseConfigContext.mockReturnValue({
        exercises: mockExercises,
        updateExercise: mockUpdateExercise,
      } as any)

      render(<ExerciseManager />)

      // Try to change Front Squat to 'squat' role (already assigned to Back Squat)
      const dropdown = screen.getAllByRole('combobox')[1] // Front Squat is second alphabetically
      await user.selectOptions(dropdown, 'squat')

      // Should show confirmation dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Role Conflict/i)).toBeInTheDocument()
      expect(screen.getByText(/Squat is assigned to/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Swap Roles/i })).toBeInTheDocument()
    })

    it('allows changing to non-conflicting roles without confirmation', async () => {
      const user = userEvent.setup()

      const mockExercises: Record<string, ExerciseConfig> = {
        'ex-1': {
          id: 'ex-1',
          hevyTemplateId: 'hevy-1',
          name: 'Bench Press',
          role: 'bench',
        },
      }

      mockUseConfigContext.mockReturnValue({
        exercises: mockExercises,
        updateExercise: mockUpdateExercise,
      } as any)

      render(<ExerciseManager />)

      // Query within the table (desktop view) to avoid matching mobile dropdown
      const table = screen.getByRole('table')
      const dropdown = within(table).getByRole('combobox')
      await user.selectOptions(dropdown, 't3')

      // Should update directly without confirmation
      expect(mockUpdateExercise).toHaveBeenCalledWith('ex-1', { role: 't3' })
      expect(screen.queryByText(/Swap roles/i)).not.toBeInTheDocument()
    })

    it('allows selecting any role (conflict check happens on change)', () => {
      const mockExercises: Record<string, ExerciseConfig> = {
        'ex-1': {
          id: 'ex-1',
          hevyTemplateId: 'hevy-1',
          name: 'Front Squat',
          role: 't3',
        },
        'ex-2': {
          id: 'ex-2',
          hevyTemplateId: 'hevy-2',
          name: 'Back Squat',
          role: 'squat',
        },
        'ex-3': {
          id: 'ex-3',
          hevyTemplateId: 'hevy-3',
          name: 'Bench Press',
          role: 'bench',
        },
      }

      mockUseConfigContext.mockReturnValue({
        exercises: mockExercises,
        updateExercise: mockUpdateExercise,
      } as any)

      render(<ExerciseManager />)

      // All dropdowns should have all roles available (not disabled)
      // Conflicts are handled when user selects, not by disabling options
      const dropdowns = screen.getAllByRole('combobox')
      const frontSquatDropdown = dropdowns[1] // Front Squat is second alphabetically

      const squatOption = within(frontSquatDropdown).getByRole('option', { name: 'Squat' })
      const benchOption = within(frontSquatDropdown).getByRole('option', { name: 'Bench Press' })

      expect(squatOption).not.toBeDisabled()
      expect(benchOption).not.toBeDisabled()
    })
  })

  describe('role swap functionality (T028)', () => {
    it('swaps roles when user confirms the swap', async () => {
      const user = userEvent.setup()

      const mockExercises: Record<string, ExerciseConfig> = {
        'ex-1': {
          id: 'ex-1',
          hevyTemplateId: 'hevy-1',
          name: 'Front Squat',
          role: 't3',
        },
        'ex-2': {
          id: 'ex-2',
          hevyTemplateId: 'hevy-2',
          name: 'Back Squat',
          role: 'squat',
        },
      }

      mockUseConfigContext.mockReturnValue({
        exercises: mockExercises,
        updateExercise: mockUpdateExercise,
      } as any)

      render(<ExerciseManager />)

      // Change Front Squat to 'squat' (Front Squat is second alphabetically)
      const dropdown = screen.getAllByRole('combobox')[1]
      await user.selectOptions(dropdown, 'squat')

      // Confirm the swap
      const confirmButton = screen.getByRole('button', { name: /Swap Roles/i })
      await user.click(confirmButton)

      // Should update both exercises
      expect(mockUpdateExercise).toHaveBeenCalledWith('ex-1', { role: 'squat' })
      expect(mockUpdateExercise).toHaveBeenCalledWith('ex-2', { role: 't3' })
    })

    it('cancels role change when user cancels the swap', async () => {
      const user = userEvent.setup()

      const mockExercises: Record<string, ExerciseConfig> = {
        'ex-1': {
          id: 'ex-1',
          hevyTemplateId: 'hevy-1',
          name: 'Front Squat',
          role: 't3',
        },
        'ex-2': {
          id: 'ex-2',
          hevyTemplateId: 'hevy-2',
          name: 'Back Squat',
          role: 'squat',
        },
      }

      mockUseConfigContext.mockReturnValue({
        exercises: mockExercises,
        updateExercise: mockUpdateExercise,
      } as any)

      render(<ExerciseManager />)

      // Change Front Squat to 'squat' (Front Squat is second alphabetically)
      const dropdown = screen.getAllByRole('combobox')[1]
      await user.selectOptions(dropdown, 'squat')

      // Cancel the swap
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await user.click(cancelButton)

      // Should not update either exercise
      expect(mockUpdateExercise).not.toHaveBeenCalled()

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('preserves the original role when swap is cancelled', async () => {
      const user = userEvent.setup()

      const mockExercises: Record<string, ExerciseConfig> = {
        'ex-1': {
          id: 'ex-1',
          hevyTemplateId: 'hevy-1',
          name: 'OHP',
          role: 't3',
        },
        'ex-2': {
          id: 'ex-2',
          hevyTemplateId: 'hevy-2',
          name: 'Overhead Press',
          role: 'ohp',
        },
      }

      mockUseConfigContext.mockReturnValue({
        exercises: mockExercises,
        updateExercise: mockUpdateExercise,
      } as any)

      render(<ExerciseManager />)

      // OHP is first alphabetically
      const dropdown = screen.getAllByRole('combobox')[0]
      expect(dropdown).toHaveValue('t3')

      await user.selectOptions(dropdown, 'ohp')

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await user.click(cancelButton)

      // Dropdown should revert to original value
      expect(dropdown).toHaveValue('t3')
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      const mockExercises: Record<string, ExerciseConfig> = {
        'ex-1': {
          id: 'ex-1',
          hevyTemplateId: 'hevy-1',
          name: 'Squat',
          role: 'squat',
        },
      }

      mockUseConfigContext.mockReturnValue({
        exercises: mockExercises,
        updateExercise: mockUpdateExercise,
      } as any)
    })

    it('has accessible labels for role dropdowns', () => {
      render(<ExerciseManager />)

      // Query within the table (desktop view) to avoid matching mobile dropdown
      const table = screen.getByRole('table')
      const dropdown = within(table).getByRole('combobox')
      expect(dropdown).toHaveAccessibleName('Role for Squat')
    })

    it('uses proper table structure with header', () => {
      render(<ExerciseManager />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Exercise')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
    })
  })
})
