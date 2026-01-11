# Task Plan: Fix Export/Import Critical & High Issues

**Created:** 2026-01-10
**Completed:** 2026-01-10
**Updated:** 2026-01-10 (Added security and UX improvements)
**Goal:** Fix critical and high severity issues in the export/import data functionality to ensure data integrity and prevent runtime crashes.

---

## Issues Fixed

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| 1 | CRITICAL | Atomicity Risk - sequential writes can leave inconsistent state | `useDataPersistence.ts` | FIXED |
| 2 | HIGH | Shallow Validation - only top-level fields checked | `data-import.ts` | FIXED |
| 3 | HIGH | Missing Field Defaults - old backups break app | `data-import.ts` | FIXED |

---

## Phases

### Phase 1: Add Missing Field Defaults
- **Status:** `complete`
- **Files:** `src/lib/data-import.ts`, `tests/unit/import.test.ts`
- **Tasks:**
  - [x] Add defaults for: pendingChanges, t3Schedule, totalWorkouts, mostRecentWorkoutDate, needsPush, lastSync
  - [x] Write tests for missing field scenarios (7 new tests)
  - [x] Verify existing tests still pass

### Phase 2: Deep Validation with Zod
- **Status:** `complete`
- **Files:** `src/lib/data-import.ts`, `tests/unit/import.test.ts`
- **Tasks:**
  - [x] Check if zod is already installed (zod@4.3.4 available)
  - [x] Create zod schema matching GZCLPState structure
  - [x] Replace shallow validation with zod schema validation
  - [x] Add tests for malformed nested data (8 new tests)

### Phase 3: Atomic Import with Rollback
- **Status:** `complete`
- **Files:** `src/hooks/useDataPersistence.ts`
- **Tasks:**
  - [x] Capture current state before import
  - [x] Wrap writes in try-catch
  - [x] Restore previous state on failure
  - [x] Add tests for rollback scenario (3 new tests)
  - [x] Update callers to handle ImportResult

### Phase 4: Final Verification
- **Status:** `complete`
- **Tasks:**
  - [x] Run full test suite (1237 tests pass)
  - [x] Run linter (0 errors in changed files)
  - [x] Update documentation

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Use zod for schema validation | Type-safe, good error messages, already installed |
| Use `.loose()` instead of `.passthrough()` | `.passthrough()` deprecated in zod 4 |
| Rollback strategy: snapshot config and progression before import | Simple, reliable restoration on failure |
| ImportResult return type | Allows callers to handle errors gracefully |
| Apply defaults before validation | Ensures backwards compatibility with old backups |

---

## Files Modified

- `src/lib/data-import.ts` - Added zod schema validation and field defaults
- `src/hooks/useDataPersistence.ts` - Added atomic import with rollback
- `src/hooks/useProgram.ts` - Updated importState return type
- `src/components/Settings/index.tsx` - Handle ImportResult
- `tests/unit/import.test.ts` - Added 15 new tests
- `tests/unit/hooks/useDataPersistence.test.tsx` - Added 3 new tests

---

## Test Results

- Total tests: 1239 passing
- New tests added: 20 (18 + 2 for security)
- All import/export tests: 44 passing

---

## Additional Improvements (2026-01-10)

### Phase 5: Security - Exclude API Key from Export
- **Status:** `complete`
- **Files:** `src/lib/data-export.ts`, `tests/unit/export.test.ts`, `tests/integration/data-transfer.test.tsx`
- **Tasks:**
  - [x] Modify `serializeState()` to exclude apiKey from export (set to empty string)
  - [x] Add security comment documenting the change
  - [x] Update export tests to verify apiKey is excluded
  - [x] Update integration test for export/import cycle

### Phase 6: UX - Restore from Backup in Welcome Step
- **Status:** `complete`
- **Files:** `src/components/SetupWizard/WelcomeStep.tsx`, `src/components/SetupWizard/index.tsx`, `src/types/state.ts`
- **Tasks:**
  - [x] Add 'restore' option to RoutineSourceMode type
  - [x] Add file input and "Restore from Backup" button to WelcomeStep
  - [x] Handle file validation and parsing in WelcomeStep
  - [x] Pass restoredState via onComplete callback
  - [x] Handle restore path in SetupWizard to merge API key and complete setup

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Export empty string for apiKey | Prevents credential exposure in backup files |
| Require API key validation before restore | Ensures user has valid Hevy connection |
| Merge new apiKey with restored state | Backups work across devices/browsers |
| Show program name after successful load | User confirmation the right file was selected |
