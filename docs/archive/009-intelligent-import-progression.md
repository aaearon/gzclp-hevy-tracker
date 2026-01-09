# Feature 009: Intelligent Import Progression Analysis

## Status: ✅ Implemented

**Implementation Date**: January 8, 2026

**Implementation Summary**:
This feature has been fully implemented and tested. All planned functionality is working as designed.

### Files Created
- `src/lib/import-analysis.ts` - Core analysis logic (176 lines)
- `src/types/import.ts` - TypeScript type definitions (63 lines)
- `src/components/SetupWizard/ExerciseAnalysisCard.tsx` - Exercise card UI component (305 lines)
- `src/components/SetupWizard/ImportExplanationBanner.tsx` - Explanation banner component (110 lines)
- `tests/unit/import-analysis.test.ts` - Comprehensive unit tests (28,026 bytes)
- `docs/features/009-intelligent-import-progression-user-guide.md` - User documentation

### Files Modified
- `src/lib/routine-importer.ts` - Integrated analysis into import flow
- `src/components/SetupWizard/ImportReviewStep.tsx` - Integrated UI components
- `src/components/SetupWizard/DayReviewPanel.tsx` - Uses ExerciseAnalysisCard
- `src/components/SetupWizard/index.tsx` - Uses suggested weights on completion, saves lastWorkoutId
- `src/hooks/useProgression.ts` - Filters out already-processed workouts to prevent false discrepancies
- `src/types/state.ts` - Extended ImportedExercise interface
- `tests/unit/routine-importer.test.ts` - Added analysis verification tests

### Key Implementation Details

**Core Analysis Engine** (`import-analysis.ts`):
- `findMostRecentWorkoutForExercise()` - Locates relevant workout data from Hevy history
- `analyzeExercisePerformance()` - Extracts reps, weight, and metadata from workout sets
- `calculateImportProgression()` - Applies GZCLP rules to determine next target
- `analyzeExerciseForImport()` - Main entry point combining all analysis steps

**UI Components**:
- Color-coded cards (green=progress, blue=repeat, amber=stage change, red=deload, gray=no data)
- Editable weight inputs with automatic rounding
- Stage dropdown for exercises requiring stage changes
- Collapsible explanation banner with routine-to-workout mapping
- Accessible ARIA labels and keyboard navigation

**Progression Logic**:
- Leverages existing `calculateProgression()` from `progression.ts`
- Supports all T1/T2/T3 tier rules and stage progressions
- Handles missing workout data gracefully (falls back to template values)
- Preserves user overrides through wizard flow

**Testing Coverage**:
- 28KB of unit tests covering all analysis functions
- Edge cases: missing data, null reps, mixed success/failure
- Integration tests for complete import flow
- All tier-specific progression rules verified

### Deviations from Original Plan

**Minor Changes**:
1. Combined Task 1 and Task 4 (type definitions) as planned
2. ImportExplanationBanner made simpler - removed "Learn more" link (not needed)
3. Integration tests merged with existing import test suite instead of separate file
4. Task 11 (Documentation) split into user guide (new) and status update (this section)

**No Breaking Changes**:
- All existing import functionality preserved
- Backward compatible with imports that don't have analysis data
- User overrides still work exactly as before

### User-Facing Changes

**Before**: Import showed only detected weights from last workout, requiring manual calculation of next targets

**After**: Import now shows:
- What you lifted in your last workout
- Whether that workout was a success or failure
- What you should lift next according to GZCLP rules
- Clear reasoning for each suggestion
- Visual color coding for quick scanning

Users can still override any suggestion before completing setup.

---

## Overview

When importing from Hevy, the wizard currently stores "last lifted" weights without analyzing workout success/failure. This creates confusion: users see weights they've already completed, not what they should lift next.

This feature adds intelligent progression analysis during import, showing users:
1. **Where data came from** (which workout, when)
2. **What was detected** (weight lifted, reps achieved)
3. **What the app suggests** (progress, repeat, stage change, or deload)
4. **Why** (success/failure based on GZCLP rules)

## User Experience Flow

