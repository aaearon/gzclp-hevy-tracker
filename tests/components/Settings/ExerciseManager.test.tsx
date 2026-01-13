/**
 * Test Suite: ExerciseManager Component
 * Tests for T3 custom increment management UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExerciseManager } from '@/components/Settings/ExerciseManager'
import { useProgram } from '@/hooks/useProgram'
import type { GZCLPState } from '@/types/state'

// Mock useProgram hook
vi.mock('@/hooks/useProgram')

describe('ExerciseManager - T3 Custom Increments', () => {
  const mockUpdateExercise = vi.fn()

  const mockState: GZCLPState = {
    version: '1.0.0',
    apiKey: 'test-key',
    program: {
      name: 'Test Program',
      createdAt: '2025-01-01T00:00:00.000Z',
      workoutsPerWeek: 3,
      hevyRoutineIds: { A1: null, B1: null, A2: null, B2: null },
      currentDay: 'A1',
    },
    exercises: {
      'ex1': {
        id: 'ex1',
        hevyTemplateId: 'tpl1',
        name: 'Squat',
        role: 'squat',
      },
      'ex2': {
        id: 'ex2',
        hevyTemplateId: 'tpl2',
        name: 'Lat Pulldown',
        role: 't3',
      },
      'ex3': {
        id: 'ex3',
        hevyTemplateId: 'tpl3',
        name: 'Bicep Curl',
        role: 't3',
        customIncrementKg: 1.5,
      },
    },
    progression: {},
    pendingChanges: [],
    settings: {
      weightUnit: 'kg',
      increments: { upper: 2.5, lower: 5 },
      restTimers: { t1: 180, t2: 120, t3: 60 },
    },
    lastSync: null,
    t3Schedule: { A1: [], B1: [], A2: [], B2: [] },
    totalWorkouts: 0,
    mostRecentWorkoutDate: null,
    progressionHistory: {},
    acknowledgedDiscrepancies: [],
    needsPush: false,
    processedWorkoutIds: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useProgram).mockReturnValue({
      state: mockState,
      updateExercise: mockUpdateExercise,
      isSetupRequired: false,
      setApiKey: vi.fn(),
      setWeightUnit: vi.fn(),
      addExercise: vi.fn(),
      removeExercise: vi.fn(),
      setInitialWeight: vi.fn(),
      setProgressionByKey: vi.fn(),
      updateProgression: vi.fn(),
      updateProgressionBatch: vi.fn(),
      setHevyRoutineId: vi.fn(),
      setHevyRoutineIds: vi.fn(),
      setRoutineIds: vi.fn(),
      setCurrentDay: vi.fn(),
      setProgramCreatedAt: vi.fn(),
      setWorkoutsPerWeek: vi.fn(),
      setT3Schedule: vi.fn(),
      setTotalWorkouts: vi.fn(),
      setMostRecentWorkoutDate: vi.fn(),
      setLastSync: vi.fn(),
      setNeedsPush: vi.fn(),
      setProgressionHistory: vi.fn(),
      recordHistoryEntry: vi.fn(),
      acknowledgeDiscrepancy: vi.fn(),
      clearAcknowledgedDiscrepancies: vi.fn(),
      addPendingChange: vi.fn(),
      removePendingChange: vi.fn(),
      clearPendingChanges: vi.fn(),
      addProcessedWorkoutIds: vi.fn(),
      resetState: vi.fn(),
      importState: vi.fn(),
    })
  })

  it('should not show increment input for non-T3 exercises', () => {
    render(<ExerciseManager />)

    // Should not have increment label for Squat
    const allIncrementLabels = screen.queryAllByText(/Increment:/i)
    expect(allIncrementLabels.length).toBe(2) // Only for the two T3 exercises
  })

  it('should show default increment for T3 exercises without customIncrementKg', () => {
    render(<ExerciseManager />)

    // Find the inputs for Lat Pulldown (mobile + desktop views)
    const inputs = screen.getAllByLabelText('Increment for Lat Pulldown')
    expect(inputs[0]).toHaveValue(2.5)
  })

  it('should show custom increment for T3 exercises with customIncrementKg', () => {
    render(<ExerciseManager />)

    // Find the inputs for Bicep Curl (mobile + desktop views)
    const inputs = screen.getAllByLabelText('Increment for Bicep Curl')
    expect(inputs[0]).toHaveValue(1.5)
  })

  it('should call updateExercise when increment is changed', () => {
    render(<ExerciseManager />)

    // Find the input for Lat Pulldown (use first one from mobile view)
    const inputs = screen.getAllByLabelText('Increment for Lat Pulldown')
    const input = inputs[0]

    // Change the value to 5
    fireEvent.change(input, { target: { value: '5' } })

    // Should call updateExercise with new customIncrementKg
    expect(mockUpdateExercise).toHaveBeenCalledWith('ex2', { customIncrementKg: 5 })
  })

  it('should not update if value is below minimum (0.5)', () => {
    render(<ExerciseManager />)

    const inputs = screen.getAllByLabelText('Increment for Lat Pulldown')
    const input = inputs[0]

    // Try to change to invalid value
    fireEvent.change(input, { target: { value: '0.1' } })

    // Should not call updateExercise
    expect(mockUpdateExercise).not.toHaveBeenCalled()
  })

  it('should not update if value is above maximum (10)', () => {
    render(<ExerciseManager />)

    const inputs = screen.getAllByLabelText('Increment for Lat Pulldown')
    const input = inputs[0]

    // Try to change to invalid value
    fireEvent.change(input, { target: { value: '15' } })

    // Should not call updateExercise
    expect(mockUpdateExercise).not.toHaveBeenCalled()
  })

  it('should accept valid increment values within range', () => {
    render(<ExerciseManager />)

    const inputs = screen.getAllByLabelText('Increment for Lat Pulldown')
    const input = inputs[0]

    // Test various valid values (skip 2.5 since it's the default and won't trigger change)
    const validValues = ['0.5', '1', '5', '7.5', '10']

    validValues.forEach(value => {
      mockUpdateExercise.mockClear()
      fireEvent.change(input, { target: { value } })
      expect(mockUpdateExercise).toHaveBeenCalledWith('ex2', { customIncrementKg: Number(value) })
    })
  })
})
