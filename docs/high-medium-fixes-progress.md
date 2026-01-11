# High & Medium Priority Fixes Progress Log

## Session: 2026-01-11

### Phase 1: Consolidate weight validation limits [H6] - DONE
- [x] Add MAX_WEIGHT_LIMITS to constants.ts (500kg/1100lbs)
- [x] Update validation.ts to use constant
- [x] Update WeightInput.tsx to use constant

### Phase 2: API key password field [M1] - DONE
- [x] Update WelcomeStep.tsx with password input + toggle
- [x] Added eye icon toggle for visibility

### Phase 3: Block import from newer version [M6] - DONE
- [x] Update data-import.ts to throw error for newer versions

### Phase 4: Role change orphans progression data [H4] - DONE
- [x] Updated useExerciseManagement.ts with role change handling
- [x] Added getProgressionKeysForRole helper function
- [x] updateExercise now cleans up old keys and creates new ones on role change
- [x] removeExercise now removes correct progression keys based on role

### Phase 5: Request cancellation on unmount [H5] - DONE
- [x] Update hevy-client.ts to accept optional AbortSignal on all methods
- [x] Update useProgression.ts with AbortController + isMountedRef pattern
- [x] API requests now properly cancelled on component unmount

### Phase 6: Timezone fix for "Days Since" [M5] - DONE
- [x] Update calculateDaysSinceLastWorkout in stats.ts
- [x] Now uses UTC calendar day comparison instead of millisecond diff

### Phase 7: T3 pagination for 20+ exercises [M4] - DONE
- [x] Add "Show more" button to T3Overview.tsx
- [x] Shows 9 exercises by default (3x3 grid)
- [x] "Show X more exercises" / "Show less" toggle

### Phase 8: Extract data migration from Dashboard [H1] - DONE
- [x] Created src/hooks/useDataMaintenance.ts hook
- [x] Extracted auto-import history useEffect from Dashboard
- [x] Extracted AMRAP backfill useEffect from Dashboard
- [x] Removed unused imports from Dashboard (progressionHistory, setProgressionHistory)
- [x] Added useDataMaintenance to router.tsx via AppProviders component
- [x] Added console.warn logging to catch blocks for debugging (per Gemini review)

### Phase 9: Wire up ProgramContext [H2] - DONE
- [x] Created AppProviders component in router.tsx
- [x] ProgramProvider now wraps all routes with program state
- [x] useProgramContext now available to all child components
- [x] Fixed "Cannot update component while rendering" warning in useLocalStorage.ts
  - Issue: dispatchEvent was called synchronously inside setState callback
  - Fix: Wrapped dispatchEvent in queueMicrotask to defer sync events

### Phase 10: Verification - DONE
- [x] All 1250 tests pass
- [x] Pre-existing lint errors in other files (not related to changes)

## Files Modified

1. `src/lib/constants.ts` - Added MAX_WEIGHT_LIMITS constant
2. `src/utils/validation.ts` - Use MAX_WEIGHT_LIMITS instead of inline values
3. `src/components/common/WeightInput.tsx` - Use MAX_WEIGHT_LIMITS
4. `src/components/SetupWizard/WelcomeStep.tsx` - Password input with toggle
5. `src/lib/data-import.ts` - Block import from newer versions
6. `src/hooks/useExerciseManagement.ts` - Role change progression cleanup
7. `src/lib/hevy-client.ts` - AbortSignal support on all methods
8. `src/hooks/useProgression.ts` - AbortController + isMountedRef pattern
9. `src/utils/stats.ts` - UTC calendar day comparison for Days Since
10. `src/components/Dashboard/T3Overview.tsx` - Show more/less for 20+ exercises
11. `src/hooks/useDataMaintenance.ts` - NEW: Extracted migration logic from Dashboard
12. `src/router.tsx` - Added AppProviders with useDataMaintenance and ProgramProvider
13. `src/components/Dashboard/index.tsx` - Removed migration useEffects and unused imports
14. `src/hooks/useLocalStorage.ts` - Fixed setState-during-render warning by deferring dispatchEvent

## Test Files Updated

1. `tests/unit/validation.test.ts` - Updated max weight tests to 500kg/1100lbs
2. `tests/unit/import.test.ts` - Updated to expect error for newer versions
3. `tests/unit/hooks/useExerciseManagement.test.tsx` - Added role change tests
4. `tests/unit/setup-wizard-weight-fix.test.tsx` - Updated API key selector
5. `tests/integration/setup-wizard-e2e.test.tsx` - Updated API key selector
6. `tests/integration/setup-wizard.test.tsx` - Updated API key selector

## Notes

- All high-priority fixes (H1-H6) are now complete
- Medium-priority fixes (M1, M4, M5, M6) are also complete
- Pre-existing lint errors exist in other files (deprecated props, exhaustive-deps, etc.)
