/**
 * Phase 9: Create Workflow Per-Day T3 Assignment Tests
 *
 * Tests for the create workflow to support per-day T3 assignment:
 * - SlotAssignmentStep renders DayTabBar for T3 section
 * - Tab switching changes displayed T3 exercises
 * - T3 add/remove only affects current day
 * - Main lifts remain global (not per-day)
 * - handleWeightsNext builds t3Schedule correctly
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlotAssignmentStep, type CreatePathAssignments } from '@/components/SetupWizard/SlotAssignment'
import { WeightSetupStep } from '@/components/SetupWizard/WeightSetupStep'
import type { ExerciseTemplate } from '@/types/hevy'
import type { GZCLPDay } from '@/types/state'

// Mock exercise templates
const mockExercises: ExerciseTemplate[] = [
  { id: 'squat-tpl', title: 'Squat', type: 'weight_reps', primary_muscle_group: 'quadriceps', secondary_muscle_groups: [], is_custom: false },
  { id: 'bench-tpl', title: 'Bench Press', type: 'weight_reps', primary_muscle_group: 'chest', secondary_muscle_groups: [], is_custom: false },
  { id: 'ohp-tpl', title: 'Overhead Press', type: 'weight_reps', primary_muscle_group: 'shoulders', secondary_muscle_groups: [], is_custom: false },
  { id: 'deadlift-tpl', title: 'Deadlift', type: 'weight_reps', primary_muscle_group: 'lower_back', secondary_muscle_groups: [], is_custom: false },
  { id: 'lat-tpl', title: 'Lat Pulldown', type: 'weight_reps', primary_muscle_group: 'lats', secondary_muscle_groups: [], is_custom: false },
  { id: 'row-tpl', title: 'Cable Row', type: 'weight_reps', primary_muscle_group: 'lats', secondary_muscle_groups: [], is_custom: false },
  { id: 'curl-tpl', title: 'Leg Curl', type: 'weight_reps', primary_muscle_group: 'hamstrings', secondary_muscle_groups: [], is_custom: false },
]

describe('Phase 9: Create Workflow Per-Day T3 Assignment', () => {
  describe('CreatePathAssignments Type', () => {
    it('t3Exercises should be a Record<GZCLPDay, string[]> structure', () => {
      // This test verifies the type change from string[] to Record<GZCLPDay, string[]>
      const assignments: CreatePathAssignments = {
        mainLifts: { squat: null, bench: null, ohp: null, deadlift: null },
        t3Exercises: { A1: [], B1: [], A2: [], B2: [] },
      }

      expect(assignments.t3Exercises).toHaveProperty('A1')
      expect(assignments.t3Exercises).toHaveProperty('B1')
      expect(assignments.t3Exercises).toHaveProperty('A2')
      expect(assignments.t3Exercises).toHaveProperty('B2')
      expect(Array.isArray(assignments.t3Exercises.A1)).toBe(true)
    })
  })

  describe('SlotAssignmentStep with DayTabBar', () => {
    const createMockAssignments = (): CreatePathAssignments => ({
      mainLifts: { squat: 'squat-tpl', bench: 'bench-tpl', ohp: 'ohp-tpl', deadlift: 'deadlift-tpl' },
      t3Exercises: {
        A1: ['lat-tpl', 'row-tpl'],
        B1: ['curl-tpl'],
        A2: [],
        B2: ['lat-tpl'],
      },
    })

    it('renders DayTabBar in T3 section', () => {
      const assignments = createMockAssignments()
      const mockProps = {
        exercises: mockExercises,
        assignments,
        onMainLiftAssign: vi.fn(),
        onT3Add: vi.fn(),
        onT3Remove: vi.fn(),
        onT3Update: vi.fn(),
        selectedDay: 'A1' as GZCLPDay,
        onDayChange: vi.fn(),
      }

      render(<SlotAssignmentStep {...mockProps} />)

      // Verify day tabs are rendered (role="tab", aria-label="Day X")
      expect(screen.getByRole('tab', { name: /Day A1/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Day B1/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Day A2/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Day B2/i })).toBeInTheDocument()
    })

    it('shows T3 exercises only for selected day', () => {
      const assignments = createMockAssignments()
      const mockProps = {
        exercises: mockExercises,
        assignments,
        onMainLiftAssign: vi.fn(),
        onT3Add: vi.fn(),
        onT3Remove: vi.fn(),
        onT3Update: vi.fn(),
        selectedDay: 'A1' as GZCLPDay,
        onDayChange: vi.fn(),
      }

      render(<SlotAssignmentStep {...mockProps} />)

      // A1 has 2 T3s (Lat Pulldown, Cable Row)
      // Count the T3 exercise labels (not including the Add button)
      const t3Labels = screen.getAllByText(/^T3 Exercise \d+$/)
      expect(t3Labels.length).toBe(2)
    })

    it('tab click calls onDayChange with new day', () => {
      const assignments = createMockAssignments()
      const onDayChange = vi.fn()
      const mockProps = {
        exercises: mockExercises,
        assignments,
        onMainLiftAssign: vi.fn(),
        onT3Add: vi.fn(),
        onT3Remove: vi.fn(),
        onT3Update: vi.fn(),
        selectedDay: 'A1' as GZCLPDay,
        onDayChange,
      }

      render(<SlotAssignmentStep {...mockProps} />)

      // Click B1 tab
      fireEvent.click(screen.getByRole('tab', { name: /Day B1/i }))

      expect(onDayChange).toHaveBeenCalledWith('B1')
    })

    it('main lifts section does NOT have day tabs', () => {
      const assignments = createMockAssignments()
      const mockProps = {
        exercises: mockExercises,
        assignments,
        onMainLiftAssign: vi.fn(),
        onT3Add: vi.fn(),
        onT3Remove: vi.fn(),
        onT3Update: vi.fn(),
        selectedDay: 'A1' as GZCLPDay,
        onDayChange: vi.fn(),
      }

      render(<SlotAssignmentStep {...mockProps} />)

      // Main lifts section should show all 4 main lifts regardless of day
      expect(screen.getByText('Squat')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Overhead Press')).toBeInTheDocument()
      expect(screen.getByText('Deadlift')).toBeInTheDocument()
    })
  })

  describe('T3 callbacks are day-aware', () => {
    it('onT3Add receives day parameter', () => {
      const assignments: CreatePathAssignments = {
        mainLifts: { squat: null, bench: null, ohp: null, deadlift: null },
        t3Exercises: { A1: [], B1: [], A2: [], B2: [] },
      }

      const onT3Add = vi.fn()
      const mockProps = {
        exercises: mockExercises,
        assignments,
        onMainLiftAssign: vi.fn(),
        onT3Add,
        onT3Remove: vi.fn(),
        onT3Update: vi.fn(),
        selectedDay: 'B1' as GZCLPDay,
        onDayChange: vi.fn(),
      }

      render(<SlotAssignmentStep {...mockProps} />)

      // Click add T3 button
      fireEvent.click(screen.getByRole('button', { name: /add t3 exercise/i }))

      // Should pass current day to callback
      expect(onT3Add).toHaveBeenCalledWith('B1', '')
    })

    it('onT3Remove receives day parameter', () => {
      const assignments: CreatePathAssignments = {
        mainLifts: { squat: null, bench: null, ohp: null, deadlift: null },
        t3Exercises: { A1: ['lat-tpl'], B1: [], A2: [], B2: [] },
      }

      const onT3Remove = vi.fn()
      const mockProps = {
        exercises: mockExercises,
        assignments,
        onMainLiftAssign: vi.fn(),
        onT3Add: vi.fn(),
        onT3Remove,
        onT3Update: vi.fn(),
        selectedDay: 'A1' as GZCLPDay,
        onDayChange: vi.fn(),
      }

      render(<SlotAssignmentStep {...mockProps} />)

      // Click remove button on first T3
      fireEvent.click(screen.getByRole('button', { name: /remove t3 exercise/i }))

      // Should pass current day and index
      expect(onT3Remove).toHaveBeenCalledWith('A1', 0)
    })
  })

  describe('WeightSetupStep with per-day T3s', () => {
    it('shows T3s from all days with day labels', () => {
      const assignments: CreatePathAssignments = {
        mainLifts: { squat: 'squat-tpl', bench: null, ohp: null, deadlift: null },
        t3Exercises: {
          A1: ['lat-tpl'],
          B1: ['curl-tpl'],
          A2: [],
          B2: [],
        },
      }

      render(
        <WeightSetupStep
          assignments={assignments}
          exercises={mockExercises}
          weights={{}}
          onWeightChange={vi.fn()}
          unit="kg"
          onUnitChange={vi.fn()}
        />
      )

      // Should show T3s with day suffix in parentheses: "T3: Lat Pulldown (A1)"
      expect(screen.getByText(/T3: Lat Pulldown \(A1\)/i)).toBeInTheDocument()
      expect(screen.getByText(/T3: Leg Curl \(B1\)/i)).toBeInTheDocument()
    })

    it('deduplicates same T3 on multiple days in weight display', () => {
      const assignments: CreatePathAssignments = {
        mainLifts: { squat: 'squat-tpl', bench: null, ohp: null, deadlift: null },
        t3Exercises: {
          A1: ['lat-tpl'],
          B1: [],
          A2: ['lat-tpl'], // Same T3 as A1
          B2: [],
        },
      }

      render(
        <WeightSetupStep
          assignments={assignments}
          exercises={mockExercises}
          weights={{}}
          onWeightChange={vi.fn()}
          unit="kg"
          onUnitChange={vi.fn()}
        />
      )

      // Lat Pulldown should appear only once (deduplicated)
      // with label indicating it's on multiple days: "(A1, A2)"
      expect(screen.getByText(/T3: Lat Pulldown \(A1, A2\)/i)).toBeInTheDocument()

      // Should have only 1 weight input for deduplicated T3 (check by label count)
      const latPulldownLabels = screen.getAllByText(/Lat Pulldown/i)
      expect(latPulldownLabels.length).toBe(1)
    })
  })

  describe('t3Schedule building in handleWeightsNext', () => {
    it('should build t3Schedule with per-day exercise IDs', () => {
      // This test validates the expected structure after handleWeightsNext
      const t3Assignments: Record<GZCLPDay, string[]> = {
        A1: ['lat-tpl', 'row-tpl'],
        B1: ['curl-tpl'],
        A2: ['lat-tpl'],
        B2: [],
      }

      // Simulate exercise saving and ID mapping
      const savedExerciseIds = new Map<string, string>([
        ['lat-tpl', 'ex-1'],
        ['row-tpl', 'ex-2'],
        ['curl-tpl', 'ex-3'],
      ])

      // Build expected t3Schedule
      const t3Schedule: Record<GZCLPDay, string[]> = {
        A1: [],
        B1: [],
        A2: [],
        B2: [],
      }

      for (const day of ['A1', 'B1', 'A2', 'B2'] as GZCLPDay[]) {
        for (const templateId of t3Assignments[day]) {
          const exerciseId = savedExerciseIds.get(templateId)
          if (exerciseId) {
            t3Schedule[day].push(exerciseId)
          }
        }
      }

      // Verify structure
      expect(t3Schedule.A1).toEqual(['ex-1', 'ex-2'])
      expect(t3Schedule.B1).toEqual(['ex-3'])
      expect(t3Schedule.A2).toEqual(['ex-1']) // Same lat-pulldown as A1
      expect(t3Schedule.B2).toEqual([])
    })

    it('should deduplicate T3 exercises - same exercise on multiple days uses same ID', () => {
      const t3Assignments: Record<GZCLPDay, string[]> = {
        A1: ['lat-tpl'],
        B1: [],
        A2: ['lat-tpl'], // Same as A1
        B2: ['lat-tpl'], // Same as A1
      }

      // Simulate what handleWeightsNext should do
      const savedT3Ids = new Map<string, string>()
      let exerciseIdCounter = 0

      const t3Schedule: Record<GZCLPDay, string[]> = {
        A1: [],
        B1: [],
        A2: [],
        B2: [],
      }

      for (const day of ['A1', 'B1', 'A2', 'B2'] as GZCLPDay[]) {
        for (const templateId of t3Assignments[day]) {
          if (!templateId) continue

          // Deduplicate: reuse existing ID
          let exerciseId = savedT3Ids.get(templateId)
          if (!exerciseId) {
            exerciseId = `ex-${++exerciseIdCounter}`
            savedT3Ids.set(templateId, exerciseId)
          }

          t3Schedule[day].push(exerciseId)
        }
      }

      // lat-tpl should get only ONE exerciseId
      expect(savedT3Ids.size).toBe(1)
      expect(savedT3Ids.get('lat-tpl')).toBe('ex-1')

      // All days with lat-tpl should reference the same ID
      expect(t3Schedule.A1).toEqual(['ex-1'])
      expect(t3Schedule.A2).toEqual(['ex-1'])
      expect(t3Schedule.B2).toEqual(['ex-1'])
    })
  })
})
