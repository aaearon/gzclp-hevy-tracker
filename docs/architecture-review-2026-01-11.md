# GZCLP Hevy Tracker - Architecture Review

**Date:** 2026-01-11
**Reviewer:** Claude Opus 4.5 (with Gemini consultation)
**Scope:** Production readiness assessment
**Repository:** `/home/tim/gzclp-hevy-tracker`

---

## Executive Summary

The GZCLP Hevy Tracker application demonstrates solid foundational architecture with thoughtful patterns including split localStorage storage, a well-designed facade pattern for state management, and proper React Router integration. However, several concerns must be addressed before wider release.

### Risk Assessment

| Category | Severity | Count |
|----------|----------|-------|
| Critical | Production blockers | 1 |
| High | Should fix before release | 3 |
| Medium | Technical debt | 4 |
| Low | Future improvements | 3 |

---

## 1. State Management

### 1.1 Strengths

**Split Storage Architecture (Good Decision)**
- Three localStorage keys: `gzclp_config`, `gzclp_progression`, `gzclp_history`
- Optimized for different update frequencies and data sizes
- Documented in `/home/tim/gzclp-hevy-tracker/src/types/storage.ts:1-11`

**Facade Pattern in useProgram (Appropriate)**
- `/home/tim/gzclp-hevy-tracker/src/hooks/useProgram.ts` (196 lines)
- Composes 5 domain hooks with dependency injection
- Provides stable API over fragmented storage
- Well-structured with clear separation of concerns

```
useProgram (Facade)
    +-- useConfigStorage (gzclp_config)
    +-- useProgressionStorage (gzclp_progression)
    +-- useHistoryStorage (gzclp_history)
    +-- useExerciseManagement (DI: configStorage, progressionStorage)
    +-- useProgramSettings (DI: configStorage)
    +-- useProgressionManager (DI: progressionStorage)
    +-- useHistoryManager (DI: historyStorage)
    +-- useDataPersistence (DI: all three)
```

### 1.2 Concerns

#### CRITICAL: No Runtime Schema Validation on localStorage Hydration

**Location:** `/home/tim/gzclp-hevy-tracker/src/hooks/useLocalStorage.ts:38`

```typescript
return JSON.parse(item) as T  // Unsafe type assertion
```

**Impact:**
- Corrupted localStorage data will crash the application
- Schema migrations between versions have no validation
- Users could see "undefined is not an object" errors

**Evidence:** Type guards exist but are unused:
- `/home/tim/gzclp-hevy-tracker/src/types/storage.ts:95-132` defines `isConfigState()`, `isProgressionStore()`, `isHistoryState()`
- These are never called during hydration

**Recommendation:**
1. Add validation in domain storage hooks (`useConfigStorage`, etc.)
2. Fallback to defaults on validation failure with user warning
3. Implement schema migration system for version changes

#### HIGH: Underutilized ProgramContext

**Location:** `/home/tim/gzclp-hevy-tracker/src/contexts/ProgramContext.tsx`

**Issue:** Context is defined but never provided in the component tree.

Looking at `/home/tim/gzclp-hevy-tracker/src/router.tsx:33-43`:
```typescript
function RootLayout() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  )
}
```

**Missing:** `ProgramProvider` wrapper.

**Current Behavior:**
- Each route (`SetupGuard`, `Dashboard`, `ChartsPage`) calls `useProgram()` independently
- Synchronization happens via custom `window` events in `useLocalStorage.ts:56-64`
- Inefficient: multiple JSON parse/stringify operations

**Recommendation:**
1. Lift `useProgram()` to `RootLayout`
2. Wrap with `ProgramProvider`
3. Update components to use `useProgramContext()` for reads

---

## 2. Component Architecture

### 2.1 Dashboard "God Component"

**Location:** `/home/tim/gzclp-hevy-tracker/src/components/Dashboard/index.tsx` (374 lines)

**Concerns:**

1. **Mixed Responsibilities:**
   - UI rendering
   - Sync orchestration
   - Push dialog management
   - Data migration (history import, AMRAP backfill)
   - Discrepancy handling

2. **Side Effects in Component:**
   Lines 150-177 contain data migration logic:
   ```typescript
   // Auto-import progression history if empty
   useEffect(() => {
     // ... API calls for data migration
     void importProgressionHistory(...)
   }, [...])

   // Auto-backfill AMRAP records
   useEffect(() => {
     // ... more API calls
     void backfillAmrapRecords(...)
   }, [...])
   ```

   This migration logic is buried in a visual component and can re-trigger unexpectedly.

3. **Hook Composition Complexity:**
   Dashboard uses 6 custom hooks plus React hooks:
   - `useProgram()`
   - `useSyncFlow()`
   - `usePendingChanges()`
   - `usePushDialog()`
   - `useOnlineStatus()`
   - 2x `useRef()` for tracking state