```
Import Review Step (Enhanced)
┌─────────────────────────────────────────────────────────────────┐
│  Review Imported Exercises                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Data pulled from your most recent workouts for each     │   │
│  │ routine. Progression calculated based on GZCLP rules.   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [A1] [B1] [A2] [B2]                                           │
│                                                                 │
│  ── T1: Squat (5x3+) ──────────────────────────────────────    │
│  │ Last workout: Jan 5, 2026                               │   │
│  │ Lifted: 100kg × 5 sets (3, 3, 3, 3, 5 reps)            │   │
│  │ Result: SUCCESS - Hit all sets, AMRAP: 5 reps          │   │
│  │                                                         │   │
│  │ ┌─────────────────────────────────────────────────┐    │   │
│  │ │  Next Target: [102.5] kg  ← +2.5kg progression  │    │   │
│  │ └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────    │
│                                                                 │
│  ── T2: Overhead Press (3x10) ─────────────────────────────    │
│  │ Last workout: Jan 5, 2026                               │   │
│  │ Lifted: 40kg × 3 sets (10, 10, 7 reps)                 │   │
│  │ Result: FAIL - Set 3 only hit 7/10 reps                │   │
│  │                                                         │   │
│  │ ┌─────────────────────────────────────────────────┐    │   │
│  │ │  Next Target: [40] kg  ← Stage change to 3x8    │    │   │
│  │ │  New scheme: 3x8 (was 3x10)                     │    │   │
│  │ └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────    │
│                                                                 │
│  ── T3: Lat Pulldown (3x15+) ──────────────────────────────    │
│  │ Last workout: Jan 5, 2026                               │   │
│  │ Lifted: 45kg × 3 sets (15, 15, 22 reps AMRAP)          │   │
│  │ Result: FAIL - AMRAP only 22 reps (need 25+)           │   │
│  │                                                         │   │
│  │ ┌─────────────────────────────────────────────────┐    │   │
│  │ │  Next Target: [45] kg  ← Repeat weight          │    │   │
│  │ └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────    │
│                                                                 │
│                                        [Back]  [Continue]       │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Context

### Existing Code to Leverage

| File | Function | Purpose |
|------|----------|---------|
| `workout-analysis.ts` | `extractRepsFromSets()` | Extract rep array from workout sets |
| `workout-analysis.ts` | `extractWorkingWeight()` | Get weight from first normal set |
| `progression.ts` | `calculateProgression()` | T1/T2/T3 progression logic |
| `progression.ts` | `T1_SUCCESS_REPS`, `T2_SUCCESS_REPS` | Success thresholds per stage |
| `routine-importer.ts` | `resolveWeightsFromWorkoutHistory()` | Already fetches recent workouts |

### Data Available During Import

```typescript
// Workout data includes:
workout.exercises[].sets[] = {
  type: 'warmup' | 'normal' | 'failure' | 'dropset',
  weight_kg: number | null,
  reps: number | null,
}

// We can extract:
- Actual reps per set (filtering normal sets only)
- Working weight
- Workout date
- Full performance data for progression calculation
```

### The Gap

`resolveWeightsFromWorkoutHistory()` extracts weights but discards rep data. We need to:
1. Preserve rep data during import
2. Run progression calculation on that data
3. Display analysis results in UI
4. Store progressed weights (not historical) on completion

---

## Implementation Tasks

### Task 1: Create Import Progression Analysis Types

**File:** `src/types/import.ts` (new file)

**Description:** Define TypeScript interfaces for workout analysis results during import. These types capture what was detected from Hevy, the progression calculation result, and what the user can override.

**Implementation:**

```typescript
import { Stage, ChangeType } from './progression'
import { Tier } from './program'

export interface WorkoutPerformance {
  workoutId: string
  workoutDate: string          // ISO 8601
  weight: number               // Actual weight lifted
  reps: number[]               // Reps per set (normal sets only)
  totalSets: number            // Number of normal sets
}

export interface ProgressionSuggestion {
  type: ChangeType             // 'progress' | 'stage_change' | 'deload' | 'repeat'
  suggestedWeight: number      // Calculated next weight
  suggestedStage: Stage        // Calculated next stage
  newScheme: string            // e.g., "5x3+" or "3x8"
  reason: string               // Human-readable explanation
  success: boolean             // Whether the workout was successful
  amrapReps?: number           // AMRAP performance if applicable
}

export interface ImportAnalysis {
  performance: WorkoutPerformance | null  // null if no workout found
  suggestion: ProgressionSuggestion | null
  hasWorkoutData: boolean
}

