# GZCLP Hevy Tracker - Simplification Implementation Plan

**Status:** Ready for Review
**Created:** 2026-01-13
**Estimated Total Effort:** 3-4 weeks

---

## Phase 1: Quick Wins (1-2 days each) - COMPLETE

### Task 1.1: Extract WeightDisplay Component - COMPLETE
**Priority:** HIGH | **Effort:** 4 hours | **Impact:** Reduces 15+ duplications

**Completed:** 2026-01-13
- Created `src/components/common/WeightDisplay.tsx` with size variants (sm/md/lg)
- Props: `weight`, `unit`, `size`, `colorClass`, `showUnit`
- Replaced usages in CurrentWorkout, MainLiftCard, ExerciseCard, T3Overview
- Added 18 unit tests

---

### Task 1.2: Create TierBadge Component - COMPLETE
**Priority:** HIGH | **Effort:** 3 hours | **Impact:** Reduces 20+ duplications

**Completed:** 2026-01-13
- Created `src/lib/tier-colors.ts` with centralized color definitions
- Created TierBadge, StageBadge, DayBadge components
- Replaced usages in Dashboard and ReviewModal components
- Added 27 unit tests

---

### Task 1.3: Reorder Dashboard Sections - COMPLETE
**Priority:** MEDIUM | **Effort:** 2 hours | **Impact:** Better information hierarchy

**Completed:** 2026-01-13
- Added week progress badge to DashboardHeader ("Week X - Y/Z")
- Removed QuickStats from DashboardContent
- CurrentWorkout now first (most important: "what do I do today?")

---

### Task 1.4: Add Settings Tabs - COMPLETE
**Priority:** MEDIUM | **Effort:** 4 hours | **Impact:** Better UX organization

