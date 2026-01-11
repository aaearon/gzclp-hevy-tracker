# Pre-Release Review: GZCLP Hevy Tracker

**Date:** 2026-01-11
**Reviewers:** Claude (Opus 4.5), Gemini (3 Pro Preview)
**Version:** Pre-release

---

## Executive Summary

The GZCLP Hevy Tracker is a **well-architected, production-quality application** demonstrating modern React best practices. The codebase is mature with 85 test files, strict TypeScript, and comprehensive documentation.

**Overall Verdict:** Ready for release with recommended fixes for 3 critical issues.

### Key Strengths
- Excellent architecture (Facade pattern with dependency injection)
- Strong error handling (typed errors, exponential backoff)
- Robust API integration (retry logic, rate limiting, offline detection)
- Comprehensive test coverage for business logic (~80%)
- Clean separation of concerns

### Critical Issues (Must Fix)
1. ~~**Weight unit inconsistency** - Create path stores in user's unit instead of kg; display doesn't convert~~ **FIXED** (2026-01-11)
2. **localStorage quota handling** - No handling for QuotaExceededError
3. **Data loss on corruption** - Silent fallback to defaults may wipe user data

---

## 1. Architecture Assessment

### Rating: Excellent

The application uses a well-designed **Facade + Dependency Injection** pattern:

```
useProgram (Facade - 196 lines)
├── Storage Hooks (instantiated once)
│   ├── useConfigStorage
│   ├── useProgressionStorage
│   └── useHistoryStorage
└── Domain Hooks (receive storage via DI)
    ├── useExerciseManagement
    ├── useProgramSettings
    ├── useProgressionManager
    ├── useHistoryManager
    └── useDataPersistence
```

**Strengths:**
- Single instantiation of storage hooks
- Testable domain hooks in isolation
- Clear separation of concerns
- 57% code reduction from monolithic approach

**Recommendation (from Gemini):** Ensure `useProgram` doesn't become a "God Object" - keep business logic in domain hooks, use facade only for wiring.

---

## 2. Critical Issues

### 2.1 Weight Unit Inconsistency

**Severity:** CRITICAL

**Design Principle:** All weights should be stored internally in **kg** (matching Hevy API). Conversion to/from user's preferred unit should happen at input/output boundaries only.

**Current Problems:**

#### A. Create Path Stores User's Unit Instead of kg
**Location:** `src/lib/program-builder.ts:331`
```typescript
const initialWeight = weights[role] ?? 0  // User's unit, stored directly!
state.progression[t1Key] = createProgressionEntry(exerciseId, initialWeight, 0)
```
User enters 225 lbs → stored as 225 → should be ~102 kg

#### B. Display Doesn't Convert from kg
**Locations:**
- `src/components/Dashboard/MainLiftCard.tsx:109`
- `src/components/Dashboard/ExerciseCard.tsx:46`
- `src/components/Dashboard/CurrentWorkout.tsx:133,169,197`
- `src/components/Dashboard/T3Overview.tsx:116`

```typescript
{formatWeight(progression.currentWeight, weightUnit)}  // Just appends unit!
```
Should be: `formatWeight(convertWeight(progression.currentWeight, 'kg', weightUnit), weightUnit)`

#### C. Routine Builder Has Wrong Assumption
**Location:** `src/lib/routine-builder.ts:105`
```typescript
const weightKg = toKilograms(currentWeight, settings.weightUnit)
```
Currently assumes `currentWeight` is in user's unit. Once storage is fixed to kg, this line should just be `const weightKg = currentWeight`.

#### D. Progression Calculations Need kg-Based Increments
**Location:** `src/lib/progression.ts:165,256,325`
```typescript
const increment = getIncrement(muscleGroup, unit)  // Returns lbs increment if user prefers lbs
return { newWeight: current.currentWeight + increment }  // Adding lbs to kg!
```
The increment needs to be converted to kg before adding to the kg-stored weight.

**Fix Strategy:**
1. Add `convertWeight(weight, 'kg', userUnit)` wrapper for all display locations
2. Convert user input to kg in `buildCreateProgramState()` and `WeightSetupStep`
3. Update `routine-builder.ts` to use kg directly (remove `toKilograms` call)
4. Update `progression.ts` to convert increments to kg: `toKg(increment, userUnit)`
5. Update `calculateDeload()` to work in kg
6. Update all tests to use kg for stored weights

**Helper Function to Add:**
```typescript
// In utils/formatting.ts
export function displayWeight(weightKg: number, userUnit: WeightUnit): string {
  const displayValue = userUnit === 'lbs'
    ? convertWeight(weightKg, 'kg', 'lbs')
    : weightKg
  return formatWeight(displayValue, userUnit)
}
```

---

### 2.2 localStorage Quota Exceeded

**Severity:** CRITICAL
**Location:** `src/hooks/useLocalStorage.ts:70-97`

