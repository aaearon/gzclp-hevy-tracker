# High & Medium Priority Fixes Implementation Plan

**Date:** 2026-01-11
**Goal:** Implement remaining high and medium priority fixes before release

## Phases

### Phase 1: Consolidate weight validation limits [H6] - pending
- **Files:**
  - `src/lib/constants.ts` - Add MAX_WEIGHT_LIMITS constant
  - `src/utils/validation.ts` - Use constant
  - `src/components/common/WeightInput.tsx` - Use constant
- **Action:** Consolidate to 500kg/1100lbs across all validation
- **Effort:** 30 min
- **Status:** pending

### Phase 2: API key password field [M1] - pending
- **Files:**
  - `src/components/SetupWizard/WelcomeStep.tsx` - Add password toggle
  - `src/components/Settings/index.tsx` - Check if API key display needs same treatment
- **Action:** Change input type to password with visibility toggle
- **Effort:** 30 min
- **Status:** pending

### Phase 3: Block import from newer version [M6] - pending
- **Files:**
  - `src/lib/data-import.ts` - Block instead of warn for newer versions
- **Action:** Return error for imports from future versions
- **Effort:** 15 min
- **Status:** pending

### Phase 4: Role change orphans progression data [H4] - pending
- **Files:**
  - `src/hooks/useConfigStorage.ts` - Add role change detection
  - `src/hooks/useProgressionStorage.ts` - Add removeProgressionKeys function
- **Action:** Clean up old progression keys when role changes, create new ones
- **Effort:** 1.5h
- **Status:** pending

### Phase 5: Request cancellation on unmount [H5] - pending
- **Files:**
  - `src/hooks/useSyncFlow.ts` - Add AbortController
  - `src/hooks/usePushDialog.ts` - Add AbortController
  - `src/lib/hevy-client.ts` - Accept AbortSignal
- **Action:** Pass AbortSignal to API calls, abort on unmount
- **Effort:** 1h
- **Status:** pending

### Phase 6: Timezone fix for "Days Since" [M5] - pending
- **Files:**
  - `src/utils/stats.ts` - Use calendar date comparison
- **Action:** Calculate using UTC calendar days, not millisecond diff
- **Effort:** 30 min
- **Status:** pending

### Phase 7: T3 pagination for 20+ exercises [M4] - pending
- **Files:**
  - `src/components/Dashboard/T3Overview.tsx` - Add "Show more" button
- **Action:** Show 9 exercises by default, expand to show all
- **Effort:** 30 min
- **Status:** pending

### Phase 8: Extract data migration from Dashboard [H1] - pending
- **Files:**
  - `src/hooks/useDataMaintenance.ts` - NEW: Extract migration logic
  - `src/components/Dashboard/index.tsx` - Remove migration useEffects
  - `src/router.tsx` - Run maintenance at app startup
- **Action:** Move auto-import and AMRAP backfill to startup hook
- **Effort:** 2h
- **Status:** pending

### Phase 9: Wire up ProgramContext [H2] - pending
- **Files:**
  - `src/router.tsx` - Add ProgramProvider wrapper
  - `src/contexts/ProgramContext.tsx` - Verify implementation
- **Action:** Wrap RootLayout with ProgramProvider
- **Effort:** 30 min
- **Status:** pending

### Phase 10: Run tests and verify - pending
- **Action:** `npm test && npm run lint`
- **Status:** pending

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Consolidate to 500kg limit | More reasonable for human lifters, matches WeightInput |
| Password toggle vs always-hidden | Better UX - users can verify their key |
| 9 exercises default | 3x3 grid fits well on all screens |
| Show more vs virtualization | Simpler, adequate for typical user (<50 exercises) |
