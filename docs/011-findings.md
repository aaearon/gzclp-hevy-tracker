# Findings & Decisions - Phase 1 Quick Wins

**Created:** 2026-01-13
**Source:** Codebase exploration for SIMPLIFICATION-PLAN.md Phase 1

---

## Requirements

From SIMPLIFICATION-PLAN.md Phase 1:

- **Task 1.1:** Extract WeightDisplay component (reduces 15+ duplications)
- **Task 1.2:** Create TierBadge component family (reduces 20+ duplications)
- **Task 1.3:** Reorder Dashboard sections (better information hierarchy)
- **Task 1.4:** Add Settings tabs (better UX organization)

---

## Research Findings

### WeightDisplay Pattern Analysis

**Current Pattern Found (repeated 10+ times):**
```typescript
<span className="text-xl font-bold text-gray-900 dark:text-gray-100">
  {displayWeight(progression.currentWeight, weightUnit)}
</span>
<span className="font-mono text-sm text-gray-500 dark:text-gray-400">
  {scheme.display}
</span>
```

**Files with displayWeight usage:**
1. `CurrentWorkout.tsx` - 6 instances (T1, T2, T3, warmups)
2. `MainLiftCard.tsx` - 2 instances (TierRow component)
3. `ExerciseCard.tsx` - 1 instance
4. `T3Overview.tsx` - 1 instance

**Variations observed:**
- Different text colors per tier (red/blue/green for T1/T2/T3)
- Different sizes (text-xl, text-lg, text-sm for warmups)
- Optional scheme display alongside weight
- Optional "TBD" fallback for unset weights

### TierBadge Pattern Analysis

**Current Pattern Found (repeated 20+ times):**
```typescript
<span className={`rounded border px-2 py-0.5 text-xs font-semibold ${tierColors[tier]}`}>
  {tier}
</span>
```

**Existing Color Definitions:**

*ExerciseCard.tsx:*
```typescript
const tierColors: Record<string, string> = {
  T1: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  T2: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  T3: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
}
```

*MainLiftCard.tsx (tierRowStyles):*
```typescript
const tierRowStyles = {
  T1: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-l-red-500',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  T2: { /* similar blue */ },
}
```

*MainLiftCard.tsx (stageColors):*
```typescript
const stageColors: Record<Stage, string> = {
  0: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  1: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
  2: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
}
```

**Badge Types Identified:**
1. **TierBadge** - T1, T2, T3 (red/blue/green)
2. **StageBadge** - Stage 0, 1, 2 (green/yellow/red)
3. **DayBadge** - A1, A2, B1, B2 (various)
4. **ChangeTypeBadge** - Progress, Stage Change, Deload, Repeat

### Dashboard Structure Analysis

**Current DashboardContent.tsx Order:**
1. `<QuickStats />` - mb-6, 3-column grid
2. `<CurrentWorkout />` - inside space-y-8 div
3. Main Lifts section (4x MainLiftCard in 2-col grid)
4. `<T3Overview />`
5. Progression Charts (lazy loaded)

**QuickStats Component:**
- Shows: Current Week, Total Workouts, Days Since Last
- Full-width 3-column grid with StatCard sub-component
- Has warning state for 7+ days since workout

**DashboardHeader Component:**
- Contains: Title, SyncStatus, PendingBadge, SyncButton, Settings link
- No stats currently

### Settings Page Analysis

**Current Settings/index.tsx Structure (259 lines):**
1. Header with back button
2. Success/Error messages
3. Exercise Roles section (ExerciseManager)
4. Appearance section (theme toggle)
5. Preferences section (weight unit)
6. Data Management section (export, import, reset)
7. About section (version, sync, exercise count, GitHub)

**Existing Components:**
- `ExportButton.tsx`
- `ImportButton.tsx`
- `ImportConfirmDialog.tsx`
- `DeleteDataButton.tsx`
- `ExerciseManager.tsx`

---

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| WeightDisplay size prop | Single component with `sm/md/lg` variants is cleaner than multiple components |
| ~~Scheme as optional prop~~ | REMOVED - Keep WeightDisplay focused on weight only (Gemini review) |
| Centralized tier-colors.ts | Single source of truth for all badge colors |
| TierBadge solid bg style | Match existing pattern with border + background |
| Separate Badge components | Type safety via domain-specific props > polymorphism (Gemini review) |
| URL hash for tabs | `/settings#data` is shareable and supports back button |
| CSS hidden for tabs | Prevent state loss when switching tabs (Gemini review) |
| Keep existing CollapsibleSection | Already exists, don't reinvent |
| Keep Current Week in header | More actionable than Total Workouts (Gemini review) |

## Gemini Code Review Feedback (2026-01-13)

### Critical
- **Settings Tab State Loss:** Using conditional rendering will unmount `ExerciseManager` and lose draft state. Fix: Use CSS `hidden` attribute instead.

### Medium
- **Dashboard Header:** Keep "Current Week: X of Y" in header rather than "Total Workouts" - it's more actionable for users wondering "Am I done for the week?"

### Low
- **WeightDisplay scheme prop:** Remove `scheme` from props - weight and scheme have different styling needs. Keep WeightDisplay focused on formatting the number only.

### Positive
- Centralized `tier-colors.ts` is excellent
- TDD approach is strong practice for refactoring

---

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| (none yet) | - |

---

## Resources

### Files Analyzed
- `src/components/Dashboard/CurrentWorkout.tsx` - 217 lines
- `src/components/Dashboard/MainLiftCard.tsx` - 167 lines
- `src/components/Dashboard/ExerciseCard.tsx` - 76 lines
- `src/components/Dashboard/T3Overview.tsx` - 156 lines
- `src/components/Dashboard/DashboardContent.tsx` - 108 lines
- `src/components/Dashboard/DashboardHeader.tsx` - 119 lines
- `src/components/Dashboard/QuickStats.tsx` - 76 lines
- `src/components/Settings/index.tsx` - 260 lines
- `src/components/ReviewModal/index.tsx` - 372 lines
- `src/utils/formatting.ts` - 128 lines (displayWeight function)

### Existing Common Components
- `CollapsibleSection.tsx`
- `ErrorFallback.tsx`
- `ErrorState.tsx`
- `LoadingSkeleton.tsx`
- `ChartSkeleton.tsx`
- `WeightInput.tsx` (different from WeightDisplay)
- `RoleDropdown.tsx`
- `StorageErrorBanner.tsx`
- `DataRecoveryDialog.tsx`

### Key Functions
- `displayWeight(weightKg, userUnit)` - `src/utils/formatting.ts:104`
- `getRepScheme(tier, stage)` - `src/lib/constants.ts`
- `formatWeight(weight, unit)` - `src/utils/formatting.ts:23`

---

## Dependency Graph

```
WeightDisplay
└── displayWeight (utils/formatting.ts)

TierBadge
├── tier-colors.ts (new)
└── Tier type (types/state.ts)

StageBadge
├── tier-colors.ts (new)
├── Stage type (types/state.ts)
└── STAGE_DISPLAY (lib/constants.ts)

DayBadge
├── tier-colors.ts (new)
└── GZCLPDay type (types/state.ts)

SettingsTabs
├── PreferencesTab
├── ExercisesTab (wraps ExerciseManager)
├── DataTab
└── AboutTab
```

---

*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
