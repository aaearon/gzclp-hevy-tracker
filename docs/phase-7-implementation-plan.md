# Phase 7: Import Review Step Rewrite

## Objective
Rewrite `ImportReviewStep.tsx` to use a tabbed interface with `DayTabBar` and `DayReviewPanel` components, replacing the flat table view.

## Files to Modify

| File | Action |
|------|--------|
| `tests/unit/import-review-step.test.tsx` | Rewrite tests for tabbed interface (TDD) |
| `src/components/SetupWizard/ImportReviewStep.tsx` | Complete rewrite with tabbed UI |

## Implementation Steps

### Step 1: Write Tests First (TDD)
Update `tests/unit/import-review-step.test.tsx`:

**New test cases required by spec:**
1. `renders DayTabBar with 4 day tabs`
2. `tab navigation switches displayed day content`
3. `validation requires all days to have T1/T2 confirmed`
4. `continue button disabled until all days validated`

### Step 2: Rewrite ImportReviewStep Component

**New Props Interface:**
```typescript
interface ImportReviewStepProps {
  importResult: ImportResult  // Uses byDay structure
  onDayExerciseUpdate: (day: GZCLPDay, position: 'T1' | 'T2', updates: Partial<ImportedExercise>) => void
  onDayT3Remove: (day: GZCLPDay, index: number) => void
  onNext: () => void
  onBack: () => void
  apiKey?: string
  unit?: WeightUnit  // For DayReviewPanel
}
```

**Component Structure:**
```
ImportReviewStep
├── API Error Alert (keep existing)
├── Warnings Section (keep existing)
├── MainLiftVerification (keep if mainLiftWeights provided)
├── DayTabBar (activeDay, validatedDays, onDayChange)
├── DayReviewPanel (for activeDay only)
└── Navigation Buttons (Back / Continue)
```

## Validation Logic

A day is "validated" when:
- `dayData.t1 !== null`
- `dayData.t2 !== null`

Continue button enabled when:
- All 4 days validated (T1 + T2 non-null)
- API is available
- Not currently checking API
