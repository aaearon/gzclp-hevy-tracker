/**
 * DayReviewPanel Component Tests
 *
 * Tests for the panel displaying T1/T2/T3 exercises for a single day.
 *
 * Phase 6: UI Components - Day Review Panel
 * @see docs/006-per-day-t3-and-import-ux.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DayReviewPanel } from '@/components/SetupWizard/DayReviewPanel'
import type { DayImportData, ImportedExercise } from '@/types/state'

// Helper to create a mock ImportedExercise
function createMockExercise(overrides: Partial<ImportedExercise> = {}): ImportedExercise {
  return {
    templateId: 'template-123',
    name: 'Test Exercise',
    detectedWeight: 60,
    detectedStage: 0,
    stageConfidence: 'high',
    originalSetCount: 5,
    originalRepScheme: '5x3+',
    ...overrides,
  }
}

// Helper to create mock day data
function createMockDayData(overrides: Partial<DayImportData> = {}): DayImportData {
  return {
    day: 'A1',
    t1: createMockExercise({ name: 'Squat', role: 'squat', detectedWeight: 100 }),
    t2: createMockExercise({ name: 'Bench Press', role: 'bench', detectedWeight: 60, originalRepScheme: '3x10' }),
    t3s: [
      createMockExercise({ name: 'Lat Pulldown', role: 't3', detectedWeight: 40, originalRepScheme: '3x15+' }),
      createMockExercise({ name: 'Cable Row', role: 't3', detectedWeight: 35, originalRepScheme: '3x15+' }),
    ],
    ...overrides,
  }
}

describe('DayReviewPanel', () => {
  const defaultProps = {
    dayData: createMockDayData(),
    onT1Update: vi.fn(),
    onT2Update: vi.fn(),
    onT3Remove: vi.fn(),
    unit: 'kg' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('T1 exercise card', () => {
    it('renders T1 exercise name', () => {
      render(<DayReviewPanel {...defaultProps} />)

      expect(screen.getByText('Squat')).toBeInTheDocument()
    })

    it('renders T1 section heading', () => {
      render(<DayReviewPanel {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /T1/i })).toBeInTheDocument()
    })

    it('shows weight input for T1 exercise', () => {
      render(<DayReviewPanel {...defaultProps} />)

      // Find the T1 weight input by its label or associated text
      const t1Input = screen.getByLabelText(/T1.*weight/i)
      expect(t1Input).toBeInTheDocument()
      expect(t1Input).toHaveValue(100)
    })

    it('calls onT1Update when T1 weight changes', async () => {
      const onT1Update = vi.fn()
      render(<DayReviewPanel {...defaultProps} onT1Update={onT1Update} />)

      const t1Input = screen.getByLabelText(/T1.*weight/i)
      await userEvent.clear(t1Input)
      await userEvent.type(t1Input, '110')

      expect(onT1Update).toHaveBeenCalled()
    })

    it('shows empty state when T1 is null', () => {
      const dayDataWithoutT1 = createMockDayData({ t1: null })
      render(<DayReviewPanel {...defaultProps} dayData={dayDataWithoutT1} />)

      expect(screen.getByText(/no T1/i)).toBeInTheDocument()
    })
  })

  describe('T2 exercise card', () => {
    it('renders T2 exercise name', () => {
      render(<DayReviewPanel {...defaultProps} />)

      expect(screen.getByText('Bench Press')).toBeInTheDocument()
    })

    it('renders T2 section heading', () => {
      render(<DayReviewPanel {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /T2/i })).toBeInTheDocument()
    })

    it('shows weight input for T2 exercise', () => {
      render(<DayReviewPanel {...defaultProps} />)

      const t2Input = screen.getByLabelText(/T2.*weight/i)
      expect(t2Input).toBeInTheDocument()
      expect(t2Input).toHaveValue(60)
    })

    it('calls onT2Update when T2 weight changes', async () => {
      const onT2Update = vi.fn()
      render(<DayReviewPanel {...defaultProps} onT2Update={onT2Update} />)

      const t2Input = screen.getByLabelText(/T2.*weight/i)
      await userEvent.clear(t2Input)
      await userEvent.type(t2Input, '65')

      expect(onT2Update).toHaveBeenCalled()
    })

    it('shows empty state when T2 is null', () => {
      const dayDataWithoutT2 = createMockDayData({ t2: null })
      render(<DayReviewPanel {...defaultProps} dayData={dayDataWithoutT2} />)

      expect(screen.getByText(/no T2/i)).toBeInTheDocument()
    })
  })

  describe('T3 exercise list', () => {
    it('renders T3 section heading', () => {
      render(<DayReviewPanel {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /T3/i })).toBeInTheDocument()
    })

    it('renders T3 exercise names', () => {
      render(<DayReviewPanel {...defaultProps} />)

      expect(screen.getByText('Lat Pulldown')).toBeInTheDocument()
      expect(screen.getByText('Cable Row')).toBeInTheDocument()
    })

    it('shows remove button for each T3', () => {
      render(<DayReviewPanel {...defaultProps} />)

      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      expect(removeButtons).toHaveLength(2)
    })

    it('calls onT3Remove with correct index when remove button clicked', async () => {
      const onT3Remove = vi.fn()
      render(<DayReviewPanel {...defaultProps} onT3Remove={onT3Remove} />)

      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await userEvent.click(removeButtons[1]) // Click second remove button

      expect(onT3Remove).toHaveBeenCalledWith(1)
    })

    it('shows empty state when no T3s', () => {
      const dayDataWithoutT3s = createMockDayData({ t3s: [] })
      render(<DayReviewPanel {...defaultProps} dayData={dayDataWithoutT3s} />)

      expect(screen.getByText(/no T3/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has accessible labels for weight inputs', () => {
      render(<DayReviewPanel {...defaultProps} />)

      expect(screen.getByLabelText(/T1.*weight/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/T2.*weight/i)).toBeInTheDocument()
    })
  })

  describe('weight unit display', () => {
    it('shows kg when unit is kg', () => {
      render(<DayReviewPanel {...defaultProps} unit="kg" />)

      expect(screen.getAllByText('kg').length).toBeGreaterThan(0)
    })

    it('shows lbs when unit is lbs', () => {
      render(<DayReviewPanel {...defaultProps} unit="lbs" />)

      expect(screen.getAllByText('lbs').length).toBeGreaterThan(0)
    })
  })
})