**Recommendation:**
1. Extract data migration to `useDataMaintenance` hook (run at app startup, not Dashboard)
2. Create `useDashboardController` to encapsulate orchestration logic
3. Target: Dashboard component under 150 lines, focused on layout only

### 2.2 PushConfirmDialog Size

**Location:** `/home/tim/gzclp-hevy-tracker/src/components/Dashboard/PushConfirmDialog.tsx` (448 lines)

**Observation:** Largest component file. Complex dialog with:
- Preview loading states
- Error handling
- Action modification per exercise
- Day-by-day grouping

**Assessment:** Acceptable given the complexity of the feature, but could benefit from extraction of:
- `DayChangePreview` sub-component
- `ExerciseChangeRow` sub-component

---

## 3. Data Layer

### 3.1 localStorage Scalability

**Location:** `/home/tim/gzclp-hevy-tracker/src/hooks/useHistoryStorage.ts:7-9`

```typescript
// Note: This storage can grow unbounded over time. Consider migrating
// to IndexedDB for large datasets in the future.
```

**Current State:**
- History grows with every workout (append-only)
- Estimated growth: ~1KB per workout
- localStorage limit: 5-10MB (browser-dependent)
- Years of use could hit limits

**Recommendation:**
1. Add size monitoring (warn at 50% capacity)
2. Implement data export/archival for old history
3. Plan IndexedDB migration for `gzclp_history` (keep others in localStorage for speed)

### 3.2 Data Integrity

**Strengths:**
- Atomic rollback in `useDataPersistence.ts:85-148`
- Import validation with structured result types

**Concern:** No transaction guarantees across the 3 localStorage keys.

**Scenario:** Browser crash mid-update could leave inconsistent state:
- Config updated, progression not updated

**Mitigation:** Low priority - localStorage operations are generally fast enough that this is unlikely. Could add integrity check on startup.

---

## 4. Error Boundaries

### 4.1 Current Implementation

**Root Level:** `/home/tim/gzclp-hevy-tracker/src/router.tsx:35`
- Wraps entire app
- Generic fallback UI with retry

**Chart Section:** `/home/tim/gzclp-hevy-tracker/src/components/Dashboard/DashboardContent.tsx:85-102`
- Specific boundary for lazy-loaded charts
- Custom fallback message

### 4.2 Gaps

**Missing Boundaries:**
1. **API Operations:** Sync/Push operations can fail but no boundary catches render errors from stale state
2. **ReviewModal:** Complex state transitions could throw
3. **SetupWizard:** Multi-step form with complex state

**Recommendation:**
1. Add boundary around `ReviewModal`
2. Add boundary around each SetupWizard step
3. Consider error boundary HOC for API-dependent components

---

## 5. Code Organization

### 5.1 File Structure Assessment

**Strengths:**
- Feature-based component organization (`Dashboard/`, `SetupWizard/`, etc.)
- Clear separation: `lib/` (pure logic), `hooks/` (React integration), `types/`
- Consistent naming conventions

**Current Structure:**
```
src/
  components/
    Dashboard/          (9 files, 2,100+ lines total)
    SetupWizard/        (14 files)
    ProgressionChart/   (5 files)
    ReviewModal/        (3 files)
    Settings/           (6 files)
    common/             (10 files)
  hooks/                (17 files, 3,000+ lines total)
  lib/                  (18 files)
  contexts/             (3 files)
  types/                (4 files)
  utils/                (5 files)
```

### 5.2 Dependency Concerns

**Checked for Circular Dependencies:**

No circular imports detected in core files. Import structure is hierarchical:
- Types imported by lib and hooks
- Lib imported by hooks
- Hooks and contexts imported by components

**Path Aliases:** Properly configured with `@/` prefix.

---

## 6. Scalability Concerns

### 6.1 User Data Volume

| Data Type | Current Size | Growth Rate | Concern Level |
|-----------|--------------|-------------|---------------|
| Config | ~2-5KB | Minimal | Low |
| Progression | ~5-20KB | ~100 bytes/workout | Low |
| History | ~50KB-2MB | ~1KB/workout | Medium |

**Projection:** 3 workouts/week for 5 years = 780 workouts = ~780KB history
- Within localStorage limits, but monitoring recommended

### 6.2 Component Rendering

**Observations:**
- `useDeferredValue` used for chart data (good optimization)
- Lazy loading for all major views
- Memoization with `useMemo` in key places

**Potential Issue:**
- `DashboardContent` receives entire `GZCLPState` as prop
- Any state change triggers full re-render cascade

**Recommendation:** Consider splitting `DashboardContent` props or using context selectors.

### 6.3 API Rate Limiting

**Current Handling:**
- `/home/tim/gzclp-hevy-tracker/src/lib/hevy-client.ts` has `HevyRateLimitError`
- No automatic retry or backoff implemented

**Recommendation:** Add exponential backoff for rate limit errors.

---

