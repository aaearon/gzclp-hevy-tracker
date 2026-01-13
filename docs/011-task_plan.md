# Task Plan: Phase 1 Quick Wins Implementation

**Status:** COMPLETE
**Created:** 2026-01-13
**Source:** docs/SIMPLIFICATION-PLAN.md Phase 1

---

## Goal

Implement Phase 1 "Quick Wins" from SIMPLIFICATION-PLAN.md: extract WeightDisplay and TierBadge components, reorder Dashboard sections, and add Settings tabs.

## Current Phase

Phase 1: Requirements & Discovery (complete)

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Task 1.1 - Extract WeightDisplay Component
- [x] Create `src/components/common/WeightDisplay.tsx`
- [x] Define props interface with size variants
- [x] Write unit tests first (TDD)
- [x] Replace usages in CurrentWorkout.tsx (6 instances)
- [x] Replace usages in MainLiftCard.tsx (2 instances)
- [x] Replace usages in ExerciseCard.tsx (1 instance)
- [x] Replace usages in T3Overview.tsx (1 instance)
- [x] Update component exports in index.ts
- [x] Run full test suite
- **Status:** complete

### Phase 3: Task 1.2 - Create TierBadge Component
- [x] Create `src/components/common/TierBadge.tsx`
- [x] Create `src/components/common/DayBadge.tsx`
- [x] Create `src/components/common/StageBadge.tsx`
- [x] Create shared color mapping utility
- [x] Write unit tests first (TDD)
- [x] Replace usages in CurrentWorkout.tsx
- [x] Replace usages in MainLiftCard.tsx
- [x] Replace usages in ExerciseCard.tsx
- [x] Replace usages in T3Overview.tsx
- [x] Replace usages in ReviewModal/index.tsx
- [x] Run full test suite
- **Status:** complete

### Phase 4: Task 1.3 - Reorder Dashboard Sections
- [x] Create condensed QuickStats variant for header
- [x] Modify DashboardHeader to include condensed stats
- [x] Update DashboardContent section order
- [x] Test responsive layout on mobile viewport
- [x] Run full test suite
- **Status:** complete

### Phase 5: Task 1.4 - Add Settings Tabs
- [x] Create `src/components/Settings/SettingsTabs.tsx`
- [x] Extract PreferencesTab component (theme, unit, increments)
- [x] Extract ExercisesTab component (exercise manager)
- [x] Extract DataTab component (export, import, reset)
- [x] Extract AboutTab component (version, links)
- [x] Implement tab navigation with keyboard support
- [x] Persist selected tab in URL hash
- [x] Write unit tests
- [x] Run full test suite
- **Status:** complete

### Phase 6: Documentation & Cleanup
- [x] Update ARCHITECTURE.md with new components
- [x] Review all changes
- [x] Final test run
- **Status:** complete

## Key Questions

1. **WeightDisplay size variants:** What sizes are needed?
   Answer: sm (for warmups), md (default), lg (for main displays)

2. **TierBadge color consistency:** Should colors be defined in one place?
   Answer: Yes, create shared `tierColors.ts` utility

3. **Settings tabs URL persistence:** Hash or localStorage?
   Answer: URL hash for shareability and history support

4. **Dashboard QuickStats condensation:** What stats to keep in header?
   Answer: Current day and workout count (2 most relevant)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use TDD approach | Per CLAUDE.md requirements |
| Create feature branch per task | Follow feature branch workflow |
| Use URL hash for tab persistence | Better UX (shareable, back button works) |
| Keep CollapsibleSection for Phase 2 | Already exists, focus mode is separate task |
| Size prop for WeightDisplay | Reduces need for multiple components |
| Remove scheme from WeightDisplay | Keep focused on weight only (Gemini review) |
| Separate Badge components | Type safety > polymorphism (Gemini review) |
| Use CSS hidden for Settings tabs | Prevent state loss on tab switch (Gemini review) |
| Keep Current Week in header | More actionable than Total Workouts (Gemini review) |