**Problem:** No specific handling for `QuotaExceededError`. Users with large history data will encounter silent failures.

**Fix Required:**
```typescript
try {
  window.localStorage.setItem(key, serialized)
} catch (error) {
  if (error instanceof DOMException &&
      (error.code === 22 || error.name === 'QuotaExceededError')) {
    // Show user-facing error
    showToast('Storage full. Please export and clear old data.', 'error')
    return // Don't update state
  }
  throw error
}
```

---

### 2.3 Data Loss on Corruption Risk

**Severity:** CRITICAL
**Location:** `src/hooks/useLocalStorage.ts:45-66`

**Problem:** If localStorage data is malformed (e.g., browser crash during write), `JSON.parse` fails and the hook silently returns `initialValue`. On next save, this overwrites the user's data with defaults.

**Fix Required:**
```typescript
try {
  const parsed = JSON.parse(stored)
  return parsed
} catch (error) {
  console.error(`Corrupted data in "${key}". Raw:`, stored)
  // DON'T return initialValue - expose recovery option
  setCorruptedKey(key, stored) // Store for potential recovery
  showToast('Data recovery needed. Please check settings.', 'error')
  return initialValue // But mark as corrupted
}
```

---

## 3. High Priority Issues

### 3.1 Unbounded History Growth

**Severity:** HIGH
**Location:** `src/hooks/useHistoryStorage.ts`

**Problem:** History data grows indefinitely with no pruning. As data approaches 2-5MB, `JSON.parse` will cause main-thread blocking during app initialization.

**Recommendations:**
1. **Immediate:** Implement history pruning (keep last 6 months or 500 workouts)
2. **Future:** Migrate history to IndexedDB using `idb-keyval` or `Dexie.js`

---

### 3.2 Push/Sync Race Condition

**Severity:** HIGH
**Location:** `src/hooks/usePushDialog.ts`

**Problem:** No mutex between push and sync operations. Both could run simultaneously, causing state inconsistency.

**Fix Required:**
```typescript
// In Dashboard
if (isSyncing) {
  showToast('Cannot push while sync is in progress')
  return
}
// Disable push button when isSyncing === true
```

---

### 3.3 Old Storage Format Migration

**Severity:** HIGH (if old users exist)
**Location:** Not present in codebase

**Problem:** If users have old monolithic `gzclp_state` key from before the storage split, their data will be orphaned.

**Fix Required:** One-time migration on first load:
```typescript
const oldState = localStorage.getItem('gzclp_state')
if (oldState && !localStorage.getItem('gzclp_config')) {
  // Migrate to split format
  const parsed = JSON.parse(oldState)
  // Split into config, progression, history keys
  localStorage.removeItem('gzclp_state')
}
```

---

## 4. Security Findings

### 4.1 API Key Storage (Medium Risk)

**Location:** `src/types/storage.ts:33-46`

**Finding:** API key stored in localStorage as plaintext. While this is standard for client-side apps, it's vulnerable to XSS.

**Mitigations Present:**
- CSP implemented in `index.html`
- API key excluded from exports
- Key masked in UI by default

**Recommendations:**
1. Consider `sessionStorage` option for public computers
2. Document security considerations for users
3. Remove `'unsafe-eval'` from CSP if not required

### 4.2 URL Path Injection (Low Risk)

**Location:** `src/lib/hevy-client.ts:347`

**Finding:** Workout/routine IDs interpolated into URLs without validation.

**Recommendation:** Validate IDs match UUID format before URL construction.

### 4.3 Input Sanitization (Low Risk)

**Location:** `src/utils/validation.ts:67-78`

**Finding:** `sanitizeInput()` function exists but is unused in the codebase.

**Recommendation:** Apply to API-sourced display strings (exercise names, routine titles).

---

## 5. Edge Cases Analysis

### Well Handled (39 cases)
- Network failures, timeouts, rate limiting
- Offline detection and recovery
- Component unmount during requests
- localStorage JSON corruption
- Schema validation on load
- Import data validation (Zod)
- Cross-tab localStorage sync
- Empty arrays, null values, zero weights
- Maximum stage overflow
- Invalid API key format
- Routine deletion handling

### Not Handled

| Edge Case | Severity | Location |
|-----------|----------|----------|
| Weight unit conversion | Critical | `useConfigStorage.ts` |
| QuotaExceededError | Critical | `useLocalStorage.ts` |
| Data corruption recovery | Critical | `useLocalStorage.ts` |
| Push during sync | High | Dashboard |
| Old storage migration | High | N/A |
| Partial pagination failure | Medium | `hevy-client.ts:301` |
| Concurrent imports | Medium | ImportButton |
| Duplicate template IDs | Medium | `workout-analysis.ts:52` |
| Negative workout count | Low | `useProgressionManager.ts` |

---

## 6. Accessibility Audit

### Rating: Partial Compliance (WCAG 2.1 AA)