// Extend existing ImportedExercise
export interface ImportedExerciseWithAnalysis {
  // Existing fields from ImportedExercise
  templateId: string
  name: string
  detectedWeight: number
  detectedStage: Stage
  userWeight?: number
  userStage?: Stage

  // New analysis fields
  analysis: ImportAnalysis
}
```

**Acceptance Criteria:**
- [ ] Types compile without errors
- [ ] Types are exported and importable from `@/types/import`
- [ ] `WorkoutPerformance` captures all data needed from Hevy workout
- [ ] `ProgressionSuggestion` mirrors `ProgressionResult` from progression.ts
- [ ] `ImportAnalysis` handles case where no workout data exists

---

### Task 2: Create Import Analysis Function

**File:** `src/lib/import-analysis.ts` (new file)

**Description:** Create a function that analyzes workout performance and calculates progression suggestions for a single exercise during import.

**Implementation:**

```typescript
import { Workout, WorkoutExercise } from '@/types/hevy-api'
import { Stage, Tier } from '@/types/progression'
import { WeightUnit, MuscleGroupCategory } from '@/types/program'
import { ImportAnalysis, WorkoutPerformance, ProgressionSuggestion } from '@/types/import'
import { extractRepsFromSets, extractWorkingWeight } from './workout-analysis'
import { calculateProgression, ProgressionState } from './progression'

/**
 * Find the most recent workout containing a specific exercise
 */
export function findMostRecentWorkoutForExercise(
  workouts: Workout[],
  routineId: string,
  exerciseTemplateId: string
): { workout: Workout; exercise: WorkoutExercise } | null

/**
 * Analyze a single exercise's performance from workout history
 */
export function analyzeExercisePerformance(
  workoutExercise: WorkoutExercise,
  workout: Workout
): WorkoutPerformance

/**
 * Calculate progression suggestion based on performance
 */