## 7. Production Readiness Checklist

### Must Fix Before Release

- [ ] **CRITICAL:** Add runtime localStorage validation with fallback
- [ ] **HIGH:** Extract data migration from Dashboard to startup hook
- [ ] **HIGH:** Wire up ProgramContext at router level
- [ ] **HIGH:** Add localStorage size monitoring with warnings

### Should Fix (Technical Debt)

- [ ] Add error boundaries around ReviewModal and SetupWizard steps
- [ ] Extract PushConfirmDialog sub-components
- [ ] Implement API retry with exponential backoff
- [ ] Add data export/archive for old history

### Nice to Have

- [ ] Add Web Vitals monitoring
- [ ] Implement E2E tests with Playwright
- [ ] Add Sentry or similar error tracking
- [ ] IndexedDB migration for history storage

---

## 8. Architecture Diagram (Updated)

```
+------------------------------------------------------------------+
|                           Browser                                  |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------------+    +-------------------------------+   |
|  |     React Router 7     |    |        Error Boundary         |   |
|  |    (Route Guards)      |    |       (Root + Chart)          |   |
|  +------------------------+    +-------------------------------+   |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                      Context Providers                         | |
|  |  +------------------+  +-----------------+  +---------------+ | |
|  |  | ThemeContext     |  | ToastContext    |  | ProgramContext| | |
|  |  | (active)         |  | (active)        |  | (UNUSED!)     | | |
|  |  +------------------+  +-----------------+  +---------------+ | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                    Lazy-Loaded Views                           | |
|  |  +------------+  +------------+  +---------+  +------------+  | |
|  |  | Dashboard  |  | Settings   |  | Charts  |  | SetupWizard|  | |
|  |  | (374 LOC)  |  | (moderate) |  | (ok)    |  | (complex)  |  | |
|  |  +------------+  +------------+  +---------+  +------------+  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                       Hook Layer                               | |
|  |  +------------------+     +--------------------------------+   | |
|  |  | useProgram       | --> | Domain Hooks (5)               |   | |
|  |  | (Facade: 196 LOC)|     | - useExerciseManagement        |   | |
|  |  +------------------+     | - useProgramSettings           |   | |
|  |          |                | - useProgressionManager        |   | |
|  |          v                | - useHistoryManager            |   | |
|  |  +------------------+     | - useDataPersistence           |   | |
|  |  | Storage Hooks    |     +--------------------------------+   | |
|  |  | - useConfig      |                                          | |
|  |  | - useProgression |     +--------------------------------+   | |
|  |  | - useHistory     |     | Feature Hooks                  |   | |
|  |  +------------------+     | - useSyncFlow, usePushDialog   |   | |
|  |          |                | - usePendingChanges            |   | |
|  |          v                | - useProgression, useChartData |   | |
|  |  +------------------+     +--------------------------------+   | |
|  |  | useLocalStorage  |                                          | |
|  |  | (NO VALIDATION!) |<-- CRITICAL ISSUE                        | |
|  |  +------------------+                                          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                     localStorage                               | |
|  |  +----------------+ +------------------+ +------------------+  | |
|  |  | gzclp_config   | | gzclp_progression| | gzclp_history    |  | |
|  |  | ~2-5KB         | | ~5-20KB          | | ~50KB-2MB        |  | |
|  |  | (stable)       | | (frequent)       | | (UNBOUNDED!)     |  | |
|  |  +----------------+ +------------------+ +------------------+  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                      Hevy REST API v1                             |
|  - Workouts (GET)           - Routines (GET/PUT/POST)            |
|  - Exercise Templates       - Rate Limited (unspecified)          |
+------------------------------------------------------------------+
```

---

## 9. Conclusion

The GZCLP Hevy Tracker has a solid architectural foundation with thoughtful design decisions around state management (split storage, facade pattern) and modern React patterns (lazy loading, React Router v7). The codebase is well-organized and TypeScript strict mode provides compile-time safety.

**However, production readiness is blocked by:**

1. **No runtime validation of localStorage data** - This is a critical crash risk for real users with corrupted or migrated data.

2. **Dashboard component has too many responsibilities** - Data migration logic in a visual component creates maintenance risk.

3. **ProgramContext is defined but unused** - Multiple `useProgram` instances synchronized via window events is fragile.

**Positive Aspects:**
- Split storage architecture is well-designed
- Facade pattern in `useProgram` is appropriate and clean
- Error boundary placement is reasonable (root + charts)
- Type system is comprehensive and strict
- Documentation (ARCHITECTURE.md) is excellent

**Immediate Actions Required:**
1. Add validation layer for localStorage reads
2. Extract data migration to app initialization
3. Wire up ProgramContext properly
4. Add localStorage size monitoring

After addressing these concerns, the application will be production-ready for wider release.

---

*Review completed with consultation from Gemini (code reviewer role) confirming findings and recommendations.*