### Good Practices Found
- Consistent 44px touch targets
- `role="dialog"` and `aria-modal` on modals
- Dark mode with adequate contrast
- Focus rings on interactive elements
- Escape key support for some modals
- `aria-busy` on sync button
- Skeleton loading with `aria-hidden`

### High Priority Fixes Needed

| Issue | Location | Fix |
|-------|----------|-----|
| Missing focus traps | PushConfirmDialog, DeleteDataButton | Implement focus containment |
| No Escape key handler | PushConfirmDialog | Add keydown listener |
| Missing live regions | SyncButton, DashboardHeader | Add `aria-live="polite"` |
| No skip navigation | Dashboard | Add hidden skip link |
| Dropdown keyboard nav | SyncButton | Arrow key navigation |

### Medium Priority

| Issue | Location | Fix |
|-------|----------|-----|
| Unlabeled progress steps | SetupWizard | Add `aria-label="Step X of Y"` |
| Chart not accessible | ProgressionChart | Add data table/summary |
| No reduced motion support | Global CSS | Add `prefers-reduced-motion` |
| API key error not linked | WelcomeStep | Add `aria-describedby` |

---

## 7. Code Quality Issues

### Priority 1 (Address Soon)
1. **Web Locks API** - Replace localStorage-based mutex in `usePushDialog.ts`
2. **Data recovery strategy** - Implement in `useLocalStorage.ts`

### Priority 2 (Technical Debt)
3. Add error logging to empty catch blocks in `SetupWizard/index.tsx`
4. Expose granular selectors from `useProgram` hook
5. Extract common progression logic in `progression.ts`

### Priority 3 (Cleanup)
6. Move `deriveTierFromRole` to shared location
7. Extract `useSetupWizard` hook from SetupWizard component
8. Move constants outside component in SetupWizard
9. Standardize `weightUnit` naming

---

## 8. Testing Gaps

### Current Coverage
- 85 test files
- Strong unit test coverage for business logic (~80%)
- Integration tests for critical flows
- Component tests for UI interactions

### Missing
1. **True E2E tests** - Current "e2e" tests are component integration tests
2. **API payload verification** - Mocks may not match real API behavior
3. **Browser compatibility tests** - No cross-browser testing
4. **Performance tests** - No load testing for large history datasets

### Recommendations
1. Add Playwright for critical user flows (setup → sync → review → push)
2. Add contract tests for Hevy API integration
3. Test with 1000+ workout histories

---

## 9. Performance Considerations

### Optimizations Present
- Split localStorage (3 keys vs monolithic)
- Lazy loading for routes
- Memoization with `useMemo`/`useCallback`

### Concerns
1. **Synchronous JSON.parse** of large history data blocks main thread
2. **Chart rendering** with thousands of data points may lag
3. **Full re-renders** when progression updates

### Recommendations
1. Consider Web Workers for JSON parsing of history
2. Implement chart data downsampling
3. Add virtualization for large workout lists

---

## 10. Deployment Checklist

### Before Release

- [ ] Fix weight unit conversion bug
- [ ] Add QuotaExceededError handling
- [ ] Implement data corruption recovery
- [ ] Add push/sync mutex
- [ ] Add old storage format migration (if applicable)
- [ ] Add focus traps to all modals
- [ ] Add `prefers-reduced-motion` support
- [ ] Test with 500+ workout history
- [ ] Verify CSP is strict enough

### Nice to Have

- [ ] Add Playwright E2E tests
- [ ] Implement history pruning
- [ ] Add sessionStorage option for API key
- [ ] Add skip navigation link
- [ ] Add chart accessibility summary

---

## 11. Gemini's Assessment Summary

> **Verdict:** The codebase is high quality. Address the **storage corruption risk** and **history performance** before a major public release.

**Top Risks Identified:**
1. Data Loss on Corruption - `useLocalStorage` reverting to default state
2. Performance - Synchronous JSON.parse of unbounded history
3. Security - Plaintext API key requires strict CSP

**Key Positives:**
- Excellent Facade pattern and Hook injection
- Strong API retry logic and rate-limit handling
- Strict TypeScript and modular design

---

## Appendix: Files Requiring Changes

### Critical
- `src/hooks/useLocalStorage.ts` - Quota handling, corruption recovery
- `src/hooks/useConfigStorage.ts` - Weight unit conversion

### High Priority
- `src/hooks/usePushDialog.ts` - Push/sync mutex
- `src/App.tsx` or startup - Old storage migration

### Accessibility
- `src/components/Dashboard/PushConfirmDialog.tsx` - Focus trap, Escape key
- `src/components/Settings/DeleteDataButton.tsx` - Focus trap
- `src/components/Dashboard/SyncButton.tsx` - Keyboard navigation, live region
- `src/index.css` - Reduced motion support

---

*Report generated from comprehensive code review, security audit, accessibility audit, and edge case analysis.*