export function calculateImportProgression(
  performance: WorkoutPerformance,
  currentStage: Stage,
  tier: Tier,
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ProgressionSuggestion

/**
 * Main entry point: analyze exercise and get progression suggestion
 */
export function analyzeExerciseForImport(
  workouts: Workout[],
  routineId: string,
  exerciseTemplateId: string,
  detectedStage: Stage,
  tier: Tier,
  muscleGroup: MuscleGroupCategory,
  unit: WeightUnit
): ImportAnalysis
```

**Key Logic:**
- Use existing `extractRepsFromSets()` to get rep array
- Use existing `extractWorkingWeight()` for weight
- Build a temporary `ProgressionState` from detected values
- Call existing `calculateProgression()` with extracted reps
- Map result to `ProgressionSuggestion`

**Acceptance Criteria:**
- [ ] Unit tests pass for `findMostRecentWorkoutForExercise()`
- [ ] Unit tests pass for `analyzeExercisePerformance()`
- [ ] Unit tests pass for `calculateImportProgression()`
- [ ] Unit tests cover all progression outcomes: progress, stage_change, deload, repeat
- [ ] Unit tests cover case where no workout data exists (returns null analysis)
- [ ] Unit tests cover T1, T2, and T3 tier logic differences
- [ ] Function correctly identifies AMRAP sets for T1/T3
- [ ] Function uses correct success thresholds per tier and stage

---

### Task 3: Integrate Analysis into Routine Importer

**File:** `src/lib/routine-importer.ts`

**Description:** Modify `resolveWeightsFromWorkoutHistory()` to also run progression analysis and attach results to imported exercises.

**Changes Required:**

1. Update `ImportedExercise` interface to include `analysis: ImportAnalysis`
2. After extracting weight from workout, also extract reps and run analysis
3. Attach `ImportAnalysis` to each exercise in the result

**Modified Function Signature:**
```typescript
export async function resolveWeightsFromWorkoutHistory(
  baseResult: ImportResult,
  assignment: RoutineAssignment,
  workouts: Workout[],
  unit: WeightUnit  // NEW: needed for progression calculation
): Promise<ImportResult>
```

**Implementation Notes:**
- For each exercise, after getting weight via `extractWorkingWeight()`:
  1. Also call `extractRepsFromSets()` on the same workout exercise
  2. Call `analyzeExerciseForImport()` with the data
  3. Attach result to `ImportedExercise.analysis`
- Handle missing workout data gracefully (set `analysis.hasWorkoutData = false`)

**Acceptance Criteria:**
- [ ] Existing tests for `resolveWeightsFromWorkoutHistory()` still pass
- [ ] New tests verify analysis data is attached to T1 exercises
- [ ] New tests verify analysis data is attached to T2 exercises
- [ ] New tests verify analysis data is attached to T3 exercises
- [ ] Analysis includes correct workout date and ID
- [ ] Analysis includes correct rep array from workout
- [ ] Progression suggestion matches expected GZCLP rules
- [ ] Exercises without workout history have `analysis.hasWorkoutData = false`

---

### Task 4: Update Import Types and State

**File:** `src/types/routine-import.ts`

**Description:** Update the `ImportedExercise` interface and related types to include analysis data.

**Changes:**
```typescript
export interface ImportedExercise {
  // Existing fields...
  templateId: string
  name: string
  detectedWeight: number
  detectedStage: Stage
  userWeight?: number
  userStage?: Stage

  // New field
  analysis: ImportAnalysis
}
```

**File:** `src/hooks/useRoutineImport.ts`

**Description:** Update the hook to pass weight unit through to the importer.

**Acceptance Criteria:**
- [ ] `ImportedExercise` type includes `analysis` field
- [ ] Type changes don't break existing code (may require adding default/null values)
- [ ] `useRoutineImport` passes unit configuration to importer

---

### Task 5: Create Exercise Analysis Display Component

**File:** `src/components/SetupWizard/ExerciseAnalysisCard.tsx` (new file)

**Description:** Create a reusable component that displays workout analysis for a single exercise during import review.

**Props Interface:**
```typescript
interface ExerciseAnalysisCardProps {
  exercise: ImportedExercise
  tier: Tier
  onWeightChange: (weight: number) => void
  onStageChange: (stage: Stage) => void
  unit: WeightUnit
}
```

**UI Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Exercise Name (Scheme)                                      │
├─────────────────────────────────────────────────────────────┤
│ Source: [Workout date] or [No workout data - using routine] │
│                                                             │
│ [If has workout data:]                                      │
│ Lifted: XXkg × N sets (rep, rep, rep, ...)                 │
│ Result: SUCCESS/FAIL - [reason]                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ Next Target: [input] kg  ← [progression explanation] │    │
│ │ [If stage change:] New scheme: 3x8 (was 3x10)       │    │
│ └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Visual States:**
- **Success (progress):** Green accent, upward arrow indicator
- **Success (repeat at same weight):** Blue accent, checkmark
- **Fail (stage change):** Yellow/amber accent, stage indicator
- **Fail (deload):** Red accent, downward arrow
- **No data:** Gray/muted, informational message

**Acceptance Criteria:**
- [ ] Component renders correctly for T1 exercises with workout data
- [ ] Component renders correctly for T2 exercises with workout data
- [ ] Component renders correctly for T3 exercises with workout data
- [ ] Component handles missing workout data gracefully
- [ ] Weight input is editable and calls `onWeightChange`
- [ ] Stage dropdown (if shown) calls `onStageChange`
- [ ] Visual styling distinguishes success/fail/deload states
- [ ] Workout date is displayed in user-friendly format
- [ ] Rep breakdown is shown clearly (e.g., "3, 3, 3, 3, 5 reps")
- [ ] Progression explanation is clear and actionable

---

### Task 6: Create Import Explanation Banner

**File:** `src/components/SetupWizard/ImportExplanationBanner.tsx` (new file)

**Description:** Create a banner component explaining where data comes from and how progression works.

**Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│ How Import Works                                                │
│                                                                 │
│ We pulled data from your most recent workout for each routine:  │
│ • Weights and reps from what you actually lifted               │
│ • Analyzed success/failure based on GZCLP rules                │
│ • Calculated your next target weights                          │
│                                                                 │
│ Review the suggestions below and adjust if needed.             │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Collapsible (remembers state)
- Shows which routines mapped to which workout dates
- Optional "Learn more" link to GZCLP documentation

**Acceptance Criteria:**
- [ ] Banner renders with clear explanation text
- [ ] Banner is collapsible
- [ ] Collapse state persists during wizard session
- [ ] Shows routine-to-workout mapping summary
- [ ] Styling matches app design system

---

### Task 7: Update ImportReviewStep with Analysis UI

**File:** `src/components/SetupWizard/ImportReviewStep.tsx`

**Description:** Replace current simple weight inputs with the new `ExerciseAnalysisCard` components and add the explanation banner.

**Changes:**
1. Add `ImportExplanationBanner` at top of review section
2. Replace `TierCard` usage with `ExerciseAnalysisCard` for T1/T2
3. Replace T3 list items with `ExerciseAnalysisCard` components
4. Update callbacks to handle both weight and stage changes
5. Show summary of detected progressions per day

**Updated Structure:**
```
ImportReviewStep
├── ImportExplanationBanner
├── DayTabBar
└── DayReviewPanel (updated)
    ├── T1 Section
    │   └── ExerciseAnalysisCard
    ├── T2 Section
    │   └── ExerciseAnalysisCard
    └── T3 Section
        └── ExerciseAnalysisCard[] (for each T3)
```

**Acceptance Criteria:**
- [ ] Explanation banner appears above day tabs
- [ ] T1 exercises show full analysis with progression suggestion
- [ ] T2 exercises show full analysis with progression suggestion
- [ ] T3 exercises show full analysis with progression suggestion
- [ ] User can override suggested weights
- [ ] User can override suggested stages (where applicable)
- [ ] Tab switching preserves user overrides
- [ ] All existing validation still works
- [ ] Continue button remains disabled until valid configuration

---

### Task 8: Update Import Completion to Use Suggested Weights

**File:** `src/components/SetupWizard/index.tsx`

**Description:** Modify `handleNextWorkoutComplete` to save the suggested/progressed weights instead of the raw detected weights.

**Current Behavior:**
```typescript
// Saves detectedWeight (what was lifted)
currentWeight: exercise.userWeight ?? exercise.detectedWeight
```

**New Behavior:**
```typescript
// Saves suggested weight (next target) unless user overrode
currentWeight: exercise.userWeight ?? exercise.analysis.suggestion?.suggestedWeight ?? exercise.detectedWeight
```

**Also update:**
- Stage should use `analysis.suggestion?.suggestedStage` as default
- Handle case where no analysis exists (fallback to detected values)

**Acceptance Criteria:**
- [ ] Successful exercises save progressed weight (not last lifted)
- [ ] Failed exercises save appropriate weight based on progression rules
- [ ] Stage changes are saved correctly
- [ ] User overrides take precedence over suggestions
- [ ] Exercises without analysis data use detected values (backward compatible)
- [ ] All progression entries have correct initial state

---

### Task 9: Add Unit Tests for Import Analysis

**File:** `tests/unit/import-analysis.test.ts` (new file)

**Description:** Comprehensive unit tests for the import analysis logic.

**Test Cases:**

```typescript
describe('findMostRecentWorkoutForExercise', () => {
  it('finds workout matching routine ID and exercise template')
  it('returns most recent when multiple workouts exist')
  it('returns null when no matching workout found')
  it('ignores workouts from different routines')
})

describe('analyzeExercisePerformance', () => {
  it('extracts correct reps from normal sets only')
  it('extracts correct working weight')
  it('includes workout date and ID')
  it('handles sets with null reps as 0')
})

describe('calculateImportProgression', () => {
  describe('T1 progression', () => {
    it('suggests +2.5kg for lower body success at stage 0')
    it('suggests +1.25kg for upper body success at stage 0')
    it('suggests stage change on failure at stage 0')
    it('suggests stage change on failure at stage 1')
    it('suggests deload on failure at stage 2')
    it('tracks AMRAP reps correctly')
  })

  describe('T2 progression', () => {
    it('suggests weight increase on success')
    it('suggests stage change on failure')
    it('suggests deload at stage 2 failure')
  })

  describe('T3 progression', () => {
    it('suggests +2.5kg when AMRAP >= 25')
    it('suggests repeat when AMRAP < 25')
    it('never suggests deload')
  })
})

describe('analyzeExerciseForImport', () => {
  it('returns complete analysis for exercise with workout data')
  it('returns hasWorkoutData=false when no workout found')
  it('integrates performance and progression correctly')
})
```

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Tests cover edge cases (empty reps, null values, missing data)
- [ ] Tests verify integration with existing progression logic
- [ ] Tests use realistic workout data fixtures

---

### Task 10: Add Integration Tests for Import Flow

**File:** `tests/integration/import-wizard-progression.test.tsx` (new file)

**Description:** Integration tests verifying the complete import flow with progression analysis.

**Test Scenarios:**

```typescript
describe('Import Wizard with Progression Analysis', () => {
  it('shows progression suggestions for exercises with workout data')
  it('shows appropriate message for exercises without workout data')
  it('allows user to override suggested weights')
  it('allows user to override suggested stages')
  it('saves progressed weights on completion')
  it('saves user overrides on completion')
  it('handles mixed success/failure across exercises')
  it('displays correct visual states for each progression type')
})
```

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Tests cover user interaction flows
- [ ] Tests verify final saved state matches expectations
- [ ] Tests use mock Hevy API responses

---

### Task 11: Update Documentation

**File:** `docs/features/009-intelligent-import-progression.md`

**Description:** Create user-facing documentation explaining the import progression feature.

**Content:**
1. What the feature does
2. How to interpret the analysis display
3. When to override suggestions
4. GZCLP progression rules reference
5. Troubleshooting common scenarios

**Acceptance Criteria:**
- [ ] Documentation explains feature clearly
- [ ] Screenshots/diagrams show UI
- [ ] Progression rules are accurately described
- [ ] Common questions are addressed

---

## Task Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 0: Task 1 + Task 4 (All Types)                               │
└─────────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ Task 2        │       │ Task 5        │
│ (Analysis)    │       │ (Card UI)     │
└───────┬───────┘       ├───────────────┤
        │               │ Task 6        │
        │               │ (Banner UI)   │
        │               └───────┬───────┘
        ▼                       │
┌───────────────┐               │
│ Task 3        │               │
│ (Importer)    │◄──────────────┘
├───────────────┤
│ Task 9        │
│ (Unit Tests)  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Task 7        │
│ (ReviewStep)  │
├───────────────┤
│ Task 8        │
│ (Completion)  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Task 10       │
│ (Integration) │
├───────────────┤
│ Task 11       │
│ (Docs)        │
└───────────────┘
```

## Parallelization Strategy

**Phase 0 (Foundation - Sequential):**
- Task 1 + Task 4: All Type Definitions (merged)
  - Create `src/types/import.ts` with analysis types
  - Update `ImportedExercise` interface in `src/types/routine-import.ts`
  - This unblocks both UI and Logic tracks

**Phase 1 (Parallel after Phase 0):**
- Track A (Logic): Task 2 - Analysis Function
- Track B (UI): Task 5 - Card Component + Task 6 - Banner Component

**Phase 2 (Sequential after Phase 1):**
- Task 3: Importer Integration (needs Task 2)
- Task 9: Unit Tests (needs Task 2)

**Phase 3 (Sequential after Phase 2):**
- Task 7: ImportReviewStep (needs Tasks 3, 5, 6)
- Task 8: Completion Logic (needs Task 3)

**Phase 4 (After Phase 3):**
- Task 10: Integration Tests
- Task 11: Documentation

---

## Testing Strategy

### Unit Tests
- All functions in `import-analysis.ts`
- Progression calculation edge cases
- Type validation

### Component Tests
- `ExerciseAnalysisCard` rendering states
- `ImportExplanationBanner` collapse behavior
- User interaction (weight/stage changes)

### Integration Tests
- Full import flow with mock Hevy data
- State persistence through wizard steps
- Final saved configuration verification

### Manual Testing Checklist
- [ ] Import routines with recent workout data
- [ ] Import routines without workout data
- [ ] Verify T1 progression suggestions
- [ ] Verify T2 progression suggestions
- [ ] Verify T3 progression suggestions
- [ ] Override suggested weights
- [ ] Complete import and verify saved state
- [ ] Start workout and confirm correct targets shown

---

## Risk Considerations

1. **Performance:** Analyzing multiple workouts could be slow
   - Mitigation: Analysis runs once during import, results cached

2. **Edge Cases:** Missing/malformed workout data
   - Mitigation: Graceful fallback to detected values

3. **User Confusion:** Too much information displayed
   - Mitigation: Collapsible sections, clear visual hierarchy

4. **Backward Compatibility:** Existing imports without analysis
   - Mitigation: Null checks, fallback to current behavior

5. **False Discrepancies After Import:** Syncing immediately after import could show discrepancies
   - Mitigation: Import saves `lastWorkoutId` from analyzed workout; sync filters out already-processed workouts
