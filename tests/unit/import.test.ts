/**
 * Unit Tests: Data Import Validation
 *
 * Tests for importing and validating exported application state.
 * [US6] User Story 6 - Data Export and Import
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { GZCLPState } from '@/types/state'
import { CURRENT_STATE_VERSION } from '@/lib/constants'

// Create a valid exportable state for testing
const createValidExportData = (): Record<string, unknown> => ({
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
  _exportMeta: {
    exportedAt: '2024-01-15T10:30:00.000Z',
    appVersion: CURRENT_STATE_VERSION,
  },
})

describe('[US6] Data Import - parseImportData', () => {
  let parseImportData: (data: string) => Record<string, unknown>

  beforeEach(async () => {
    const module = await import('@/lib/data-import')
    parseImportData = module.parseImportData
  })

  it('should parse valid JSON string', () => {
    const validData = JSON.stringify(createValidExportData())
    const result = parseImportData(validData)

    expect(result).toBeDefined()
    expect(result.version).toBe(CURRENT_STATE_VERSION)
  })

  it('should throw on invalid JSON', () => {
    expect(() => parseImportData('not valid json')).toThrow('Invalid JSON')
    expect(() => parseImportData('{broken: json}')).toThrow('Invalid JSON')
    expect(() => parseImportData('')).toThrow('Invalid JSON')
  })

  it('should throw on non-object JSON', () => {
    expect(() => parseImportData('"string"')).toThrow('expected object')
    expect(() => parseImportData('[1, 2, 3]')).toThrow('expected object')
    expect(() => parseImportData('null')).toThrow('expected object')
  })
})

describe('[US6] Data Import - validateImportStructure', () => {
  let validateImportStructure: (data: Record<string, unknown>) => void

  beforeEach(async () => {
    const module = await import('@/lib/data-import')
    validateImportStructure = module.validateImportStructure
  })

  it('should accept valid export data structure', () => {
    const validData = createValidExportData()
    expect(() => { validateImportStructure(validData); }).not.toThrow()
  })

  it('should reject missing version field', () => {
    const invalidData = createValidExportData()
    delete invalidData.version
    expect(() => { validateImportStructure(invalidData); }).toThrow('missing required field: version')
  })

  it('should reject missing apiKey field', () => {
    const invalidData = createValidExportData()
    delete invalidData.apiKey
    expect(() => { validateImportStructure(invalidData); }).toThrow('missing required field: apiKey')
  })

  it('should reject missing program field', () => {
    const invalidData = createValidExportData()
    delete invalidData.program
    expect(() => { validateImportStructure(invalidData); }).toThrow('missing required field: program')
  })

  it('should reject missing exercises field', () => {
    const invalidData = createValidExportData()
    delete invalidData.exercises
    expect(() => { validateImportStructure(invalidData); }).toThrow('missing required field: exercises')
  })

  it('should reject missing progression field', () => {
    const invalidData = createValidExportData()
    delete invalidData.progression
    expect(() => { validateImportStructure(invalidData); }).toThrow('missing required field: progression')
  })

  it('should reject missing settings field', () => {
    const invalidData = createValidExportData()
    delete invalidData.settings
    expect(() => { validateImportStructure(invalidData); }).toThrow('missing required field: settings')
  })

  it('should reject invalid version format', () => {
    const invalidData = createValidExportData()
    invalidData.version = 'not-a-version'
    expect(() => { validateImportStructure(invalidData); }).toThrow('invalid version format')
  })

  it('should accept valid semver versions', () => {
    const validData = createValidExportData()
    validData.version = '0.1.0'
    expect(() => { validateImportStructure(validData); }).not.toThrow()

    validData.version = '2.10.15'
    expect(() => { validateImportStructure(validData); }).not.toThrow()
  })

  it('should reject invalid program structure', () => {
    const invalidData = createValidExportData()
    invalidData.program = { name: 'Test' } // Missing required fields
    expect(() => { validateImportStructure(invalidData); }).toThrow('invalid program structure')
  })

  it('should reject invalid settings structure', () => {
    const invalidData = createValidExportData()
    invalidData.settings = { weightUnit: 'kg' } // Missing increments and restTimers
    expect(() => { validateImportStructure(invalidData); }).toThrow('invalid settings structure')
  })
})

describe('[US6] Data Import - checkVersion', () => {
  let checkVersion: (version: string) => { needsMigration: boolean; isNewer: boolean }

  beforeEach(async () => {
    const module = await import('@/lib/data-import')
    checkVersion = module.checkVersion
  })

  it('should return no migration needed for current version', () => {
    const result = checkVersion(CURRENT_STATE_VERSION)
    expect(result.needsMigration).toBe(false)
    expect(result.isNewer).toBe(false)
  })

  it('should indicate migration needed for older versions', () => {
    const result = checkVersion('0.9.0')
    expect(result.needsMigration).toBe(true)
    expect(result.isNewer).toBe(false)
  })

  it('should indicate newer version for future versions', () => {
    const result = checkVersion('99.0.0')
    expect(result.needsMigration).toBe(false)
    expect(result.isNewer).toBe(true)
  })
})

describe('[US6] Data Import - importData', () => {
  let importData: (data: string) => GZCLPState

  beforeEach(async () => {
    const module = await import('@/lib/data-import')
    importData = module.importData
  })

  it('should return migrated state from valid export data', () => {
    const validData = JSON.stringify(createValidExportData())
    const result = importData(validData)

    expect(result.version).toBe(CURRENT_STATE_VERSION)
    expect(result.apiKey).toBe('test-api-key-12345678-1234-1234-1234-123456789012')
    expect(result.program.name).toBe('My GZCLP')
    expect(result.exercises['ex-1']).toBeDefined()
  })

  it('should strip export metadata from imported state', () => {
    const validData = JSON.stringify(createValidExportData())
    const result = importData(validData)

     
    expect((result as any)._exportMeta).toBeUndefined()
  })

  it('should apply migrations for older versions', () => {
    const oldVersionData = createValidExportData()
    oldVersionData.version = '0.9.0'
    const dataStr = JSON.stringify(oldVersionData)

    const result = importData(dataStr)

    // After migration, version should be current
    expect(result.version).toBe(CURRENT_STATE_VERSION)
  })

  it('should preserve data when importing newer versions', () => {
    const newerVersionData = createValidExportData()
    newerVersionData.version = '99.0.0'
    const dataStr = JSON.stringify(newerVersionData)

    // Should not throw, should preserve data (with warning)
    const result = importData(dataStr)
    expect(result.apiKey).toBe('test-api-key-12345678-1234-1234-1234-123456789012')
  })

  it('should handle empty exercises and progression', () => {
    const validData = createValidExportData()
    validData.exercises = {}
    validData.progression = {}
    const dataStr = JSON.stringify(validData)

    const result = importData(dataStr)
    expect(result.exercises).toEqual({})
    expect(result.progression).toEqual({})
  })

  it('should throw descriptive error for invalid data', () => {
    expect(() => importData('not json')).toThrow()
  })
})

describe('[US6] Data Import - validateImportFile', () => {
  let validateImportFile: (file: File) => Promise<{ isValid: boolean; error?: string; data?: GZCLPState }>

  beforeEach(async () => {
    const module = await import('@/lib/data-import')
    validateImportFile = module.validateImportFile
  })

  it('should validate a correct JSON file', async () => {
    const validData = JSON.stringify(createValidExportData())
    const file = new File([validData], 'backup.json', { type: 'application/json' })

    const result = await validateImportFile(file)

    expect(result.isValid).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.error).toBeUndefined()
  })

  it('should reject non-JSON files', async () => {
    const file = new File(['not json'], 'backup.txt', { type: 'text/plain' })

    const result = await validateImportFile(file)

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('JSON')
  })

  it('should reject files that are too large', async () => {
    // Create a 6MB file (over 5MB limit)
    const largeContent = 'x'.repeat(6 * 1024 * 1024)
    const file = new File([largeContent], 'large.json', { type: 'application/json' })

    const result = await validateImportFile(file)

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('size')
  })

  it('should return error for invalid structure', async () => {
    const invalidData = JSON.stringify({ notValid: true })
    const file = new File([invalidData], 'backup.json', { type: 'application/json' })

    const result = await validateImportFile(file)

    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })
})
