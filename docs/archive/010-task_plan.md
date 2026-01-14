# Task Plan: T3 Custom Progression & Chart Weight Bug Fix

## Goal
Implement custom weight increments for T3 exercises AND fix the chart bug where the incorrect weight (stored vs. actual) is displayed.

## Current Phase
Complete

## Phases

### Phase 1: Research & Discovery
- [x] Understand current T3 increment logic
- [x] Understand how chart data is recorded
- [x] Identify root cause of chart weight bug
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Design & Architecture
- [x] Design data model changes for per-exercise increments
- [x] Design UI for T3 increment configuration during import
- [x] Confirm chart bug fix approach
- [x] Get second opinion from Gemini
- **Status:** complete

### Phase 3: Implementation - Bug Fix
- [x] Fix history-recorder.ts to use actual workout weight
- [x] Add tests for the fix
- [x] Verify chart displays correct weights
- **Status:** complete

### Phase 4: Implementation - Custom T3 Increments
- [x] Update ExerciseConfig type with `customIncrementKg`
- [x] Modify getIncrementKg() to accept custom override
- [x] Update callers in createPendingChangesFromAnalysis()
- [x] Add UI in Import wizard for T3 increments
- [x] Add UI in Settings for T3 increment management
- **Status:** complete

### Phase 5: Testing & Documentation
- [x] Write unit tests for custom increment logic (26 tests)
- [x] Write history recorder tests (12 tests)
- [x] Update ARCHITECTURE.md (v2.5.0)
- **Status:** complete

## Key Questions
1. Should custom increments be per-exercise or have "presets" (cable: 5kg, dumbbell: 1kg)? **Answer: Per-exercise with optional presets**
2. Where should T3 increment UI appear? **Answer: During import wizard AND in Settings**
3. Should we support different increments for the same exercise? **Answer: Yes, per-exercise config**

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Store increment per-exercise in ExerciseConfig | Most flexible, allows cable=5kg, dumbbell=1kg without extra config |
| Use `discrepancy.actualWeight` for history entry | Bug fix - chart should show what user actually lifted |
| Add UI during ImportReviewStep | Natural place to configure T3 exercises |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | - | - |

## Notes
- All weights stored in kg internally
- T3 exercises use exerciseId as progressionKey
- History entries record `currentWeight` but should record actual workout weight when discrepancy exists
