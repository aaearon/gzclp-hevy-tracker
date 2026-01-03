# Quickstart: Routine Selection Wizard

**Date**: 2026-01-03
**Branch**: `002-routine-selection-wizard`

## Overview

This guide provides step-by-step instructions for implementing the routine selection wizard feature. Follow TDD principles: write tests first, then implement.

## Prerequisites

- Base feature (001-gzclp-hevy-tracker) fully implemented
- Familiarity with existing SetupWizard component structure
- Understanding of GZCLP progression rules

## Implementation Order

Follow this order to maintain testability and minimize integration issues:

### Phase 1: Core Logic (lib/)

**1. Stage Detector (`src/lib/stage-detector.ts`)**

TDD approach:
```typescript
// tests/unit/stage-detector.test.ts
describe('detectStage', () => {
  describe('T1 detection', () => {
    it('detects 5x3 as Stage 0 with high confidence', () => {
      const sets = createNormalSets(5, 3);
      const result = detectStage(sets, 'T1');
      expect(result).toEqual({
        stage: 0,
        confidence: 'high',
        setCount: 5,
        repScheme: '5x3+',
      });
    });

    it('handles AMRAP with higher final reps', () => {
      const sets = [
        ...createNormalSets(4, 3),
        createNormalSet(8), // AMRAP set
      ];
      const result = detectStage(sets, 'T1');
      expect(result?.stage).toBe(0); // Still detected as Stage 0
    });

    it('returns null for unknown pattern', () => {
      const sets = createNormalSets(4, 5);
      const result = detectStage(sets, 'T1');
      expect(result).toBeNull();
    });
  });
});
```

**2. Routine Importer (`src/lib/routine-importer.ts`)**

TDD approach:
```typescript
// tests/unit/routine-importer.test.ts
describe('extractFromRoutines', () => {
  it('maps A1 position 1 to t1_squat slot', () => {
    const routine = createMockRoutine('Squat', 'Bench', 'Pulldown');
    const result = extractFromRoutines(
      new Map([['routine-1', routine]]),
      { A1: 'routine-1', B1: null, A2: null, B2: null }
    );

    expect(result.exercises[0].slot).toBe('t1_squat');
    expect(result.exercises[0].name).toBe('Squat');
  });

  it('generates warning for routine with <2 exercises', () => {
    const routine = createMockRoutine('Squat'); // Only 1 exercise
    const result = extractFromRoutines(
      new Map([['routine-1', routine]]),
      { A1: 'routine-1', B1: null, A2: null, B2: null }
    );

    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: 'no_t2', day: 'A1' })
    );
  });
});
```

### Phase 2: UI Components

**3. RoutineSelector (`src/components/common/RoutineSelector.tsx`)**

Key features:
- Full-screen modal on mobile
- Search input with filtering
- Rich list items (title + exercise preview)
- Sorted by modification date

```tsx
interface RoutineSelectorProps {
  routines: AvailableRoutine[];
  selectedId: string | null;
  onSelect: (routineId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}
```

**4. RoutineSourceStep (`src/components/SetupWizard/RoutineSourceStep.tsx`)**

Two-option selection:
- "Create New Routines" - always available
- "Use Existing Routines" - disabled if no routines

```tsx
interface RoutineSourceStepProps {
  hasRoutines: boolean;
  isLoading: boolean;
  onSelect: (mode: RoutineSourceMode) => void;
}
```

**5. RoutineAssignmentStep (`src/components/SetupWizard/RoutineAssignmentStep.tsx`)**

Four slots with routine selectors:
- A1, B1, A2, B2 each with dropdown/modal
- Warning for duplicate selections
- "Next" enabled when at least one assigned

**6. ImportReviewStep (`src/components/SetupWizard/ImportReviewStep.tsx`)**

Review extracted exercises:
- Table/list of all exercises with slot, weight, stage
- Editable fields for weight and stage override
- Warnings highlighted at top
- Stage selector for 'manual' confidence items

**7. NextWorkoutStep (`src/components/SetupWizard/NextWorkoutStep.tsx`)**

Simple four-button selection:
- A1, B1, A2, B2 buttons
- Selected state highlighted
- Default to A1

