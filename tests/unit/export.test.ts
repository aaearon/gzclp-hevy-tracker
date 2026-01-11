/**
 * Unit Tests: Data Export Serialization
 *
 * Tests for exporting application state to a downloadable JSON file.
 * [US6] User Story 6 - Data Export and Import
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { GZCLPState } from '@/types/state'
import { CURRENT_STATE_VERSION } from '@/lib/constants'

// Mock the createInitialState to avoid importing the full state factory in tests
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
    'ex-2': {
      id: 'ex-2',
      hevyTemplateId: 'hevy-bench',
      name: 'Bench Press',
      tier: 'T1',
      slot: 't1_bench',
      muscleGroup: 'upper',
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
    'ex-2': {
      exerciseId: 'ex-2',
      currentWeight: 60,
      stage: 1,
      baseWeight: 50,
      lastWorkoutId: 'workout-124',
      lastWorkoutDate: '2024-01-14T10:00:00.000Z',
      amrapRecord: 5,
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

describe('[US6] Data Export - serializeState', () => {
  // Import will be dynamic after implementation exists
  let serializeState: (state: GZCLPState) => string

  beforeEach(async () => {
    const module = await import('@/lib/data-export')
    serializeState = module.serializeState
  })

  it('should serialize state to valid JSON string', () => {
    const state = createMockState()
    const serialized = serializeState(state)

    expect(() => JSON.parse(serialized)).not.toThrow()
  })

  it('should preserve all state fields in serialization (except apiKey)', () => {
    const state = createMockState()
    const serialized = serializeState(state)
    const parsed = JSON.parse(serialized)

    expect(parsed.version).toBe(state.version)
    expect(parsed.program).toEqual(state.program)
    expect(parsed.exercises).toEqual(state.exercises)
    expect(parsed.progression).toEqual(state.progression)
    expect(parsed.settings).toEqual(state.settings)
    expect(parsed.lastSync).toBe(state.lastSync)
  })

  it('should exclude apiKey from export for security', () => {
    const state = createMockState()
    const serialized = serializeState(state)
    const parsed = JSON.parse(serialized)

    // apiKey should be empty, not the original value
    expect(parsed.apiKey).toBe('')
    expect(parsed.apiKey).not.toBe(state.apiKey)
  })

  it('should include export metadata', () => {
    const state = createMockState()
    const serialized = serializeState(state)
    const parsed = JSON.parse(serialized)

    expect(parsed._exportMeta).toBeDefined()
    expect(parsed._exportMeta.exportedAt).toBeDefined()
    expect(parsed._exportMeta.appVersion).toBe(CURRENT_STATE_VERSION)
  })

  it('should handle state with empty exercises', () => {
    const state = createMockState()
    state.exercises = {}
    state.progression = {}

    const serialized = serializeState(state)
    const parsed = JSON.parse(serialized)

    expect(parsed.exercises).toEqual({})
    expect(parsed.progression).toEqual({})
  })

  it('should handle state with pending changes', () => {
    const state = createMockState()
    state.pendingChanges = [
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

    const serialized = serializeState(state)
    const parsed = JSON.parse(serialized)

    expect(parsed.pendingChanges).toHaveLength(1)
    expect(parsed.pendingChanges[0].id).toBe('change-1')
  })
})

describe('[US6] Data Export - generateExportFilename', () => {
  let generateExportFilename: () => string

  beforeEach(async () => {
    const module = await import('@/lib/data-export')
    generateExportFilename = module.generateExportFilename
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should generate filename with gzclp prefix', () => {
    const filename = generateExportFilename()
    expect(filename.startsWith('gzclp-backup-')).toBe(true)
  })

  it('should include date in filename', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'))

    const filename = generateExportFilename()

    expect(filename).toContain('2024-01-15')
    expect(filename.endsWith('.json')).toBe(true)
  })

  it('should generate valid filename characters only', () => {
    const filename = generateExportFilename()
    // Should only contain alphanumeric, dash, underscore, dot
    expect(filename).toMatch(/^[a-zA-Z0-9_.-]+$/)
  })
})

describe('[US6] Data Export - triggerDownload', () => {
  let triggerDownload: (data: string, filename: string) => void

  beforeEach(async () => {
    const module = await import('@/lib/data-export')
    triggerDownload = module.triggerDownload
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create and click a download link', () => {
    // Spy on click to verify it was called
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        element.click = clickSpy
      }
      return element
    })

    triggerDownload('{"test": true}', 'test.json')

    expect(clickSpy).toHaveBeenCalled()
  })

  it('should set correct filename and content type', () => {
    const originalCreateElement = document.createElement.bind(document)
    let capturedLink: HTMLAnchorElement | null = null

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        capturedLink = element as HTMLAnchorElement
        element.click = vi.fn()
      }
      return element
    })

    triggerDownload('{"test": true}', 'test-file.json')

    expect(capturedLink).not.toBeNull()
    expect(capturedLink?.download).toBe('test-file.json')
    expect(capturedLink?.href).toContain('blob:')
  })
})

describe('[US6] Data Export - exportState (integration)', () => {
  let exportState: (state: GZCLPState) => void

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'))

    const module = await import('@/lib/data-export')
    exportState = module.exportState
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should serialize state and trigger download with correct filename', () => {
    const originalCreateElement = document.createElement.bind(document)
    let capturedLink: HTMLAnchorElement | null = null

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        capturedLink = element as HTMLAnchorElement
        element.click = vi.fn()
      }
      return element
    })

    const state = createMockState()
    exportState(state)

    expect(capturedLink).not.toBeNull()
    expect(capturedLink?.download).toMatch(/^gzclp-backup-2024-01-15.*\.json$/)
  })
})
