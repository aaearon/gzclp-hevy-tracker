# Feature 007: Progression Visualization Charts

## Summary

Add interactive progression graphs showing historical workout data and GZCLP-aware future predictions, with clear visual distinction between actual vs estimated progression.

## User Requirements

- **Data Source**: Local storage (store progression history locally)
- **Time Granularity**: Both week-by-week AND workout-by-workout with toggle
- **Exercise Scope**: All exercises (main lifts + T3 accessories)
- **Prediction Model**: GZCLP-aware (factors in deloads, stage changes)

---

## Technical Design

### Charting Library: Chart.js with react-chartjs-2

```bash
npm install chart.js react-chartjs-2
```

**Rationale**: Native `segment` styling for dashed/solid line mixing (historical vs predicted), smaller bundle (~65KB vs 600KB Recharts), canvas-based performance on mobile.

### New Types (extend `/src/types/state.ts`)

```typescript
/** History entry per workout */
export interface ProgressionHistoryEntry {
  date: string              // ISO date
  workoutId: string         // Hevy workout ID
  weight: number            // kg
  stage: Stage              // 0 | 1 | 2
  tier: Tier
  success: boolean
  amrapReps?: number
  changeType: ChangeType
}

/** Per-exercise history container */
export interface ExerciseHistory {
  progressionKey: string    // "squat-T1" or exerciseId
  exerciseName: string
  tier: Tier
  role?: ExerciseRole
  entries: ProgressionHistoryEntry[]
}

/** Prediction data point */
export interface PredictionDataPoint {
  date: string
  workoutNumber: number
  weight: number
  stage: Stage
  confidence: number        // 0-1
  isDeload: boolean
  isStageChange: boolean
}

/** Extend GZCLPState */
export interface GZCLPState {
  // ... existing fields ...
  progressionHistory: Record<string, ExerciseHistory>
}
```

### GZCLP-Aware Prediction Algorithm

Core logic in `/src/lib/prediction.ts`:

1. **Calculate historical metrics**: failure rate, avg workouts per stage, deload frequency
2. **Simulate forward workouts** using GZCLP rules:
   - T1/T2: Weight increase on success, stage change on fail, 85% deload at stage 2 fail
   - T3: Linear progression, repeat on fail (no deload)
3. **Decay confidence** as horizon extends (~2% per workout)
4. **Mark predicted deloads/stage changes** for visual annotation

Default values (no history): 8-12 workouts per weight before stage change.

### Visual Design

| Element | Historical | Predicted |
|---------|-----------|-----------|
| Line | Solid, tier color | Dashed, 50% opacity |
| Deload | Red dot marker | Red circle (unfilled) |
| Stage change | Yellow dot | Yellow circle |
| PR | Green star | N/A |

**Tier colors**: T1=red-500, T2=blue-500, T3=green-500

---

## File Structure

```
src/
├── components/
│   └── ProgressionChart/
│       ├── index.tsx                 # Container with state
│       ├── ProgressionChart.tsx      # Chart.js Line component
│       ├── ExerciseSelector.tsx      # Dropdown by tier
│       ├── GranularityToggle.tsx     # Week/Workout toggle
│       └── ChartLegend.tsx           # Actual vs Predicted legend
├── hooks/
│   ├── useProgressionHistory.ts      # Fetch history from state
│   ├── useChartData.ts               # Transform + aggregate
│   └── usePrediction.ts              # Prediction hook
├── lib/
│   ├── prediction.ts                 # Core prediction algorithm
│   └── history-recorder.ts           # Records after sync
└── types/
    └── state.ts                      # Extended with history types

tests/
├── unit/
│   ├── prediction.test.ts
│   ├── history-recorder.test.ts
│   └── chart-utils.test.ts
└── integration/
    └── progression-chart.test.tsx
```

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `/src/types/state.ts` | Add history types, extend GZCLPState |
| `/src/lib/constants.ts` | Bump `CURRENT_STATE_VERSION` to `2.1.0` |
| `/src/lib/migrations.ts` | Add v2.1.0 migration (adds `progressionHistory: {}`) |
| `/src/hooks/useProgram.ts` | Add `setProgressionHistory` method |
| `/src/hooks/useProgression.ts` | Integrate history recording after sync |
| `/src/components/Dashboard/index.tsx` | Add ProgressionChart section |
| `package.json` | Add chart.js, react-chartjs-2 |

---

## Task Breakdown

### Phase 1: Foundation - COMPLETED
- [x] T001: Install Chart.js dependencies
- [x] T002: Add history types to state.ts (ProgressionHistoryEntry, ExerciseHistory, PredictionDataPoint, ChartDataPoint)
- [x] T003: Create v2.1.0 migration + bump version
- [x] T004: Write migration unit tests (10 tests)

### Phase 2: History Recording - COMPLETED
- [x] T005: Create `/src/lib/history-recorder.ts`
- [x] T006: Write history-recorder unit tests (12 tests)
- [x] T007: Integrate into sync flow (usePendingChanges.ts - onRecordHistory callback)
- [x] T008: Add `setProgressionHistory` and `recordHistoryEntry` to useProgram hook

### Phase 3: Prediction Algorithm - COMPLETED
- [x] T009: Create `/src/lib/prediction.ts` with GZCLP-aware algorithm
- [x] T010: Write prediction unit tests (20 tests - success, stage change, deload, T3)
- [x] T011: Create `usePrediction` hook
- [x] T012: Create `useChartData` hook for data transformation

### Phase 4: Chart Components - COMPLETED
- [x] T013: Create GranularityToggle.tsx (workout/week toggle)
- [x] T014: Create ExerciseSelector.tsx (grouped by tier)
- [x] T015: Create ChartLegend.tsx (actual vs predicted)
- [x] T016: Create ProgressionChart.tsx with Chart.js Line chart
- [x] T017: Create container index.tsx with state management

### Phase 5: Dashboard Integration - IN PROGRESS
- [ ] T018: Add ProgressionChart to Dashboard
- [ ] T019: Mobile responsive styling
- [ ] T020: Integration tests

### Phase 6: Polish - PENDING
- [ ] T021: Loading/empty states (already implemented in container)
- [ ] T022: Event markers (deload, stage change - implemented)
- [ ] T023: Update CLAUDE.md documentation

## Implementation Progress

**Test Count:** 797 tests passing
**Files Created:**
- `src/types/state.ts` - Extended with history types
- `src/lib/history-recorder.ts` - Records history from pending changes
- `src/lib/prediction.ts` - GZCLP-aware prediction algorithm
- `src/lib/migrations.ts` - v2.1.0 migration
- `src/hooks/usePrediction.ts` - Prediction hook
- `src/hooks/useChartData.ts` - Chart data transformation hook
- `src/components/ProgressionChart/*` - All chart UI components
- `tests/unit/migrations.test.ts` - Migration tests
- `tests/unit/history-recorder.test.ts` - History recorder tests
- `tests/unit/prediction.test.ts` - Prediction algorithm tests

---

## Migration Strategy

**Non-breaking**: Existing users get empty `progressionHistory: {}`. History builds from next sync forward.

Optional future: Backfill from Hevy API re-fetch.

---

## Storage Estimate

~150 bytes per entry. 8 exercises x 100 workouts = ~120KB/year. Well under 5MB localStorage limit.