**Completed:** 2026-01-13
- Created `src/components/Settings/SettingsTabs.tsx`
- Tabs: Preferences | Exercises | Data | About
- URL hash persistence (#preferences, #exercises, #data, #about)
- Full keyboard navigation (ArrowLeft/Right, Home, End)
- Uses CSS `hidden` attribute to preserve ExerciseManager state
- Added 24 unit tests

---

## Phase 2: Architecture Refactors (3-5 days each)

### Task 2.1: Split useProgram into Granular Contexts
**Priority:** CRITICAL | **Effort:** 3 days | **Impact:** Fixes re-render performance

**Problem:**
`useProgram` is a "God Hook" returning 25+ methods. Every state change triggers re-renders in all consuming components.

**Current Structure:**
```
useProgram() → returns {
  state, isSetupRequired,
  setApiKey, setWeightUnit,           // config
  addExercise, updateExercise, ...    // exercises
  setInitialWeight, updateProgression, ...  // progression
  setProgressionHistory, recordHistoryEntry, ...  // history
  resetState, importState, ...        // persistence
}
```

**New Structure:**
```
useProgramConfig() → { apiKey, weightUnit, exercises, setApiKey, ... }
useProgression() → { progressions, pending, setInitialWeight, ... }
useHistory() → { history, setProgressionHistory, recordHistoryEntry }
usePersistence() → { resetState, importState }

// Facade for components that need everything (backwards compat)
useProgram() → combines all above
```

**Tasks:**
- [ ] Create `src/contexts/ConfigContext.tsx`
- [ ] Create `src/contexts/ProgressionContext.tsx`
- [ ] Create `src/contexts/HistoryContext.tsx`
- [ ] Update `src/contexts/ProgramContext.tsx` to compose contexts
- [ ] Create selector hooks: `useWeightUnit()`, `useExercise(id)`, etc.
- [ ] Migrate components to use specific contexts instead of useProgram
- [ ] Add performance tests (React DevTools profiler)
- [ ] Update tests (mock specific contexts)

**Files to modify:**
- `src/contexts/ConfigContext.tsx` (new)
- `src/contexts/ProgressionContext.tsx` (new)
- `src/contexts/HistoryContext.tsx` (new)
- `src/contexts/ProgramContext.tsx`
- `src/hooks/useProgram.ts`
- `src/router.tsx` (provider hierarchy)
- All components using useProgram

**Risks:**
- Breaking change to hook API
- Need to update all consumers
- Test coverage critical

---

### Task 2.2: Streamline Sync Flow (Optimistic Sync)
**Priority:** HIGH | **Effort:** 4 days | **Impact:** UX improvement, fewer clicks

**Current Flow:** (7+ clicks)
1. Click "Fetch" on Dashboard
2. Wait for sync
3. Review Modal opens
4. Click "Apply" on each change (or "Apply All")
5. Close modal
6. Click "Push to Hevy"
7. Confirm in PushConfirmDialog

**New Flow:** (2-3 clicks)
1. Click "Sync" on Dashboard
2. Non-conflicting changes auto-applied
3. Conflict modal ONLY if discrepancies detected
4. Single "Push All" confirmation

**Tasks:**
- [ ] Add auto-apply setting to config: `autoApplyNonConflicting: boolean`
- [ ] Modify `useSyncFlow` to categorize changes:
  - Auto-apply: weight increases, stage progressions (standard flow)
  - Require review: discrepancies, weight decreases, stage rollbacks
- [ ] Update ReviewModal to only show conflicts
- [ ] Combine push confirmation into sync success toast
- [ ] Add "Review Applied Changes" link in toast for transparency
- [ ] Update tests for new flow

**Files to modify:**
- `src/hooks/useSyncFlow.ts`
- `src/hooks/useProgression.ts`
- `src/hooks/usePendingChanges.ts`
- `src/components/Dashboard/index.tsx`
- `src/components/ReviewModal/index.tsx`
- `src/components/Dashboard/PushConfirmDialog.tsx`

**Risks:**
- Users may not notice auto-applied changes
- Need clear feedback (toast with summary)
- Existing tests assume manual flow

---

### Task 2.3: Split routine-importer.ts
**Priority:** HIGH | **Effort:** 2 days | **Impact:** Maintainability, testability

**Current:** 970 lines handling 4 concerns:
1. Routine extraction from Hevy data
2. Warmup exercise detection
3. Exercise deduplication
4. Weight resolution from history

**New Structure:**
```
src/lib/routine-import/
├── index.ts              (~100 lines, orchestrator)
├── warmup-detector.ts    (~150 lines)
├── exercise-deduplicator.ts (~150 lines)
├── weight-resolver.ts    (~200 lines)
├── types.ts              (~50 lines)
└── __tests__/
    ├── warmup-detector.test.ts
    ├── exercise-deduplicator.test.ts
    └── weight-resolver.test.ts
```

**Tasks:**
- [ ] Create `src/lib/routine-import/` directory
- [ ] Extract `WarmupDetector` class/functions
- [ ] Extract `ExerciseDeduplicator` with configurable strategy
- [ ] Extract `WeightResolver` class
- [ ] Create orchestrator in `index.ts`
- [ ] Migrate existing tests, split by module
- [ ] Add tests for edge cases (deduplication "first wins" behavior)
- [ ] Update imports in `useRoutineImport.ts`

**Files to modify:**
- `src/lib/routine-importer.ts` → split into multiple files
- `src/lib/routine-import/index.ts` (new)
- `src/lib/routine-import/warmup-detector.ts` (new)
- `src/lib/routine-import/exercise-deduplicator.ts` (new)
- `src/lib/routine-import/weight-resolver.ts` (new)
- `src/hooks/useRoutineImport.ts`
- `tests/lib/routine-importer.test.ts` → split

---

### Task 2.4: Dashboard Focus Mode
**Priority:** MEDIUM | **Effort:** 3 days | **Impact:** Reduces cognitive load

**Current:** All 5 sections visible at once

**New:** Progressive disclosure
- CurrentWorkout always visible (primary action)
- MainLiftCards in collapsible "All Lifts" section
- T3Overview in collapsible section
- Charts lazy-loaded on expand

**Tasks:**
- [ ] Create `src/components/common/CollapsibleSection.tsx` (or enhance existing)
- [ ] Wrap MainLiftCards section with collapsible
- [ ] Wrap T3Overview with collapsible
- [ ] Keep charts lazy-loaded, add accordion trigger
- [ ] Persist expansion state in localStorage
- [ ] Add "Expand All" / "Collapse All" toggle
- [ ] Test on mobile (touch targets, scrolling)

**Files to modify:**
- `src/components/common/CollapsibleSection.tsx`
- `src/components/Dashboard/DashboardContent.tsx`
- `src/components/Dashboard/MainLiftCard.tsx`
- `src/components/Dashboard/T3Overview.tsx`

---

## Phase 3: Larger Refactors (1+ week each)

### Task 3.1: Simplify useLocalStorage
**Priority:** HIGH | **Effort:** 5 days | **Impact:** Maintainability

**Current:** 388 lines handling 5 concerns:
1. Write-before-state pattern
2. Quota checking (>1KB writes)
3. Same-tab sync via custom events
4. Cross-tab sync via storage events
5. Corruption recovery

**Options:**
A. **Split into focused hooks** (recommended)
B. Replace with `use-local-storage-state` library
C. Keep as-is (not recommended)

**Tasks for Option A:**
- [ ] Create `src/hooks/storage/useLocalStorageCore.ts` (~120 lines)
  - Basic read/write with validation
- [ ] Create `src/hooks/storage/useStorageSync.ts` (~80 lines)
  - Cross-tab sync only (same-tab handled by Context)
- [ ] Create `src/hooks/storage/useStorageQuota.ts` (~50 lines)
  - Quota checking for large writes
- [ ] Move corruption handling to `StorageContext` (cross-cutting)
- [ ] Update all usages to use new hooks
- [ ] Remove same-tab sync (redundant with Context)
- [ ] Add tests for each focused hook

**Files to modify:**
- `src/hooks/useLocalStorage.ts` → split
- `src/hooks/storage/useLocalStorageCore.ts` (new)
- `src/hooks/storage/useStorageSync.ts` (new)
- `src/hooks/storage/useStorageQuota.ts` (new)
- `src/contexts/StorageContext.tsx`
- `src/hooks/useConfigStorage.ts`
- `src/hooks/useProgressionStorage.ts`
- `src/hooks/useHistoryStorage.ts`

---

### Task 3.2: Extract HTTP Client Layer
**Priority:** MEDIUM | **Effort:** 3 days | **Impact:** Reusability, testability

**Current:** `hevy-client.ts` (472 lines) mixes:
- Generic HTTP retry/timeout/abort logic
- Hevy-specific endpoints

**New Structure:**
```
src/lib/
├── http-client.ts        (~150 lines, generic retry client)
└── hevy/
    ├── hevy-client.ts    (~100 lines, Hevy endpoints)
    ├── hevy-types.ts     (~50 lines)
    └── hevy-schemas.ts   (~100 lines, Zod validation)
```

**Tasks:**
- [ ] Create `src/lib/http-client.ts` with:
  - Configurable retry count and delay
  - Exponential backoff
  - Timeout handling
  - AbortController support
- [ ] Refactor `HevyClient` to extend/use HttpClient
- [ ] Add Zod schemas for API responses (runtime validation)
- [ ] Update tests to mock at HttpClient level
- [ ] Remove `useHevyApi` wrapper (call HevyClient directly)

**Files to modify:**
- `src/lib/http-client.ts` (new)
- `src/lib/hevy-client.ts` → refactor
- `src/lib/hevy/hevy-schemas.ts` (new)
- `src/hooks/useHevyApi.ts` (delete)
- `src/hooks/useProgression.ts` (use HevyClient directly)

---

### Task 3.3: Add Onboarding Flow
**Priority:** MEDIUM | **Effort:** 4 days | **Impact:** Better first-time UX

**Current:** Users land on Dashboard with no guidance

**Proposed:**
- First-visit banner explaining key sections
- Tooltips pointing to sync button, pending changes
- Optional "tour mode" with step-by-step highlights
- "Don't show again" preference

**Tasks:**
- [ ] Create `src/hooks/useOnboarding.ts` (track completion state)
- [ ] Create `src/components/common/OnboardingBanner.tsx`
- [ ] Create `src/components/common/OnboardingTooltip.tsx`
- [ ] Add onboarding config to `gzclp_config` localStorage
- [ ] Implement step sequence:
  1. "Welcome! Here's your current workout"
  2. "Sync to pull your latest Hevy workouts"
  3. "Review and apply progression changes"
  4. "Push updated weights back to Hevy"
- [ ] Add "Skip tour" and "Don't show again" options
- [ ] Test on mobile

**Files to modify:**
- `src/hooks/useOnboarding.ts` (new)
- `src/components/common/OnboardingBanner.tsx` (new)
- `src/components/common/OnboardingTooltip.tsx` (new)
- `src/components/Dashboard/index.tsx`
- `src/hooks/useConfigStorage.ts` (add onboarding field)

---

## Phase 4: Testing & Documentation

### Task 4.1: Update Architecture Documentation
**Priority:** HIGH | **Effort:** 2 hours | **Impact:** Knowledge preservation

**Tasks:**
- [ ] Update `docs/ARCHITECTURE.md` with new context structure
- [ ] Document sync flow changes (if optimistic sync implemented)
- [ ] Add diagrams for new component hierarchy
- [ ] Update hook dependency diagram

---

### Task 4.2: Performance Testing
**Priority:** MEDIUM | **Effort:** 1 day | **Impact:** Validate improvements

**Tasks:**
- [ ] Set up React DevTools Profiler baseline (before changes)
- [ ] Measure re-render counts on:
  - Dashboard load
  - Sync button click
  - Pending change apply
  - Settings toggle
- [ ] After context split, measure improvement
- [ ] Document findings

---

## Implementation Order (Recommended)

### Week 1: Quick Wins
1. Task 1.1: Extract WeightDisplay
2. Task 1.2: Create TierBadge
3. Task 1.3: Reorder Dashboard
4. Task 1.4: Add Settings Tabs

### Week 2: Core Architecture
5. Task 2.1: Split useProgram (start)
6. Task 2.3: Split routine-importer.ts

### Week 3: UX Improvements
7. Task 2.1: Split useProgram (complete)
8. Task 2.2: Streamline Sync Flow
9. Task 2.4: Dashboard Focus Mode

### Week 4: Polish & Large Refactors
10. Task 3.1: Simplify useLocalStorage
11. Task 3.2: Extract HTTP Client
12. Task 4.1: Update documentation

### Future / Optional
- Task 3.3: Onboarding Flow
- Task 4.2: Performance Testing

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Run full test suite after each task |
| Context split causes render bugs | Profile before/after, add integration tests |
| Sync flow confusion for existing users | Add changelog banner, keep "manual mode" option |
| Large refactors scope creep | Time-box each task, defer enhancements |

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Sync workflow clicks | 7+ | 2-3 |
| Dashboard re-renders per state change | All components | Only affected contexts |
| routine-importer.ts lines | 970 | ~200 (orchestrator) |
| useLocalStorage.ts lines | 388 | ~120 (core) |
| Duplicated WeightDisplay patterns | 15+ | 0 |
| Duplicated TierBadge patterns | 20+ | 0 |

---

## Sources

- [Boostcamp GZCLP](https://www.boostcamp.app/coaches/cody-lefever/gzcl-program-gzclp)
- [Liftosaur GZCLP](https://www.liftosaur.com/programs/gzclp)
- [GZCL Method Logger (iOS)](https://apps.apple.com/us/app/gzcl-method-workout-logger/id1517032809)
- [mattwelson/gzclp (GitHub)](https://github.com/mattwelson/gzclp)
- [Hevy App Alternatives](https://alternativeto.net/software/hevy-workout-tracker/)
