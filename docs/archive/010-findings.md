# Findings & Decisions

## Requirements

### Feature: Custom T3 Progression Increments
- Allow users to set custom weight increments per T3 exercise
- Example use cases:
  - Cable machines at user's gym: 5kg increments only
  - Dumbbells at user's gym: 1kg increments
- UI entry points:
  1. During import (when importing T3 exercises)
  2. In Settings (for managing existing exercises)

### Bug Fix: Chart Weight Discrepancy
- Progression Charts showing incorrect weight for T3 exercise
- Example: "Seated Incline Curl (Barbell)" shows 14kg when actually lifted 15kg
- Root cause: history-recorder.ts uses `change.currentWeight` (stored progression weight) instead of actual workout weight

## Research Findings

### Current Increment System (src/lib/constants.ts)
```typescript
export const WEIGHT_INCREMENTS: Record<WeightUnit, { upper: number; lower: number }> = {
  kg: { upper: 2.5, lower: 5 },
  lbs: { upper: 5, lower: 10 },
}
```
- Global increments based on upper/lower body
- No per-exercise customization
- T3 exercises default to "upper" category (2.5kg/5lbs)

### Progression Calculation (src/lib/progression.ts)
```typescript
function getIncrementKg(muscleGroup: MuscleGroupCategory, unit: WeightUnit): number {
  const userIncrement = WEIGHT_INCREMENTS[unit][muscleGroup]
  return toKg(userIncrement, unit)
}
```
- Called by `calculateT3Progression()` for T3 weight increases
- Returns increment in kg for internal storage

### History Recording Bug (src/lib/history-recorder.ts:17-30)
```typescript
export function createHistoryEntryFromChange(change: PendingChange): ProgressionHistoryEntry {
  const entry: ProgressionHistoryEntry = {
    date: change.workoutDate,
    workoutId: change.workoutId,
    weight: change.currentWeight,  // BUG: Uses stored weight, not actual
    stage: change.currentStage,
    tier: change.tier,
    success: change.success ?? false,
    changeType: change.type,
  }
```
- **Bug**: `weight: change.currentWeight` uses the stored progression weight
- When user lifts different weight (discrepancy), chart shows wrong value
- **Fix**: Should use `change.discrepancy?.actualWeight ?? change.currentWeight`

### Data Model (src/types/state.ts)
```typescript
export interface ExerciseConfig {
  id: string
  hevyTemplateId: string
  name: string
  role?: ExerciseRole  // 'squat' | 'bench' | 'ohp' | 'deadlift' | 't3'
}
```
- No `customIncrement` field currently
- Need to add optional `customIncrement?: number` (in kg)

### UserSettings (src/types/state.ts)
```typescript
export interface UserSettings {
  weightUnit: WeightUnit
  increments: {
    upper: number
    lower: number
  }
  restTimers: { t1: number; t2: number; t3: number }
}
```
- Global increments only
- Could extend but per-exercise is more flexible

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Add `customIncrementKg?: number` to ExerciseConfig | Per-exercise flexibility; explicit kg naming prevents unit confusion |
| Store increment in kg internally | Consistent with all other weights; physical reality doesn't change with display unit |
| Fall back to global increment if not set | Backwards compatible with existing data |
| Fix history weight to use actual workout weight | Charts should reflect empirical reality for data continuity |
| Per-exercise over equipment presets | Gyms vary too much; per-exercise is most flexible |

## Gemini Code Review Feedback (2026-01-13)

**Confirmed:**
- Per-exercise granularity is correct (equipment presets add unnecessary complexity)
- Chart bug fix is correct (history = empirical reality, not program)
- Field naming: use `customIncrementKg` to be explicit about storage format

**Edge Case Note (Low Severity):**
- `roundWeightKg()` in progression.ts uses hardcoded 2.5kg rounding
- Custom increments < 2.5kg (e.g., 1kg micro-loading) work for progression
- But deloads may snap to 2.5kg grid (acceptable for now)

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Chart shows wrong weight | History entry uses `currentWeight` instead of actual weight |

## Resources
- `src/lib/progression.ts` - Progression calculation logic
- `src/lib/history-recorder.ts` - History entry creation
- `src/lib/constants.ts` - Global increment definitions
- `src/types/state.ts` - Type definitions
- `src/components/SetupWizard/` - Import wizard components

## Visual/Browser Findings
(No visual findings yet)

---
*Update this file after every 2 view/browser/search operations*