## Implementation Details

### Task 1.1: WeightDisplay Component

**Props Interface:**
```typescript
interface WeightDisplayProps {
  weight: number           // Weight in kg (internal format)
  unit: WeightUnit         // User's display preference
  size?: 'sm' | 'md' | 'lg' // Size variant (default: 'md')
  colorClass?: string      // Optional override for weight color
  showUnit?: boolean       // Whether to show unit suffix (default: true)
}
```

**Note:** Scheme removed per Gemini review - keep component focused on weight formatting only.

**Files to create:**
- `src/components/common/WeightDisplay.tsx`
- `tests/unit/WeightDisplay.test.tsx`

**Files to modify:**
- `src/components/Dashboard/CurrentWorkout.tsx`
- `src/components/Dashboard/MainLiftCard.tsx`
- `src/components/Dashboard/ExerciseCard.tsx`
- `src/components/Dashboard/T3Overview.tsx`

### Task 1.2: TierBadge Components

**Shared Color Mapping:**
```typescript
// src/lib/tier-colors.ts
export const TIER_COLORS = {
  T1: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  T2: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  T3: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
}

export const STAGE_COLORS = {
  0: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  1: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
  2: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
}

export const DAY_COLORS = {
  A1: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
  A2: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
  B1: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  B2: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
}
```

**Files to create:**
- `src/lib/tier-colors.ts`
- `src/components/common/TierBadge.tsx`
- `src/components/common/DayBadge.tsx`
- `src/components/common/StageBadge.tsx`
- `tests/unit/TierBadge.test.tsx`

### Task 1.3: Dashboard Reorder

**Current Order:**
1. QuickStats (full width)
2. CurrentWorkout
3. MainLiftCards (2x2 grid)
4. T3Overview
5. Charts (lazy loaded)

**New Order:**
1. CurrentWorkout (most important - "what do I do today?")
2. MainLiftCards (2x2 grid)
3. T3Overview
4. Charts (lazy loaded)

**Header Changes:**
- Add condensed stats to DashboardHeader: **Current Week** progress (e.g., "Week 3 - 2/4 complete")
- This is more actionable than "Total Workouts" per Gemini review
- Remove standalone QuickStats section (data moves to header)

**Files to modify:**
- `src/components/Dashboard/DashboardContent.tsx`
- `src/components/Dashboard/DashboardHeader.tsx`
- `src/components/Dashboard/QuickStats.tsx` (extract condensed stats logic)

### Task 1.4: Settings Tabs

**Tab Structure:**
```
[Preferences] [Exercises] [Data] [About]
```

**Tab Content Mapping:**
| Tab | Contains |
|-----|----------|
| Preferences | Theme selector, Weight unit, (future: increments) |
| Exercises | ExerciseManager component |
| Data | Export, Import, Reset buttons |
| About | Version, Last sync, GitHub link |

**Implementation Note (from Gemini review):**
Use CSS `hidden` attribute instead of conditional rendering to prevent state loss:
```tsx
// BAD - unmounts ExerciseManager, loses draft state
{currentTab === 'exercises' && <ExerciseManager />}

// GOOD - preserves state across tab switches
<div hidden={currentTab !== 'exercises'}><ExerciseManager /></div>
```

**Files to create:**
- `src/components/Settings/SettingsTabs.tsx`
- `src/components/Settings/PreferencesTab.tsx`
- `src/components/Settings/DataTab.tsx`
- `src/components/Settings/AboutTab.tsx`
- `tests/unit/SettingsTabs.test.tsx`

**Files to modify:**
- `src/components/Settings/index.tsx`

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | - | - |

## Notes

- Update phase status as you progress: pending -> in_progress -> complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
- Create feature branch for each task: `feature/task-1.1-weight-display`, etc.
- Run `npm test` after each file modification
- Run `npm run build` before committing