### Phase 3: Wizard Integration

**8. Update SetupWizard (`src/components/SetupWizard/index.tsx`)**

Add new steps to wizard flow:
```typescript
type SetupStep =
  | 'api-key'
  | 'routine-source'  // NEW
  | 'routine-assign'  // NEW (import path only)
  | 'import-review'   // NEW (import path only)
  | 'exercises'       // Existing (create path only)
  | 'weights'         // Existing (create path only)
  | 'next-workout'    // NEW
  | 'complete';
```

Flow branching:
- `routine-source` → `'create'` → `exercises` → `weights` → `next-workout`
- `routine-source` → `'import'` → `routine-assign` → `import-review` → `next-workout`

**9. useRoutineImport Hook (`src/hooks/useRoutineImport.ts`)**

Manages import workflow state:
```typescript
interface UseRoutineImportReturn {
  // Loading
  isLoadingRoutines: boolean;
  loadError: string | null;

  // Available routines
  availableRoutines: AvailableRoutine[];

  // Assignment
  assignment: RoutineAssignment;
  setAssignment: (day: GZCLPDay, routineId: string | null) => void;

  // Extraction
  importResult: ImportResult | null;
  isExtracting: boolean;
  extract: () => Promise<void>;

  // User edits
  updateExercise: (slot: GZCLPSlot, updates: Partial<ImportedExercise>) => void;

  // Commit
  commit: () => void;
}
```

## Testing Strategy

### Unit Tests (must pass before integration)

| Module | Test File | Coverage Focus |
|--------|-----------|----------------|
| Stage detector | `stage-detector.test.ts` | All T1/T2 patterns, AMRAP, edge cases |
| Routine importer | `routine-importer.test.ts` | Slot mapping, weight extraction, warnings |

### Integration Tests

| Flow | Test File | Coverage Focus |
|------|-----------|----------------|
| Create path | `setup-wizard-create.test.tsx` | Existing flow still works |
| Import path | `setup-wizard-import.test.tsx` | Full import flow |

### Manual Testing Checklist

- [ ] No routines → only "Create New" available
- [ ] Import with all 4 routines assigned
- [ ] Import with partial assignment (1-3 routines)
- [ ] Duplicate routine warning appears
- [ ] Stage detection for standard schemes (5x3, 6x2, 10x1, 3x10, 3x8, 3x6)
- [ ] Manual stage selection for non-standard schemes
- [ ] Weight editing in review step
- [ ] Next workout selection persists
- [ ] Mobile UX with 50+ routines (search/filter)

## File Checklist

New files to create:
- [ ] `src/lib/stage-detector.ts`
- [ ] `src/lib/routine-importer.ts`
- [ ] `src/components/common/RoutineSelector.tsx`
- [ ] `src/components/SetupWizard/RoutineSourceStep.tsx`
- [ ] `src/components/SetupWizard/RoutineAssignmentStep.tsx`
- [ ] `src/components/SetupWizard/ImportReviewStep.tsx`
- [ ] `src/components/SetupWizard/NextWorkoutStep.tsx`
- [ ] `src/hooks/useRoutineImport.ts`
- [ ] `tests/unit/stage-detector.test.ts`
- [ ] `tests/unit/routine-importer.test.ts`
- [ ] `tests/integration/setup-wizard-import.test.tsx`

Files to modify:
- [ ] `src/components/SetupWizard/index.tsx` - Add new steps
- [ ] `src/lib/constants.ts` - Add slot mapping constants

## Common Pitfalls

1. **Forgetting to filter warmup sets**: Always filter `type === 'normal'` before stage detection
2. **Weight unit confusion**: Hevy returns `weight_kg`, convert based on user settings only for display
3. **Stage numbering**: Internal 0/1/2, display as "Stage 1/2/3"
4. **AMRAP detection**: Use modal reps, not exact match
5. **Null weights**: Treat null as 0 (bodyweight exercise)

## Dependencies

No new npm packages required. Uses existing:
- React 18 (state, hooks)
- Tailwind CSS (styling)
- Existing Hevy client (`src/lib/hevy-client.ts`)
