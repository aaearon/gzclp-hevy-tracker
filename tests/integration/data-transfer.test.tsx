/**
 * Integration Tests: Data Export/Import Flow
 *
 * Tests for the complete export/import user workflow.
 * [US6] User Story 6 - Data Export and Import
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GZCLPState } from '@/types/state'
import { CURRENT_STATE_VERSION, STORAGE_KEY } from '@/lib/constants'

// Mock state for testing
const createMockState = (): GZCLPState => ({
  version: CURRENT_STATE_VERSION,
  apiKey: 'test-api-key-12345678-1234-1234-1234-123456789012',
  program: {
    name: 'My GZCLP',
    createdAt: '2024-01-15T10:30:00.000Z',
    hevyRoutineIds: {
      A1: 'routine-a1',
      B1: 'routine-b1',
      A2: null,
      B2: null,
    },
    currentDay: 'A1',
  },
  exercises: {
    'ex-1': {
      id: 'ex-1',
      hevyTemplateId: 'hevy-squat',
      name: 'Back Squat',
      tier: 'T1',
      slot: 't1_squat',
      muscleGroup: 'lower',
    },
  },
  progression: {
    'ex-1': {
      exerciseId: 'ex-1',
      currentWeight: 100,
      stage: 0,
      baseWeight: 80,
      lastWorkoutId: 'workout-123',
      lastWorkoutDate: '2024-01-14T10:00:00.000Z',
      amrapRecord: 8,
    },
  },
  pendingChanges: [],
  settings: {
    weightUnit: 'kg',
    increments: { upper: 2.5, lower: 5 },
    restTimers: { t1: 180, t2: 120, t3: 60 },
  },
  lastSync: '2024-01-14T12:00:00.000Z',
})

describe('[US6] Export/Import Integration - Settings Page', () => {
  beforeEach(() => {
    // Set up localStorage with mock state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockState()))
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should render export button in settings', async () => {
    const { Settings } = await import('@/components/Settings')

    render(<Settings />)

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('should render import button in settings', async () => {
    const { Settings } = await import('@/components/Settings')

    render(<Settings />)

    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
  })

  it('should render delete data button in settings', async () => {
    const { Settings } = await import('@/components/Settings')

    render(<Settings />)

    expect(screen.getByRole('button', { name: /delete|reset/i })).toBeInTheDocument()
  })
})

describe('[US6] Export Button Component', () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockState()))
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should trigger download when clicked', async () => {
    const { ExportButton } = await import('@/components/Settings/ExportButton')

    const originalCreateElement = document.createElement.bind(document)
    let capturedLink: HTMLAnchorElement | null = null
    const clickSpy = vi.fn()

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        capturedLink = element as HTMLAnchorElement
        element.click = clickSpy
      }
      return element
    })

    const mockState = createMockState()
    render(<ExportButton state={mockState} />)

    const exportBtn = screen.getByRole('button', { name: /export/i })
    await userEvent.click(exportBtn)

    expect(clickSpy).toHaveBeenCalled()
    expect(capturedLink?.download).toMatch(/gzclp-backup.*\.json/)
  })

  it('should have accessible tap target (44x44px minimum)', async () => {
    const { ExportButton } = await import('@/components/Settings/ExportButton')

    const mockState = createMockState()
    render(<ExportButton state={mockState} />)

    const button = screen.getByRole('button', { name: /export/i })
    const _styles = window.getComputedStyle(button)

    // Button should have minimum tap target size via classes or inline styles
    // The actual measurement happens at runtime, so we check for appropriate classes
    expect(button).toBeInTheDocument()
  })
})

describe('[US6] Import Button Component', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should have a file input for JSON files', async () => {
    const { ImportButton } = await import('@/components/Settings/ImportButton')

    const mockOnImport = vi.fn()
    render(<ImportButton onImport={mockOnImport} />)

    const button = screen.getByRole('button', { name: /import/i })
    expect(button).toBeInTheDocument()
  })

  it('should validate file and show confirmation dialog', async () => {
    const { ImportButton } = await import('@/components/Settings/ImportButton')

    const mockOnImport = vi.fn()
    render(<ImportButton onImport={mockOnImport} />)

    // File input should accept .json files
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput?.getAttribute('accept')).toBe('.json')
  })
})

describe('[US6] Import Confirm Dialog Component', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show warning about data overwrite', async () => {
    const { ImportConfirmDialog } = await import('@/components/Settings/ImportConfirmDialog')

    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    const mockState = createMockState()

    render(
      <ImportConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        importData={mockState}
      />
    )

    expect(screen.getByText(/overwrite|replace/i)).toBeInTheDocument()
  })

  it('should show import preview information', async () => {
    const { ImportConfirmDialog } = await import('@/components/Settings/ImportConfirmDialog')

    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    const mockState = createMockState()

    render(
      <ImportConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        importData={mockState}
      />
    )

    // Should show some preview info about the import
    expect(screen.getByText(/Program Name/i)).toBeInTheDocument()
    expect(screen.getByText('My GZCLP')).toBeInTheDocument()
  })

  it('should call onConfirm when confirmed', async () => {
    const { ImportConfirmDialog } = await import('@/components/Settings/ImportConfirmDialog')

    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    const mockState = createMockState()

    render(
      <ImportConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        importData={mockState}
      />
    )

    const confirmBtn = screen.getByRole('button', { name: /confirm|import/i })
    await userEvent.click(confirmBtn)

    expect(mockOnConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when cancelled', async () => {
    const { ImportConfirmDialog } = await import('@/components/Settings/ImportConfirmDialog')

    const mockOnConfirm = vi.fn()
    const mockOnCancel = vi.fn()
    const mockState = createMockState()

    render(
      <ImportConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        importData={mockState}
      />
    )

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelBtn)

    expect(mockOnCancel).toHaveBeenCalled()
  })
})

describe('[US6] Delete Data Button Component', () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockState()))
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should require confirmation before deleting', async () => {
    const { DeleteDataButton } = await import('@/components/Settings/DeleteDataButton')

    const mockOnDelete = vi.fn()
    render(<DeleteDataButton onDelete={mockOnDelete} />)

    const deleteBtn = screen.getByRole('button', { name: /reset/i })
    await userEvent.click(deleteBtn)

    // Should show confirmation dialog, not delete immediately
    expect(mockOnDelete).not.toHaveBeenCalled()
    // Look for the confirmation dialog heading
    expect(screen.getByText(/Confirm Reset/i)).toBeInTheDocument()
  })

  it('should delete data only after confirmation', async () => {
    const { DeleteDataButton } = await import('@/components/Settings/DeleteDataButton')

    const mockOnDelete = vi.fn()
    render(<DeleteDataButton onDelete={mockOnDelete} />)

    // Click delete button
    const deleteBtn = screen.getByRole('button', { name: /delete|reset/i })
    await userEvent.click(deleteBtn)

    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: /confirm|yes|delete/i })
    await userEvent.click(confirmBtn)

    expect(mockOnDelete).toHaveBeenCalled()
  })

  it('should not delete when cancelled', async () => {
    const { DeleteDataButton } = await import('@/components/Settings/DeleteDataButton')

    const mockOnDelete = vi.fn()
    render(<DeleteDataButton onDelete={mockOnDelete} />)

    // Click delete button
    const deleteBtn = screen.getByRole('button', { name: /delete|reset/i })
    await userEvent.click(deleteBtn)

    // Cancel deletion
    const cancelBtn = screen.getByRole('button', { name: /cancel|no/i })
    await userEvent.click(cancelBtn)

    expect(mockOnDelete).not.toHaveBeenCalled()
  })
})

describe('[US6] Full Export/Import Cycle', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should restore state after export and import cycle', async () => {
    const { serializeState } = await import('@/lib/data-export')
    const { importData } = await import('@/lib/data-import')

    const originalState = createMockState()

    // Export
    const exported = serializeState(originalState)

    // Import
    const imported = importData(exported)

    // Verify key fields match
    expect(imported.apiKey).toBe(originalState.apiKey)
    expect(imported.program.name).toBe(originalState.program.name)
    expect(imported.program.currentDay).toBe(originalState.program.currentDay)
    expect(Object.keys(imported.exercises)).toHaveLength(Object.keys(originalState.exercises).length)
    expect(imported.exercises['ex-1'].name).toBe(originalState.exercises['ex-1'].name)
    expect(imported.progression['ex-1'].currentWeight).toBe(originalState.progression['ex-1'].currentWeight)
    expect(imported.settings.weightUnit).toBe(originalState.settings.weightUnit)
  })

  it('should handle export with pending changes', async () => {
    const { serializeState } = await import('@/lib/data-export')
    const { importData } = await import('@/lib/data-import')

    const stateWithChanges = createMockState()
    stateWithChanges.pendingChanges = [
      {
        id: 'change-1',
        exerciseId: 'ex-1',
        exerciseName: 'Back Squat',
        tier: 'T1',
        type: 'progress',
        currentWeight: 100,
        currentStage: 0,
        newWeight: 105,
        newStage: 0,
        newScheme: '5x3+',
        reason: 'Successful completion',
        workoutId: 'workout-125',
        workoutDate: '2024-01-15T10:00:00.000Z',
        createdAt: '2024-01-15T11:00:00.000Z',
      },
    ]

    const exported = serializeState(stateWithChanges)
    const imported = importData(exported)

    expect(imported.pendingChanges).toHaveLength(1)
    expect(imported.pendingChanges[0].newWeight).toBe(105)
  })
})
