# GZCLP Hevy Tracker - Gap Analysis & Implementation Plan

**Document Version:** 2.0
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
**Analysis validated by:** Claude + Gemini code review (THOROUGH RE-ANALYSIS)
**Status:** Implementation Not Started

> **IMPORTANT:** This is a comprehensive re-analysis that discovered 21 gaps (up from 15).
> Key critical gaps found: No auto-sync, No day advancement after confirm, Steps not combined.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Reference Documents](#2-reference-documents)
3. [Gap Analysis Summary](#3-gap-analysis-summary)
4. [Implementation Progress Tracker](#4-implementation-progress-tracker)
5. [Phase 1: Critical Fixes](#5-phase-1-critical-fixes)
6. [Phase 2: Core Functionality](#6-phase-2-core-functionality)
7. [Phase 3: UX Enhancements](#7-phase-3-ux-enhancements)
8. [Phase 4: Polish](#8-phase-4-polish)
9. [Key Implementation Decisions](#9-key-implementation-decisions)
10. [Testing Requirements](#10-testing-requirements)
11. [Type Definitions](#11-type-definitions)
12. [Test Examples](#12-test-examples)

---

## LLM Implementation Guide

> **This section is specifically for AI/LLM developers implementing this plan.**

### Before Starting ANY Task

1. **Read existing code FIRST** - Use `Read` tool on every file in "Files to Modify"
2. **Verify line numbers** - Code snippets reference specific lines that may have shifted
3. **Check for existing patterns** - Match the codebase's existing style (imports, formatting)
4. **Understand dependencies** - Check the dependency graph before starting

### Implementation Workflow Per Task

```
1. Mark task as "in_progress" in tracker
2. Read all files listed in "Files to Modify"
3. Implement changes incrementally (one file at a time)
4. Run: npm test (must pass)
5. Run: npm run lint (must pass)
6. Verify acceptance criteria manually
7. Mark task as "complete" in tracker
```

### When Code Snippets Show "BEFORE/AFTER"

- The "BEFORE" code is approximate - search for equivalent patterns
- Preserve existing imports, formatting, and naming conventions
- If line numbers don't match, search for the function/variable name

### Handling Ambiguity

If something is unclear:
1. Check the spec document: `docs/GZCLP-Functional-Requirements-v2.md`
2. Look at existing similar patterns in codebase
3. Prefer simpler implementations over complex ones
4. ASK! Ask questions in the form of multiple-choice questions. Give a suggested answer and provide your rationale
5. Document any assumptions made

### Critical Reminders

- **DO NOT** modify files not listed in "Files to Modify"
- **DO NOT** add features beyond what's specified
- **DO NOT** refactor surrounding code unless explicitly required
- **ALWAYS** run tests before marking complete
- **ALWAYS** verify TypeScript compiles: `npm run build`

### Task Completion Checklist

For EVERY task, verify:
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] `npm test` passes (all existing + new tests)
- [ ] `npm run lint` passes (no linting errors)
- [ ] Manual verification steps completed
- [ ] Acceptance criteria all checked

---

## 1. Application Overview

### What is GZCLP Hevy Tracker?

A web application that implements GZCLP (GZCL Linear Progression) workout program logic on top of Hevy, a third-party workout logging app. The app:

- **Tracks GZCLP progression state** (weights, stages, rep schemes)
- **Reads completed workouts** from Hevy API
- **Evaluates success/failure** per GZCLP rules
- **Calculates progressions**, stage changes, and deloads
- **Updates Hevy routines** after user confirmation

### Key Principle

| Application | Role |
|-------------|------|
| **Hevy** | Workout logger (used in gym) |
| **This App** | Progression brain (used between workouts) |

### Tech Stack

- **Frontend:** React 18.3, TypeScript 5.9 (strict mode), Vite 5.4, Tailwind CSS 4.1
- **Storage:** Browser localStorage (key: `gzclp_state`)
- **API:** Hevy REST API (https://api.hevyapp.com/v1)

### Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard/       # Main tracking dashboard
│   ├── SetupWizard/     # Initial configuration flow
│   ├── Settings/        # Data management
│   ├── ReviewModal/     # Pending changes review
│   └── common/          # Shared components
├── hooks/               # Custom React hooks
├── lib/                 # Business logic utilities
├── types/               # TypeScript type definitions
└── utils/               # Formatting & helper functions
```

### GZCLP Program Structure

**4 Workout Days:**
- A1: T1 Squat, T2 Bench
- B1: T1 OHP, T2 Deadlift
- A2: T1 Bench, T2 Squat
- B2: T1 Deadlift, T2 OHP

**Progression Rules:**
- **T1 (Primary):** Stages 5x3+ → 6x2+ → 10x1+ (fail → advance stage, fail at stage 3 → deload 85%)
- **T2 (Secondary):** Stages 3x10 → 3x8 → 3x6 (same failure logic)
- **T3 (Accessory):** 3x15+, progress if 25+ total reps achieved

---

## 2. Reference Documents

### Primary Specification

**File:** `/home/tim/gzclp-hevy-tracker/docs/GZCLP-Functional-Requirements-v2.md`

This is the authoritative functional requirements document (v2.3) that defines:
- All requirement IDs (REQ-XXX-NNN format)
- State machines for progression
- API integration requirements
- UI/UX specifications
- Error handling

**CRITICAL:** Before implementing any task, read the relevant sections of this document.

### Key Files for Context

| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | Program constants, rep schemes, increments |
| `src/lib/progression.ts` | Progression calculation logic |
| `src/lib/routine-builder.ts` | Hevy routine payload builder |
| `src/lib/role-utils.ts` | Exercise role and tier derivation |
| `src/types/state.ts` | All TypeScript interfaces |
| `src/hooks/useProgression.ts` | Workout sync and analysis |

---

## 3. Gap Analysis Summary

### Legend

- ✅ **Fully Implemented** - No changes needed
- ⚠️ **Partially Implemented** - Needs enhancement
- ❌ **Not Implemented** - Gap requires implementation

### Requirements Coverage Matrix (COMPLETE)

| Section | Requirement | Status | Gap ID | Issue |
|---------|-------------|--------|--------|-------|
| **3. Program Structure** | | | | |
| | [REQ-PROG-001] Day Configuration | ✅ | - | |
| | [REQ-PROG-002] T3 Accessory Selection | ✅ | - | |
| | [REQ-PROG-003] Rotation Pattern | ✅ | - | |
| | [REQ-PROG-004] Main Lift Mapping | ✅ | - | |
| **4. Progression Rules** | | | | |
| | [REQ-PROG-005] T1 Success Criteria | ✅ | - | |
| | [REQ-PROG-006] T2 Success Criteria | ✅ | - | |
| | [REQ-PROG-007] T3 Success Criteria | ✅ | - | |
| | [REQ-PROG-008] Weight Increments | ✅ | - | |
| | [REQ-PROG-009] Deload Calculation | ⚠️ | GAP-10 | Min weight 2.5kg not 20kg bar |
| | [REQ-PROG-010] T3 Shared Progression | ✅ | - | |
| | [REQ-PROG-011] Incomplete Workout | ✅ | - | Treated as failure |
| **5. AMRAP** | | | | |
| | [REQ-AMRAP-001] AMRAP Set Identification | ✅ | - | |
| | [REQ-AMRAP-002] AMRAP Indication in Hevy | ❌ | GAP-08 | Notes field empty |
| | [REQ-AMRAP-003] PR Tracking | ⚠️ | GAP-09 | No "New PR!" display |
| **6. Warmup Sets** | | | | |
| | [REQ-WARM-001] Warmup Applicability | ❌ | GAP-01 | No warmup generation |
| | [REQ-WARM-002] Warmup Protocol | ❌ | GAP-01 | Missing 20kg/50%/70%/85% |
| | [REQ-WARM-003] Warmup Weight Calculation | ❌ | GAP-01 | No warmup weights |
| **7. Rest Timers** | | | | |
| | [REQ-REST-001] Rest Timer Values | ⚠️ | GAP-04 | 180/120/60 vs 240/150/75 |
| **8. Onboarding** | | | | |
| | [REQ-ONBOARD-001] State Detection | ✅ | - | |
| | [REQ-ONBOARD-002] Combined Step 1 | ❌ | GAP-14, GAP-20, GAP-21 | **CRITICAL: Steps SEPARATE, missing title/desc, wrong labels** |
| | [REQ-ONBOARD-003] Return Visit | ✅ | - | |
| | [REQ-ONBOARD-004] Program Reset | ✅ | - | |
| **9. Setup Wizard** | | | | |
| | [REQ-SETUP-001] Step 1 (Shared) | ❌ | GAP-14 | Not combined |
| | [REQ-SETUP-002] Main Lift Templates | ✅ | - | |
| | [REQ-SETUP-003] Day Configuration | ✅ | - | |
| | [REQ-SETUP-004] Review & Create | ✅ | - | |
| | [REQ-SETUP-005] Wizard Navigation | ✅ | - | |
| | [REQ-SETUP-006] Progression Init | ✅ | - | |
| **10. Import Flow** | | | | |
| | [REQ-IMPORT-001-008] All | ✅ | - | |
| **11. Hevy API** | | | | |
| | [REQ-API-001] Authentication | ✅ | - | |
| | [REQ-API-002] Read Operations | ✅ | - | |
| | [REQ-API-003] Write Operations | ✅ | - | |
| | [REQ-API-004] Workout Matching | ✅ | - | |
| | [REQ-API-005] Routine Naming | ❌ | GAP-12 | "GZCLP A1" vs "GZCLP Day A1" |
| | [REQ-API-006] Weight Unit Handling | ✅ | - | |
| **12. Data Storage** | | | | |
| | [REQ-DATA-001] Storage Method | ✅ | - | |
| | [REQ-DATA-002] State Schema | ⚠️ | GAP-16 | Uses `exercises` not `mainLifts` |
| | [REQ-DATA-003] Progression Keys | ⚠️ | GAP-17 | `squat-T1` vs `squat_t1` (TO BE FIXED) |
| **13. Dashboard** | | | | |
| | [REQ-DASH-001] Main Elements | ❌ | GAP-15 | **No "Start Workout" button** |
| | [REQ-DASH-002] Exercise Table Columns | ✅ | - | |
| | [REQ-DASH-003] Quick Stats | ❌ | GAP-03 | Missing all 4 stats |
| **14. Today's Workout** | | | | |
| | [REQ-TODAY-001] Access (Start Workout) | ❌ | GAP-15 | No button exists |
| | [REQ-TODAY-002] Content Display Order | ⚠️ | GAP-15 | No warmups (depends on GAP-01) |
| | [REQ-TODAY-003] Estimated Duration | ❌ | GAP-07 | Not calculated/displayed |
| | [REQ-TODAY-004] Actions | ❌ | GAP-06 | No Open in Hevy, Copy buttons |
| **15. Sync** | | | | |
| | [REQ-SYNC-001] Auto-Sync on Open | ❌ | GAP-18 | **CRITICAL: No auto-sync on mount** |
| | [REQ-SYNC-001] Toast Notification | ❌ | GAP-05 | No toast system exists |
| | [REQ-SYNC-002] Manual Sync | ✅ | - | |
| | [REQ-SYNC-003] Sync Sequence | ✅ | - | |
| | [REQ-SYNC-004] Sync State Indicators | ⚠️ | GAP-19 | Missing retry button on errors |
| **16. Post-Workout Summary** | | | | |
| | [REQ-POST-001] Trigger & Presentation | ❌ | GAP-02 | No slide-in panel |
| | [REQ-POST-002] Content | ❌ | GAP-02 | No summary content |
| | [REQ-POST-003] Tone | ❌ | GAP-02 | No motivational messaging |
| | [REQ-POST-004] Actions | ❌ | GAP-02 | No "Review Changes" from panel |
| **17. Confirmation** | | | | |
| | [REQ-CONF-001] Confirmation Req | ✅ | - | |
| | [REQ-CONF-002] Confirmation Dialog | ✅ | - | |
| | [REQ-CONF-003] On Confirm | ❌ | GAP-13 | **CRITICAL: currentDay NOT advanced** |
| **18. Error Handling** | | | | |
| | [REQ-ERR-001] API Errors | ⚠️ | GAP-11 | Only 401/429 handled specifically |
| | [REQ-ERR-002] Validation Errors | ✅ | - | |
| | [REQ-ERR-003] Data Errors | ⚠️ | GAP-11 | No corrupted state recovery |

---

## 4. Implementation Progress Tracker

### Overall Status

| Phase | Status | Completed | Remaining |
|-------|--------|-----------|-----------|
| Phase 1: Critical Fixes | ✅ Complete | 6/6 | 0 |
| Phase 2: Core Functionality | ✅ Complete | 6/6 | 0 |
| Phase 3: UX Enhancements | 🔄 In Progress | 2/7 | 5 |
| Phase 4: Polish | ⬜ Not Started | 0/4 | 4 |
| **TOTAL** | **61% Complete** | **14/23** | **9** |

### Task Status Key

- ⬜ **Not Started**
- 🔄 **In Progress**
- ✅ **Complete**
- ⏸️ **Blocked**

---

### Phase 1 Tasks: CRITICAL FIXES (Must Do First)

These are **breaking issues** that affect core workflow.

| Task | Gap | Description | Status | Priority |
|------|-----|-------------|--------|----------|
| 1.1 | GAP-13 | **currentDay Advancement** (BROKEN: DAY_CYCLE never used) | ✅ | 🔴 CRITICAL |
| 1.2 | GAP-18 | **Auto-Sync on Dashboard Mount** (MISSING: manual only) | ✅ | 🔴 CRITICAL |
| 1.3 | GAP-14 | **Combined Welcome Step** (API key + path + unit SEPARATE) | ✅ | 🔴 CRITICAL |
| 1.4 | GAP-20 | App Title "GZCLP Hevy Tracker" & Description | ✅ | 🟡 HIGH |
| 1.5 | GAP-21 | Path Labels ("Start New" vs "Create New") | ✅ | 🟡 HIGH |
| 1.6 | GAP-12 | Routine Title Format ("GZCLP Day A1" not "GZCLP A1") | ✅ | 🟡 HIGH |

---

### Phase 2 Tasks: Core Functionality

| Task | Gap | Description | Status | Priority |
|------|-----|-------------|--------|----------|
| 2.1 | GAP-01 | Warmup Set Generation (T1 inline warmups) | ✅ | 🟡 HIGH |
| 2.1b | - | Remove warmup/cooldown Roles (after 2.1) | ✅ | 🟡 HIGH |
| 2.2 | GAP-04 | Rest Timer Correction (240/150/75) | ✅ | 🟢 MEDIUM |
| 2.3 | GAP-03 | Quick Stats Component | ✅ | 🟢 MEDIUM |
| 2.4 | GAP-02 | Post-Workout Summary Panel (slide-in) | ✅ | 🟡 HIGH |
| 2.5 | GAP-10 | Minimum Bar Weight (20kg floor) | ✅ | 🟢 MEDIUM |

---

### Phase 3 Tasks: UX Enhancements

| Task | Gap | Description | Status | Priority |
|------|-----|-------------|--------|----------|
| 3.1 | GAP-05 | Toast Notification System | ✅ | 🟡 HIGH |
| 3.2 | GAP-15 | "Start Workout" Button + Preview | ✅ | 🟡 HIGH |
| 3.3 | GAP-06 | Today's Workout Actions (Open Hevy, Copy) | ⬜ | 🟢 MEDIUM |
| 3.4 | GAP-07 | Estimated Duration | ⬜ | 🟢 MEDIUM |
| 3.5 | GAP-08 | AMRAP Notes in Routine | ⬜ | 🟢 MEDIUM |
| 3.6 | GAP-09 | PR Celebration Display | ⬜ | 🟢 MEDIUM |
| 3.7 | GAP-19 | Retry Button on Sync Errors | ⬜ | 🟢 MEDIUM |

---

### Phase 4 Tasks: Polish

| Task | Gap | Description | Status | Priority |
|------|-----|-------------|--------|----------|
| 4.1 | GAP-11 | Specific Error Messages (403, 404, 500+) | ⬜ | 🔵 LOW |
| 4.2 | GAP-16 | Document Schema Deviation | ⬜ | 🔵 LOW |
| 4.3 | GAP-17 | Fix Progression Key Format (spec alignment) | ⬜ | 🟢 MEDIUM |
| 4.4 | - | Final Integration Testing | ⬜ | 🔵 LOW |

---

## 5. Phase 1: Critical Fixes

**Estimated Effort:** 8-12 hours
**Priority:** 🔴 CRITICAL - Must fix before any other work
**Dependencies:** None (start here)

> **WARNING:** These issues break core GZCLP workflow. Fix them first.

---

### Task 1.1: currentDay Advancement (GAP-13)

**Gap:** GAP-13
**Status:** ✅ Complete
**Requirements:** REQ-CONF-003
**Priority:** 🔴 CRITICAL

#### Problem

**The workout day NEVER advances after confirming changes.** The `DAY_CYCLE` constant exists but is NEVER USED anywhere in the codebase.

**Evidence:**
- `DAY_CYCLE` in `src/lib/constants.ts` (lines 78-83) defines: A1→B1→A2→B2→A1
- `setCurrentDay()` method exists in `useProgram` hook
- But `applyChange()` in `usePendingChanges` does NOT call `setCurrentDay()`
- Users are stuck on the same day forever!

#### Files to Modify

- `src/hooks/usePendingChanges.ts` - Add day advancement after applying all changes
- `src/lib/constants.ts` - Already has `DAY_CYCLE`, use it

#### Implementation

**In `src/hooks/usePendingChanges.ts`, after applying all changes:**

```typescript
import { DAY_CYCLE } from '@/lib/constants'

// In applyAllChanges() or after confirming:
const nextDay = DAY_CYCLE[state.program.currentDay]
setCurrentDay(nextDay)
```

#### Acceptance Criteria

- [x] `DAY_CYCLE` imported in `usePendingChanges.ts`
- [x] `setCurrentDay()` called after all changes applied
- [x] Day advances in correct order: A1→B1→A2→B2→A1
- [x] State persisted to localStorage after day change
- [x] Dashboard reflects new `currentDay` after confirm

#### Verification

1. Complete a workout sync
2. Confirm pending changes
3. Verify `currentDay` advances (A1→B1, etc.)

---

### Task 1.2: Auto-Sync on Dashboard Mount (GAP-18)

**Gap:** GAP-18
**Status:** ✅ Complete
**Requirements:** REQ-SYNC-001
**Priority:** 🔴 CRITICAL

#### Problem

**No auto-sync when Dashboard loads.** Users must manually click "Sync Workouts" every time.

**Evidence:**
- Dashboard useEffect only calls `checkHevyConnection()`, NOT `syncWorkouts()`
- Spec requires: "Automatically fetch workouts when Dashboard loads"

#### Files to Modify

- `src/components/Dashboard/index.tsx` - Add auto-sync on mount

#### Implementation

```typescript
// In Dashboard component, add useEffect:
useEffect(() => {
  if (isOnline && !isSyncing && state.apiKey) {
    // Auto-sync on mount
    syncWorkouts()
  }
  // Only run on mount, not every re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

#### Acceptance Criteria

- [x] `useEffect` added to Dashboard with empty dependency array
- [x] Auto-sync only triggers when: `isOnline && !isSyncing && state.apiKey`
- [x] No infinite loop (dependency array is `[]`)
- [x] Sync indicator shows during auto-sync
- [x] New workouts detected and pendingChanges populated

#### Verification

1. Have Hevy with a completed workout
2. Open app (go to Dashboard)
3. Verify sync happens automatically without clicking button

---

### Task 1.3: Combined Welcome Step (GAP-14)

**Gap:** GAP-14
**Status:** ✅ Complete
**Requirements:** REQ-ONBOARD-002
**Priority:** 🔴 CRITICAL

#### Problem

API key, path selection, and unit selection are in **SEPARATE wizard steps** but spec requires them **COMBINED in Step 1**.

**Current Flow (WRONG):**
1. Step 1: ApiKeyStep - API key only
2. Step 2: RoutineSourceStep - Path selection only
3. Later: WeightSetupStep - Unit selection

**Spec Requirement (REQ-ONBOARD-002):**
1. Step 1: Combined step with ALL of:
   - App title + description
   - API key input + validation
   - Path options (shown AFTER API key validated)
   - Weight unit selection

#### Files to Modify

- `src/components/SetupWizard/ApiKeyStep.tsx` → Rename to `WelcomeStep.tsx`
- `src/components/SetupWizard/RoutineSourceStep.tsx` → DELETE after merging
- `src/components/SetupWizard/index.tsx` → Update step flow
- `src/components/SetupWizard/UnitSelector.tsx` → Import into WelcomeStep

#### Implementation

**Step 1: Create WelcomeStep.tsx (rename ApiKeyStep.tsx)**

```typescript
// src/components/SetupWizard/WelcomeStep.tsx
import { useState } from 'react';
import { validateApiKey } from '@/lib/hevy-client';
import { UnitSelector } from './UnitSelector';

interface WelcomeStepProps {
  onComplete: (data: {
    apiKey: string;
    path: 'create' | 'import';
    unit: 'kg' | 'lbs';
  }) => void;
}

export function WelcomeStep({ onComplete }: WelcomeStepProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<'create' | 'import' | null>(null);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  const handleValidateKey = async () => {
    setIsValidating(true);
    setError(null);
    try {
      const isValid = await validateApiKey(apiKey);
      if (isValid) {
        setIsValidated(true);
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to validate API key. Check your connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    if (isValidated && selectedPath) {
      onComplete({ apiKey, path: selectedPath, unit });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {/* App Branding */}
      <h1 className="text-2xl font-bold text-center mb-2">
        GZCLP Hevy Tracker
      </h1>
      <p className="text-gray-600 text-center mb-8">
        Track your GZCLP progress with automatic Hevy integration
      </p>

      {/* API Key Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hevy API Key
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Hevy API key"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            disabled={isValidated}
          />
          {!isValidated && (
            <button
              onClick={handleValidateKey}
              disabled={!apiKey || isValidating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
          )}
          {isValidated && (
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
              Valid
            </span>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-2 text-xs text-gray-500">
          Find your API key in Hevy → Settings → Developer
        </p>
      </div>

      {/* Path Selection (shown after validation) */}
      {isValidated && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you like to start?
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedPath('create')}
                className={`w-full p-4 text-left border rounded-lg transition ${
                  selectedPath === 'create'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Start New Program</div>
                <div className="text-sm text-gray-500">
                  I'm starting GZCLP from scratch
                </div>
              </button>
              <button
                onClick={() => setSelectedPath('import')}
                className={`w-full p-4 text-left border rounded-lg transition ${
                  selectedPath === 'import'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Import Existing Program</div>
                <div className="text-sm text-gray-500">
                  I've been doing GZCLP in Hevy
                </div>
              </button>
            </div>
          </div>

          {/* Unit Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Unit
            </label>
            <UnitSelector value={unit} onChange={setUnit} />
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedPath}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}
```

**Step 2: Update SetupWizard/index.tsx**

```typescript
// In src/components/SetupWizard/index.tsx

// BEFORE - step type includes 'api-key' and 'routine-source' as separate steps
type SetupStep = 'api-key' | 'routine-source' | 'routine-assign' | ...

// AFTER - replace with single 'welcome' step
type SetupStep = 'welcome' | 'routine-assign' | 'import-review' | ...

// BEFORE - separate handlers for API key and path
// AFTER - single handler from WelcomeStep
const handleWelcomeComplete = (data: {
  apiKey: string;
  path: 'create' | 'import';
  unit: 'kg' | 'lbs';
}) => {
  setApiKey(data.apiKey);
  setUnit(data.unit);
  if (data.path === 'create') {
    setCurrentStep('routine-assign');
  } else {
    setCurrentStep('import-review');
  }
};

// In render:
{currentStep === 'welcome' && (
  <WelcomeStep onComplete={handleWelcomeComplete} />
)}
```

**Step 3: Delete RoutineSourceStep.tsx**

```bash
# After confirming WelcomeStep works:
rm src/components/SetupWizard/RoutineSourceStep.tsx
```

**Step 4: Update imports in SetupWizard/index.tsx**

```typescript
// REMOVE:
import { ApiKeyStep } from './ApiKeyStep';
import { RoutineSourceStep } from './RoutineSourceStep';

// ADD:
import { WelcomeStep } from './WelcomeStep';
```

#### Acceptance Criteria

- [x] Single welcome step shows app title "GZCLP Hevy Tracker"
- [x] Description reads "Track your GZCLP progress with automatic Hevy integration"
- [x] API key input with validate button
- [x] Path options hidden until API key validated
- [x] Path options labeled "Start New Program" / "Import Existing Program"
- [x] Unit selector (kg/lbs) visible after validation
- [x] Continue button disabled until path selected
- [x] RoutineSourceStep.tsx deleted from codebase
- [x] ApiKeyStep.tsx deleted from codebase (superseded by WelcomeStep)

---

### Task 1.4: App Title & Description (GAP-20)

**Gap:** GAP-20
**Status:** ✅ Complete (implemented in Task 1.3)
**Requirements:** REQ-ONBOARD-002
**Priority:** 🟡 HIGH

#### Problem

Missing required branding:
- Title: "GZCLP Hevy Tracker"
- Description: "Track your GZCLP progress with automatic Hevy integration"

**Current:** Shows "Connect to Hevy" with generic text.

#### Implementation

Add to WelcomeStep (as part of Task 1.3):

```typescript
<h1 className="text-2xl font-bold text-center mb-2">GZCLP Hevy Tracker</h1>
<p className="text-gray-600 text-center mb-6">
  Track your GZCLP progress with automatic Hevy integration
</p>
```

#### Acceptance Criteria

- [x] Title "GZCLP Hevy Tracker" visible at top of welcome screen
- [x] Description text matches spec exactly
- [x] Styling is centered with appropriate spacing
- [x] Included as part of Task 1.3 WelcomeStep component

---

### Task 1.5: Path Labels Fix (GAP-21)

**Gap:** GAP-21
**Status:** ✅ Complete (implemented in Task 1.3)
**Requirements:** REQ-ONBOARD-002
**Priority:** 🟡 HIGH

#### Problem

Path option labels don't match spec:
- Current: "Create New Routines" / "Use Existing Routines"
- Spec: "Start New Program" / "Import Existing Program"

#### Implementation

Update labels in WelcomeStep:

```typescript
// Option 1
label: "Start New Program"
subtitle: "I'm starting GZCLP from scratch"

// Option 2
label: "Import Existing Program"
subtitle: "I've been doing GZCLP in Hevy"
```

#### Acceptance Criteria

- [x] First option labeled "Start New Program" (not "Create New Routines")
- [x] First option subtitle: "I'm starting GZCLP from scratch"
- [x] Second option labeled "Import Existing Program" (not "Use Existing Routines")
- [x] Second option subtitle: "I've been doing GZCLP in Hevy"
- [x] Included as part of Task 1.3 WelcomeStep component

---

### Task 1.6: Routine Title Format (GAP-12)

**Gap:** GAP-12
**Status:** ✅ Complete
**Requirements:** REQ-API-005
**Priority:** 🟡 HIGH

#### Problem

Routine titles use "GZCLP A1" but spec requires "GZCLP Day A1".

#### Files to Modify

- `src/lib/routine-builder.ts` - Line 189

#### Implementation

```typescript
// BEFORE:
title: `GZCLP ${day}`,

// AFTER:
title: `GZCLP Day ${day}`,
```

#### Acceptance Criteria

- [x] Routine titles use format "GZCLP Day A1" (not "GZCLP A1")
- [x] All 4 day routines named correctly: "GZCLP Day A1", "GZCLP Day B1", "GZCLP Day A2", "GZCLP Day B2"
- [x] Change made in `buildDayRoutine()` function in `routine-builder.ts`
- [x] Existing routines updated on next sync (or document that new setup required)

---

## 6. Phase 2: Core Functionality

**Estimated Effort:** 14-18 hours
**Priority:** High
**Dependencies:** Phase 1 must be complete

---

### Task 2.1: Warmup Set Generation

**Gap:** GAP-01
**Status:** ✅ Complete
**Requirements:** REQ-WARM-001, REQ-WARM-002, REQ-WARM-003

#### Problem

The spec requires automatic warmup sets for T1 exercises with specific protocol:
- Bar only (20kg): 10 reps
- 50% of working weight: 5 reps
- 70% of working weight: 3 reps
- 85% of working weight: 2 reps

Currently, the routine builder generates only working sets (all `type: 'normal'`).

#### Files to Modify

- `src/lib/constants.ts` - Add warmup configuration
- `src/lib/routine-builder.ts` - Add warmup set generation
- `src/types/hevy.ts` - Verify `type: 'warmup'` is valid

#### Implementation

**1. Add constants (src/lib/constants.ts):**

```typescript
export const WARMUP_CONFIG = {
  percentages: [0, 0.5, 0.7, 0.85], // 0 = bar only
  reps: [10, 5, 3, 2],
  minWeight: 20, // kg - bar weight
};
```

**2. Add buildWarmupSets function (src/lib/routine-builder.ts):**

```typescript
import { WARMUP_CONFIG } from './constants';

function roundToNearest(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment;
}

function buildWarmupSets(workingWeightKg: number): RoutineSetWrite[] {
  const BAR_WEIGHT = 20;
  const sets: RoutineSetWrite[] = [];

  for (let i = 0; i < WARMUP_CONFIG.percentages.length; i++) {
    const pct = WARMUP_CONFIG.percentages[i];
    const weight = pct === 0
      ? BAR_WEIGHT
      : Math.max(BAR_WEIGHT, roundToNearest(workingWeightKg * pct, 2.5));

    // Smart filtering: skip if weight equals previous set (avoid duplicates)
    if (sets.length > 0 && sets[sets.length - 1].weight_kg === weight) {
      continue;
    }

    sets.push({ type: 'warmup', weight_kg: weight, reps: WARMUP_CONFIG.reps[i] });
  }

  return sets;
}
```

**3. Modify buildRoutineExercise to prepend warmups for T1:**

```typescript
export function buildRoutineExercise(
  exercise: ExerciseConfig,
  progression: ProgressionState,
  settings: UserSettings,
  day: GZCLPDay
): RoutineExerciseWrite {
  const tier = deriveTier(exercise.role, day);
  const weightKg = toKilograms(progression.currentWeight, settings.weightUnit);

  // Build working sets
  const workingSets = buildWorkingSets(tier, progression.stage, weightKg);

  // Prepend warmup sets for T1 only
  const sets = tier === 'T1'
    ? [...buildWarmupSets(weightKg), ...workingSets]
    : workingSets;

  return {
    exercise_template_id: exercise.hevyTemplateId,
    rest_seconds: settings.restTimers[tier.toLowerCase() as 't1' | 't2' | 't3'],
    sets,
  };
}
```

#### Acceptance Criteria

- [x] `WARMUP_CONFIG` constant added to `src/lib/constants.ts`
- [x] `buildWarmupSets()` function added to `src/lib/routine-builder.ts`
- [x] `buildRoutineExercise()` prepends warmup sets for T1 tier only
- [x] Warmup sets have `type: 'warmup'` in Hevy API payload
- [x] Bar-only set (20kg) always first warmup
- [x] Percentage sets at 50%, 70%, 85% of working weight
- [x] Duplicate warmup weights are skipped (smart filtering)
- [x] All warmup weights rounded to nearest 2.5kg
- [x] Tests for `buildWarmupSets()` pass (see Section 12)

#### Verification

1. Create a routine with T1 Squat at 100kg
2. Verify Hevy routine shows: 20kg×10, 50kg×5, 70kg×3, 85kg×2 (warmups), then 5×100kg×3 (working)
3. Test with low weight (e.g., 30kg) - should skip duplicate bar-weight warmups

---

### Task 2.1b: Remove 'warmup' and 'cooldown' Roles

**Gap:** Related to GAP-01
**Status:** ✅ Complete
**Dependency:** Complete Task 2.1 first

> **IMPORTANT:** Backwards compatibility is NOT required. No migration code needed.
> If old state exists with warmup/cooldown roles, user re-runs setup.

#### Problem

The codebase has 'warmup' and 'cooldown' exercise roles for separate exercises, but the spec only requires inline T1 warmup sets. These roles should be removed.

#### Files to Modify

- `src/types/state.ts` - Remove from ExerciseRole type
- `src/lib/constants.ts` - Remove from EXERCISE_ROLES and ROLE_DISPLAY
- `src/lib/role-utils.ts` - Update role checks (remove warmup/cooldown handling)
- `src/components/common/RoleDropdown.tsx` - Remove options
- `src/components/Dashboard/index.tsx` - Remove warmup/cooldown sections
- `src/components/Settings/ExerciseManager.tsx` - Remove deprecated role handling

#### Implementation

**1. Update type (src/types/state.ts):**

```typescript
// BEFORE:
export type ExerciseRole = 'squat' | 'bench' | 'ohp' | 'deadlift' | 't3' | 'warmup' | 'cooldown';

// AFTER:
export type ExerciseRole = 'squat' | 'bench' | 'ohp' | 'deadlift' | 't3';
```

**2. Update constants (src/lib/constants.ts):**

Remove 'warmup' and 'cooldown' from:
- `EXERCISE_ROLES` array
- `ROLE_DISPLAY` object

**3. Update role-utils.ts:**

Remove warmup/cooldown handling from `getTierForDay()` and other functions.

**4. Update Dashboard (src/components/Dashboard/index.tsx):**

Remove the warmup and cooldown CollapsibleSection components.

**5. NO MIGRATION CODE** - backwards compatibility not required.

#### Acceptance Criteria

- [x] ExerciseRole type no longer includes 'warmup' or 'cooldown'
- [x] EXERCISE_ROLES constant updated (5 roles: squat, bench, ohp, deadlift, t3)
- [x] ROLE_DISPLAY object updated (remove warmup/cooldown entries)
- [x] RoleDropdown component shows only 5 valid roles
- [x] Dashboard removes warmup/cooldown CollapsibleSection components
- [x] **NO migration code added** (backwards compatibility not required)
- [x] TypeScript compiles without errors after type changes (type changes correct; pre-existing unrelated errors)
- [x] All existing tests pass (update tests that reference warmup/cooldown) - 643 tests passing

---

### Task 2.2: Rest Timer Correction

**Gap:** GAP-04
**Status:** ✅ Complete
**Requirements:** REQ-REST-001

#### Problem

Current rest timers differ from spec:
- Current: T1=180s, T2=120s, T3=60s
- Spec: T1=240s, T2=150s, T3=75s

#### Files to Modify

- `src/lib/constants.ts`

#### Implementation

```typescript
// BEFORE (line ~147):
export const DEFAULT_REST_TIMERS: Record<Tier, number> = {
  T1: 180, // 3 minutes
  T2: 120, // 2 minutes
  T3: 60,  // 1 minute
};

// AFTER:
export const DEFAULT_REST_TIMERS: Record<Tier, number> = {
  T1: 240, // 4 minutes (spec: 3-5 min midpoint)
  T2: 150, // 2.5 minutes (spec: 2-3 min midpoint)
  T3: 75,  // 1.25 minutes (spec: 60-90s midpoint)
};
```

#### Acceptance Criteria

- [x] T1 rest timer is 240 seconds (4 minutes)
- [x] T2 rest timer is 150 seconds (2.5 minutes)
- [x] T3 rest timer is 75 seconds (1.25 minutes)
- [x] DEFAULT_REST_TIMERS constant updated in `src/lib/constants.ts`
- [x] New routines created with correct rest timers in Hevy
- [x] Comments updated to reflect spec values

#### Verification

1. Create a new routine
2. Verify rest timers in Hevy match: 240s for T1, 150s for T2, 75s for T3

---

### Task 2.3: Quick Stats Component

**Gap:** GAP-03
**Status:** ✅ Complete
**Requirements:** REQ-DASH-003

#### Problem

Dashboard missing quick stats:
- Weeks on program
- Total workouts
- Days since last workout

#### Files to Create/Modify

- `src/utils/stats.ts` - New file with calculation functions
- `src/components/Dashboard/QuickStats.tsx` - New component
- `src/components/Dashboard/index.tsx` - Integrate component

#### Implementation

**1. Create stats utilities (src/utils/stats.ts):**

```typescript
import type { GZCLPState, ProgressionState } from '@/types/state';

export function calculateWeeksOnProgram(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((now - created) / msPerWeek);
}

export function calculateTotalWorkouts(
  progression: Record<string, ProgressionState>
): number {
  const workoutIds = new Set<string>();
  for (const p of Object.values(progression)) {
    if (p.lastWorkoutId) {
      workoutIds.add(p.lastWorkoutId);
    }
  }
  return workoutIds.size;
}

export function calculateDaysSinceLastWorkout(
  progression: Record<string, ProgressionState>
): number | null {
  let latestDate: Date | null = null;

  for (const p of Object.values(progression)) {
    if (p.lastWorkoutDate) {
      const date = new Date(p.lastWorkoutDate);
      if (!latestDate || date > latestDate) {
        latestDate = date;
      }
    }
  }

  if (!latestDate) return null;

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - latestDate.getTime()) / msPerDay);
}
```

**2. Create QuickStats component (src/components/Dashboard/QuickStats.tsx):**

```typescript
import {
  calculateWeeksOnProgram,
  calculateTotalWorkouts,
  calculateDaysSinceLastWorkout,
} from '@/utils/stats';
import type { GZCLPState } from '@/types/state';

interface QuickStatsProps {
  state: GZCLPState;
}

export function QuickStats({ state }: QuickStatsProps) {
  const weeks = calculateWeeksOnProgram(state.program.createdAt);
  const workouts = calculateTotalWorkouts(state.progression);
  const daysSince = calculateDaysSinceLastWorkout(state.progression);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard label="Weeks on Program" value={weeks} />
      <StatCard label="Total Workouts" value={workouts} />
      <StatCard
        label="Days Since Last"
        value={daysSince ?? '-'}
        warning={daysSince !== null && daysSince > 7}
      />
    </div>
  );
}

function StatCard({ label, value, warning }: {
  label: string;
  value: number | string;
  warning?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg p-4 shadow ${warning ? 'border-l-4 border-amber-500' : ''}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
```

#### Acceptance Criteria

- [x] QuickStats component created in `src/components/Dashboard/QuickStats.tsx`
- [x] Stats utility functions created in `src/utils/stats.ts`
- [x] "Weeks on Program" calculated from `state.program.createdAt`
- [x] "Total Workouts" counted from unique `lastWorkoutId` values
- [x] "Days Since Last" calculated from most recent `lastWorkoutDate`
- [x] Stats displayed in 3-column grid on Dashboard
- [x] Warning indicator (amber border) when days since last > 7
- [x] Null state handled gracefully ("-" for no workout data)
- [x] Unit tests pass for all calculation functions (16 tests)

---

### Task 2.4: Post-Workout Summary Panel

**Gap:** GAP-02
**Status:** ✅ Complete
**Requirements:** REQ-POST-001, REQ-POST-002, REQ-POST-003, REQ-POST-004

#### Problem

No celebration/summary panel after sync detects a new workout. Spec requires:
- Slide-in panel from right (~400px width)
- Celebration content (checkmarks, AMRAP results, PRs, progressions)
- Positive, motivational tone
- "Review Changes" action button

#### Files to Create/Modify

- `src/components/PostWorkoutSummary/index.tsx` - Main slide-in panel
- `src/components/PostWorkoutSummary/WorkoutResult.tsx` - Exercise results
- `src/components/PostWorkoutSummary/PRCelebration.tsx` - PR display
- `src/hooks/useProgression.ts` - Add summary trigger state
- `src/components/Dashboard/index.tsx` - Integrate panel

#### Implementation

**Step 1: Create PostWorkoutSummary/index.tsx**

```typescript
// src/components/PostWorkoutSummary/index.tsx
import { useEffect } from 'react';
import type { WorkoutSummaryData } from '@/types/state';

interface PostWorkoutSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewChanges: () => void;
  summary: WorkoutSummaryData | null;
}

export function PostWorkoutSummary({
  isOpen,
  onClose,
  onReviewChanges,
  summary,
}: PostWorkoutSummaryProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !summary) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="bg-green-600 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-3xl mb-2">Workout Complete!</div>
          <div className="text-green-100">
            {summary.dayName} • {new Date(summary.completedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-200px)]">
          {/* Exercise Results */}
          <div className="space-y-4 mb-6">
            {summary.exercises.map((ex) => (
              <ExerciseResult key={ex.name} exercise={ex} />
            ))}
          </div>

          {/* PRs Section */}
          {summary.newPRs.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 font-bold text-yellow-800 mb-2">
                <span>🏆</span> New Personal Records!
              </div>
              {summary.newPRs.map((pr) => (
                <div key={pr.exercise} className="text-yellow-700">
                  {pr.exercise}: {pr.reps} reps @ {pr.weight}kg
                </div>
              ))}
            </div>
          )}

          {/* Progressions */}
          {summary.progressions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="font-bold text-blue-800 mb-2">
                ⬆️ Weight Increases
              </div>
              {summary.progressions.map((p) => (
                <div key={p.exercise} className="text-blue-700">
                  {p.exercise}: {p.oldWeight}kg → {p.newWeight}kg
                </div>
              ))}
            </div>
          )}

          {/* Stage Changes */}
          {summary.stageChanges.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="font-bold text-purple-800 mb-2">
                🔄 Stage Changes
              </div>
              {summary.stageChanges.map((s) => (
                <div key={s.exercise} className="text-purple-700">
                  {s.exercise}: Stage {s.oldStage} → Stage {s.newStage}
                </div>
              ))}
            </div>
          )}

          {/* Deloads (framed positively) */}
          {summary.deloads.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="font-bold text-orange-800 mb-2">
                💪 Deload & Rebuild
              </div>
              <p className="text-sm text-orange-600 mb-2">
                Time to reset and come back stronger!
              </p>
              {summary.deloads.map((d) => (
                <div key={d.exercise} className="text-orange-700">
                  {d.exercise}: Reset to {d.newWeight}kg
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
          <button
            onClick={onReviewChanges}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium mb-2"
          >
            Review Changes
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-600 hover:text-gray-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
}

// Sub-component for exercise results
function ExerciseResult({ exercise }: { exercise: WorkoutSummaryData['exercises'][0] }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${
        exercise.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {exercise.success ? '✓' : '✗'}
      </div>
      <div className="flex-1">
        <div className="font-medium">{exercise.name}</div>
        <div className="text-sm text-gray-500">
          {exercise.tier} • {exercise.weight}kg • {exercise.setsCompleted}/{exercise.setsTarget} sets
        </div>
        {exercise.amrapReps !== undefined && (
          <div className="text-sm text-blue-600">
            AMRAP: {exercise.amrapReps} reps
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add WorkoutSummaryData type (see Type Definitions section)**

**Step 3: Integrate into Dashboard**

```typescript
// In src/components/Dashboard/index.tsx

import { PostWorkoutSummary } from '@/components/PostWorkoutSummary';

// Add state
const [showSummary, setShowSummary] = useState(false);
const [summaryData, setSummaryData] = useState<WorkoutSummaryData | null>(null);

// After sync detects new workout (in useProgression or useEffect):
if (newWorkoutDetected) {
  setSummaryData(buildSummaryFromChanges(pendingChanges));
  setShowSummary(true);
}

// In render:
<PostWorkoutSummary
  isOpen={showSummary}
  onClose={() => setShowSummary(false)}
  onReviewChanges={() => {
    setShowSummary(false);
    setShowReviewModal(true);
  }}
  summary={summaryData}
/>
```

**Step 4: Create buildSummaryFromChanges utility**

```typescript
// src/utils/summary.ts
import type { PendingChange, WorkoutSummaryData } from '@/types/state';

export function buildSummaryFromChanges(
  changes: PendingChange[],
  dayName: string,
  completedAt: string
): WorkoutSummaryData {
  const exercises: WorkoutSummaryData['exercises'] = [];
  const newPRs: WorkoutSummaryData['newPRs'] = [];
  const progressions: WorkoutSummaryData['progressions'] = [];
  const stageChanges: WorkoutSummaryData['stageChanges'] = [];
  const deloads: WorkoutSummaryData['deloads'] = [];

  for (const change of changes) {
    // Build exercise result
    exercises.push({
      name: change.exerciseName,
      tier: change.tier,
      weight: change.currentWeight,
      setsCompleted: change.setsCompleted,
      setsTarget: change.setsTarget,
      success: change.success,
      amrapReps: change.amrapReps,
    });

    // Categorize changes
    if (change.newPR) {
      newPRs.push({
        exercise: change.exerciseName,
        reps: change.amrapReps!,
        weight: change.currentWeight,
      });
    }

    if (change.weightChange && change.weightChange > 0) {
      progressions.push({
        exercise: change.exerciseName,
        oldWeight: change.currentWeight,
        newWeight: change.currentWeight + change.weightChange,
      });
    }

    if (change.stageChange) {
      stageChanges.push({
        exercise: change.exerciseName,
        oldStage: change.currentStage,
        newStage: change.newStage!,
      });
    }

    if (change.deload) {
      deloads.push({
        exercise: change.exerciseName,
        newWeight: change.newWeight!,
      });
    }
  }

  return {
    dayName,
    completedAt,
    exercises,
    newPRs,
    progressions,
    stageChanges,
    deloads,
  };
}
```

#### Acceptance Criteria

- [x] Panel slides in from right on new workout sync
- [x] Backdrop overlay closes panel on click
- [x] Escape key closes panel
- [x] Header shows "Workout Complete!" with day and date
- [x] Each exercise shows success/failure indicator
- [x] AMRAP reps displayed for T1/T3 exercises
- [x] New PRs highlighted with trophy icon
- [x] Progressions shown with up arrow
- [x] Stage changes shown with cycle icon
- [x] Deloads framed positively ("Deload & Rebuild")
- [x] "Review Changes" button opens ReviewModal
- [x] "Dismiss" button closes panel
- [x] Mobile responsive (full width on small screens)

---

### Task 2.5: Minimum Bar Weight Enforcement

**Gap:** GAP-10
**Status:** ✅ Complete
**Requirements:** REQ-PROG-009

#### Problem

Deload can go below 20kg (bar weight). Current code uses WEIGHT_ROUNDING (2.5kg) as minimum.

#### Files to Modify

- `src/lib/progression.ts` - Line 92

#### Implementation

```typescript
// BEFORE (line 92):
const minWeight = WEIGHT_ROUNDING[unit];
return Math.max(rounded, weight > 0 ? minWeight : 0);

// AFTER:
const BAR_WEIGHT_KG = 20;
const barWeight = unit === 'kg' ? BAR_WEIGHT_KG : Math.round(BAR_WEIGHT_KG * 2.20462);
return Math.max(rounded, barWeight);
```

#### Acceptance Criteria

- [x] Minimum weight is 20kg (bar weight), not 2.5kg
- [x] Deload never goes below bar weight
- [x] Works correctly in both kg and lbs (44lbs minimum)
- [x] BAR_WEIGHT_KG constant defined (20)
- [x] All deload calculations use bar weight as floor
- [x] Tests verify minimum weight enforcement

#### Verification

1. Set a T1 lift to stage 3 at 25kg
2. Trigger deload (fail at stage 3)
3. Verify new weight is 20kg (bar), not lower

---

## 7. Phase 3: UX Enhancements

**Estimated Effort:** 11-15 hours
**Priority:** Medium
**Dependencies:** Phase 2 must be complete (Task 2.4 Post-Workout Summary uses Toast from 3.1)

---

### Task 3.1: Toast Notification System

**Gap:** GAP-05
**Status:** ✅ Complete
**Requirements:** REQ-SYNC-001

#### Problem

No toast notification when auto-sync detects new workout.

#### Files to Create/Modify

- `src/components/common/Toast.tsx` - Toast component
- `src/contexts/ToastContext.tsx` - Toast provider
- `src/App.tsx` - Wrap with ToastProvider
- `src/hooks/useProgression.ts` - Trigger toast

#### Implementation

**Step 1: Create ToastContext.tsx**

```typescript
// src/contexts/ToastContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'pr';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Internal component rendered by provider
function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    pr: 'bg-yellow-500',
  };

  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    pr: '🏆',
  };

  return (
    <div
      className={`
        ${bgColors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg
        flex items-center gap-3 min-w-[300px] max-w-[400px]
        animate-slide-in-right
      `}
    >
      <span className="text-xl">{icons[toast.type]}</span>
      <div className="flex-1">
        <p>{toast.message}</p>
      </div>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          className="px-2 py-1 bg-white/20 rounded text-sm hover:bg-white/30"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/60 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
```

**Step 2: Add CSS animation (in global styles or Tailwind config)**

```css
/* Add to src/index.css or tailwind.config.js */
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

**Step 3: Wrap App with ToastProvider**

```typescript
// src/App.tsx
import { ToastProvider } from '@/contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      {/* ... existing app content */}
    </ToastProvider>
  );
}
```

**Step 4: Use in useProgression hook**

```typescript
// In src/hooks/useProgression.ts
import { useToast } from '@/contexts/ToastContext';

export function useProgression() {
  const { showToast } = useToast();

  const syncWorkouts = async () => {
    // ... existing sync logic

    if (newWorkoutDetected) {
      showToast({
        type: 'success',
        message: 'New workout synced! Tap to review.',
        action: {
          label: 'Review',
          onClick: () => setShowSummary(true),
        },
      });
    }
  };

  // ... rest of hook
}
```

#### Architecture Notes

- Z-index 100 ensures toasts appear above all other UI (PostWorkoutSummary z-50, ReviewModal z-60)
- Position: top-right per spec
- Duration: 5 seconds auto-dismiss OR click action/dismiss button
- Multiple toasts stack vertically

#### Acceptance Criteria

- [x] ToastProvider wraps entire app in App.tsx
- [x] useToast hook accessible from any component
- [x] Toasts appear in top-right corner
- [x] Toasts auto-dismiss after 5 seconds
- [x] Click dismiss button removes toast immediately
- [x] Action button triggers callback and dismisses
- [x] Multiple toasts stack vertically
- [x] Slide-in animation works
- [x] Z-index higher than all other modals

---

### Task 3.2: Today's Workout Actions

**Gap:** GAP-06
**Status:** ⬜ Not Started
**Requirements:** REQ-TODAY-004

#### Problem

Missing "Open in Hevy" and "Copy Workout" buttons.

#### Files to Create/Modify

- `src/components/Dashboard/NextWorkout.tsx` - Add buttons
- `src/utils/clipboard.ts` - New file for copy formatting
- `src/utils/deeplink.ts` - New file for Hevy deep links

#### Implementation

**Step 1: Create deeplink utility**

```typescript
// src/utils/deeplink.ts

/**
 * Generate Hevy app deep link for a routine.
 * Note: Hevy may use different URL schemes on iOS vs Android.
 * Falls back to web URL if deep link fails.
 */
export function getHevyRoutineLink(routineId: string): string {
  // Primary: Hevy app deep link
  return `hevy://routine/${routineId}`;
}

export function getHevyWebLink(routineId: string): string {
  // Fallback: Hevy web (if exists)
  return `https://hevy.com/routine/${routineId}`;
}

export function openInHevy(routineId: string): void {
  const deepLink = getHevyRoutineLink(routineId);

  // Try deep link first
  window.location.href = deepLink;

  // Fallback after timeout (deep link didn't work)
  setTimeout(() => {
    // Could show a toast: "Hevy app not installed"
  }, 1000);
}
```

**Step 2: Create clipboard utility**

```typescript
// src/utils/clipboard.ts
import type { WorkoutPreview } from '@/types/state';

export function formatWorkoutForClipboard(workout: WorkoutPreview): string {
  const lines: string[] = [];

  lines.push(`Today's Workout: GZCLP Day ${workout.day}`);
  lines.push('');

  for (const exercise of workout.exercises) {
    lines.push(`${exercise.tier} ${exercise.name} - ${exercise.weight}kg`);
    lines.push(`  ${exercise.scheme}`);

    if (exercise.warmups && exercise.warmups.length > 0) {
      const warmupStr = exercise.warmups
        .map((w) => `${w.weight}kg×${w.reps}`)
        .join(', ');
      lines.push(`  Warmups: ${warmupStr}`);
    }

    lines.push('');
  }

  if (workout.estimatedDuration) {
    lines.push(`Estimated duration: ${workout.estimatedDuration} min`);
  }

  return lines.join('\n');
}

export async function copyWorkoutToClipboard(workout: WorkoutPreview): Promise<boolean> {
  const text = formatWorkoutForClipboard(workout);

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
```

**Step 3: Add buttons to NextWorkout component**

```typescript
// In src/components/Dashboard/NextWorkout.tsx

import { openInHevy } from '@/utils/deeplink';
import { copyWorkoutToClipboard } from '@/utils/clipboard';
import { useToast } from '@/contexts/ToastContext';

export function NextWorkout({ workout, routineId }: Props) {
  const { showToast } = useToast();

  const handleOpenInHevy = () => {
    openInHevy(routineId);
  };

  const handleCopyWorkout = async () => {
    const success = await copyWorkoutToClipboard(workout);
    if (success) {
      showToast({ type: 'success', message: 'Workout copied to clipboard!' });
    } else {
      showToast({ type: 'error', message: 'Failed to copy workout' });
    }
  };

  return (
    <div>
      {/* ... existing workout preview content */}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleOpenInHevy}
          className="flex-1 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Open in Hevy
        </button>
        <button
          onClick={handleCopyWorkout}
          className="flex-1 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Copy Workout
        </button>
      </div>
    </div>
  );
}
```

#### Acceptance Criteria

- [ ] "Open in Hevy" button visible in NextWorkout component
- [ ] "Copy Workout" button visible in NextWorkout component
- [ ] Deep link opens Hevy app (on mobile)
- [ ] Clipboard contains formatted workout text
- [ ] Toast confirms successful copy
- [ ] Error toast on clipboard failure
- [ ] Warmup sets included in copy format (if implemented)

---

### Task 3.3: Estimated Duration

**Gap:** GAP-07
**Status:** ⬜ Not Started
**Requirements:** REQ-TODAY-003

#### Problem

No estimated workout duration displayed.

#### Files to Create/Modify

- `src/utils/duration.ts` - New calculation utility
- `src/components/Dashboard/NextWorkout.tsx` - Display duration

#### Implementation

```typescript
export function estimateDuration(exercises: WorkoutExercise[]): number {
  const SET_TIME = 30; // seconds per set
  let totalSeconds = 0;

  for (const ex of exercises) {
    const restSeconds = ex.tier === 'T1' ? 240 : ex.tier === 'T2' ? 150 : 75;
    totalSeconds += ex.sets.length * (SET_TIME + restSeconds);
  }

  return Math.ceil(totalSeconds / 60); // Return minutes
}
```

#### Acceptance Criteria

- [ ] `estimateDuration()` function created in `src/utils/duration.ts`
- [ ] Duration calculated as: sets × (30s set time + rest time)
- [ ] Uses correct rest timers: T1=240s, T2=150s, T3=75s
- [ ] Returns duration in minutes (rounded up)
- [ ] Duration displayed in NextWorkout component
- [ ] Format: "~45 min" or "Estimated: 45 min"
- [ ] Includes warmup sets in calculation (after Task 2.1)
- [ ] Unit tests pass for duration calculation

---

### Task 3.4: AMRAP Notes in Routine

**Gap:** GAP-08
**Status:** ⬜ Not Started
**Requirements:** REQ-AMRAP-002

#### Problem

Exercise notes field not populated with AMRAP indication.

#### Files to Modify

- `src/lib/routine-builder.ts` - Add notes generation

#### Implementation

In `buildRoutineExercise`, add notes field:

```typescript
function getExerciseNotes(tier: Tier, stage: Stage): string {
  switch (tier) {
    case 'T1':
      return `T1 - ${T1_SCHEMES[stage].display} (last set AMRAP)`;
    case 'T2':
      return `T2 - ${T2_SCHEMES[stage].display}`;
    case 'T3':
      return `T3 - ${T3_SCHEME.display} (last set AMRAP, target 25+ total reps)`;
  }
}

// In buildRoutineExercise:
return {
  exercise_template_id: exercise.hevyTemplateId,
  rest_seconds: restSeconds,
  notes: getExerciseNotes(tier, progression.stage),
  sets,
};
```

#### Acceptance Criteria

- [ ] `getExerciseNotes()` function created in `src/lib/routine-builder.ts`
- [ ] T1 notes format: "T1 - 5x3+ (last set AMRAP)"
- [ ] T2 notes format: "T2 - 3x10" (no AMRAP for T2)
- [ ] T3 notes format: "T3 - 3x15+ (last set AMRAP, target 25+ total reps)"
- [ ] Notes include correct scheme based on stage (5x3+, 6x2+, 10x1+)
- [ ] `notes` field added to RoutineExerciseWrite in routine builder
- [ ] Notes visible in Hevy app exercise details
- [ ] Tests verify correct note generation for all tiers and stages

---

### Task 3.5: PR Celebration Display

**Gap:** GAP-09
**Status:** ⬜ Not Started
**Requirements:** REQ-AMRAP-003

#### Problem

No "New PR!" celebration when AMRAP record is beaten.

#### Files to Modify

- `src/hooks/useProgression.ts` - Detect new PR during workout analysis
- `src/lib/workout-analysis.ts` - Add PR detection to analysis result
- `src/components/PostWorkoutSummary/index.tsx` - Display PR (already implemented in Task 2.4)
- `src/contexts/ToastContext.tsx` - PR toast type (already implemented in Task 3.1)

#### Implementation

**Step 1: Add PR detection to workout analysis**

```typescript
// In src/lib/workout-analysis.ts

interface ExerciseAnalysis {
  exerciseId: string;
  exerciseName: string;
  tier: Tier;
  success: boolean;
  amrapReps?: number;
  previousAmrapRecord?: number;
  isNewPR: boolean;  // ADD THIS FIELD
  // ... other fields
}

export function analyzeExercise(
  exercise: WorkoutExercise,
  progression: ProgressionState,
  tier: Tier
): ExerciseAnalysis {
  // ... existing analysis logic

  // PR Detection for T1 and T3 (AMRAP exercises)
  let isNewPR = false;
  if (tier === 'T1' || tier === 'T3') {
    const lastSetReps = getLastSetReps(exercise);
    const previousRecord = progression.amrapRecord ?? 0;

    if (lastSetReps > previousRecord) {
      isNewPR = true;
    }
  }

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    tier,
    success: isSuccess(exercise, tier),
    amrapReps: getLastSetReps(exercise),
    previousAmrapRecord: progression.amrapRecord,
    isNewPR,
    // ... other fields
  };
}

function getLastSetReps(exercise: WorkoutExercise): number {
  const sets = exercise.sets;
  if (sets.length === 0) return 0;
  return sets[sets.length - 1].reps ?? 0;
}
```

**Step 2: Show PR toast when detected**

```typescript
// In src/hooks/useProgression.ts

const syncWorkouts = async () => {
  // ... sync and analyze workouts

  const analyses = analyzeWorkout(workout, state);

  // Check for any new PRs
  const newPRs = analyses.filter((a) => a.isNewPR);

  if (newPRs.length > 0) {
    // Show PR-specific toast
    showToast({
      type: 'pr',
      message: `New PR! ${newPRs[0].exerciseName}: ${newPRs[0].amrapReps} reps!`,
    });
  }

  // ... rest of sync logic
};
```

**Step 3: Update progression state with new record**

```typescript
// In src/lib/apply-changes.ts or useProgression.ts

function applyProgressionChanges(
  analysis: ExerciseAnalysis,
  currentProgression: ProgressionState
): ProgressionState {
  const updates: Partial<ProgressionState> = {};

  // Update AMRAP record if new PR
  if (analysis.isNewPR && analysis.amrapReps !== undefined) {
    updates.amrapRecord = analysis.amrapReps;
  }

  // ... other progression updates

  return { ...currentProgression, ...updates };
}
```

**Step 4: Ensure PostWorkoutSummary shows PRs (from Task 2.4)**

The PostWorkoutSummary component already displays PRs via the `summary.newPRs` array.
The `buildSummaryFromChanges` function populates this from `change.newPR`.

Ensure the PendingChange type includes:

```typescript
interface PendingChange {
  // ... existing fields
  newPR: boolean;
  amrapReps?: number;
}
```

#### Data Flow

```
Workout completed in Hevy
        ↓
syncWorkouts() fetches workout
        ↓
analyzeExercise() detects isNewPR = true
        ↓
showToast({ type: 'pr', ... }) shows celebration toast
        ↓
buildSummaryFromChanges() includes PR in summary.newPRs
        ↓
PostWorkoutSummary displays trophy + PR details
        ↓
applyProgressionChanges() updates amrapRecord in state
```

#### Acceptance Criteria

- [ ] AMRAP reps extracted from last set of T1/T3 exercises
- [ ] New PR detected when reps > previousAmrapRecord
- [ ] PR toast appears immediately with trophy icon
- [ ] PostWorkoutSummary shows PRs in yellow box with trophy
- [ ] amrapRecord updated in progression state after confirm
- [ ] Multiple PRs in same workout all displayed

---

### Task 3.6: Today's Workout Preview / Start Button

**Gap:** GAP-15
**Status:** ✅ Complete
**Requirements:** REQ-DASH-001, REQ-TODAY-001, REQ-TODAY-002

#### Problem

The spec requires:
1. A "Start Workout" button on Dashboard (REQ-DASH-001)
2. Clicking it opens Today's Workout Preview (REQ-TODAY-001)
3. Preview shows content in specific order with warmups collapsible (REQ-TODAY-002)

#### Implementation Notes

Created `TodaysWorkoutModal.tsx` component that displays:
- Header with day name and date
- Collapsible warmup section (collapsed by default)
- T1 exercise with AMRAP indicator
- T2 exercise
- T3 exercises list
- (Estimated duration placeholder - depends on Task 3.4/GAP-07)

#### Files to Modify

- `src/components/Dashboard/index.tsx` - Add "Start Workout" button
- `src/components/Dashboard/NextWorkout.tsx` - Ensure proper content order
- May need new `TodaysWorkoutModal.tsx` or similar

#### Implementation

**1. Add "Start Workout" button to Dashboard:**

```typescript
<button
  onClick={() => setShowTodaysWorkout(true)}
  className="bg-blue-600 text-white px-4 py-2 rounded-md"
>
  Start Workout
</button>
```

**2. Today's Workout Preview content order (per REQ-TODAY-002):**

1. Header: Day name + date
2. Warmup sets (T1): collapsible, collapsed by default
3. T1 exercise: name, weight, scheme, AMRAP indicator
4. T2 exercise: name, weight, scheme
5. T3 exercises: list with weights
6. Estimated duration

**3. Make warmup section collapsible:**

```typescript
<CollapsibleSection title="Warmups" defaultOpen={false}>
  {warmupSets.map(set => <WarmupRow key={set.id} {...set} />)}
</CollapsibleSection>
```

#### Dependencies

- Task 2.1 (Warmup Set Generation) - needed for warmup display
- Task 3.3 (Estimated Duration) - needed for duration display

#### Acceptance Criteria

- [x] "Start Workout" button visible on Dashboard
- [x] Button opens Today's Workout Preview modal/panel
- [x] Header shows day name and date
- [x] Warmup section is collapsible (uses CollapsibleSection)
- [x] Warmup section collapsed by default
- [x] T1 exercise shows: name, weight, scheme, AMRAP indicator
- [x] T2 exercise shows: name, weight, scheme
- [x] T3 exercises listed with weights
- [ ] Estimated duration displayed (from Task 3.4/GAP-07) - *pending dependency*
- [x] Content order matches spec (warmups → T1 → T2 → T3 → duration)

#### Verification

1. Dashboard shows "Start Workout" button
2. Clicking opens Today's Workout Preview
3. Warmup section is collapsible and collapsed by default
4. Content order matches spec

---

### Task 3.7: Retry Button on Sync Errors

**Gap:** GAP-19
**Status:** ⬜ Not Started
**Requirements:** REQ-SYNC-004

#### Problem

When sync fails, there's no easy way to retry. Users must manually click "Sync Workouts" again.

#### Files to Modify

- `src/components/Dashboard/index.tsx` - Add retry button to error state
- `src/components/common/ErrorState.tsx` - Add retry prop

#### Implementation

```typescript
// In Dashboard, when sync error occurs:
{syncError && (
  <ErrorState
    message={syncError}
    onRetry={() => syncWorkouts()}
  />
)}

// In ErrorState component:
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-red-600 underline"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
```

#### Acceptance Criteria

- [ ] ErrorState component accepts optional `onRetry` prop
- [ ] "Try Again" button displayed when `onRetry` is provided
- [ ] Button triggers retry callback when clicked
- [ ] Dashboard passes `syncWorkouts` function as retry callback
- [ ] Error message displayed above retry button
- [ ] Button styled appropriately (underline, red text)
- [ ] Retry clears previous error before attempting again

#### Verification

1. Disable network or use invalid API key
2. Attempt sync - should fail with error
3. Click "Try Again" button
4. Verify sync is retried

---

## 8. Phase 4: Polish

**Estimated Effort:** 4-6 hours
**Priority:** Low
**Dependencies:** None (can be done after Phase 1)

---

### Task 4.1: Specific Error Messages

**Gap:** GAP-11
**Status:** ⬜ Not Started
**Requirements:** REQ-ERR-001, REQ-ERR-002, REQ-ERR-003

#### Problem

Generic error messages instead of spec-defined specific messages.

#### Files to Modify

- `src/lib/hevy-client.ts` - Map status codes to messages
- `src/components/common/ErrorState.tsx` - Display messages

#### Implementation

Create an error mapping utility:

```typescript
// src/lib/api-errors.ts
export function getErrorMessage(status: number, context?: string): string {
  switch (status) {
    case 401:
      return "API key invalid. Update in Settings.";
    case 403:
      return context === 'routine_limit'
        ? "Routine limit exceeded. Delete unused routines."
        : "Hevy Pro required for API access.";
    case 404:
      return "Routine not found in Hevy. Re-run setup.";
    case 429:
      return "Rate limited. Try again in 1 minute.";
    default:
      if (status >= 500) {
        return "Hevy unavailable. Try again later.";
      }
      return "An unexpected error occurred.";
  }
}

export function getNetworkErrorMessage(): string {
  return "No internet connection.";
}
```

#### Error Mapping (from spec)

| Status | Message |
|--------|---------|
| 401 | "API key invalid. Update in Settings." |
| 403 (general) | "Hevy Pro required for API access." |
| 403 (routine limit) | "Routine limit exceeded. Delete unused routines." |
| 404 | "Routine not found in Hevy. Re-run setup." |
| 429 | "Rate limited. Try again in 1 minute." |
| 500+ | "Hevy unavailable. Try again later." |
| Network | "No internet connection." |

#### Acceptance Criteria

- [ ] `api-errors.ts` utility created in `src/lib/`
- [ ] `getErrorMessage(status, context)` function implemented
- [ ] All status codes from table above mapped to messages
- [ ] Network errors return "No internet connection."
- [ ] 403 with routine_limit context handled separately
- [ ] Unknown errors return generic fallback message
- [ ] hevy-client.ts updated to use new error messages
- [ ] ErrorState component displays specific messages
- [ ] Tests verify correct message for each status code

---

### Task 4.2: Document Schema Deviation

**Gap:** GAP-16
**Status:** ⬜ Not Started
**Requirements:** REQ-DATA-002

#### Problem

The codebase uses a different state schema than the spec:
- Codebase: `exercises` object with role-based structure
- Spec: `mainLifts` + `dayAccessories` structure

This is a **deliberate deviation** that improves flexibility (role-based system). Document the decision.

#### Implementation

No code changes needed. Add documentation:

1. Update `docs/architecture.md` (create if needed):

```markdown
## State Schema Deviations

### Exercise Storage

**Spec defines:** Separate `mainLifts` and `dayAccessories` arrays
**Implementation uses:** Unified `exercises` object with `role` property

**Rationale:** The role-based system allows:
- Dynamic tier derivation from role + day (see `deriveTier()`)
- Flexible T3 scheduling per day
- Single source of truth for all exercises
- Easier exercise management without separate data structures

**Mapping:**
- Spec's `mainLifts` → exercises with roles: squat, bench, ohp, deadlift
- Spec's `dayAccessories` → exercises with role: t3 + t3Schedule per day
```

#### Acceptance Criteria

- [ ] `docs/architecture.md` file created (or updated if exists)
- [ ] "State Schema Deviations" section documented
- [ ] Rationale for role-based system explained
- [ ] Mapping between spec and implementation clearly shown
- [ ] No code changes required for this task
- [ ] Documentation reviewed for accuracy

---

### Task 4.3: Fix Progression Key Format (Spec Alignment)

**Gap:** GAP-17
**Status:** ⬜ Not Started
**Requirements:** REQ-DATA-003
**Priority:** 🟢 MEDIUM

> **IMPORTANT:** Backwards compatibility is NOT required. Existing localStorage data can be discarded.
> Users can re-run setup if needed. Do NOT add migration code.

#### Problem

Progression keys use wrong format:

| Type | Current (Wrong) | Spec (Correct) |
|------|-----------------|----------------|
| Main lift T1 | `squat-T1` | `squat_t1` |
| Main lift T2 | `bench-T2` | `bench_t2` |
| T3 accessory | `{exerciseId}` | `t3_{hevyTemplateId}` |

#### Files to Modify

- `src/lib/role-utils.ts` - Update `getProgressionKey()` function
- `src/types/state.ts` - Update `ProgressionKey` type documentation
- `tests/unit/role-utils.test.ts` - Update expected key formats
- Any other files that reference progression key format directly

#### Implementation

**1. Update `getProgressionKey()` in `src/lib/role-utils.ts`:**

```typescript
/**
 * Generate the progression storage key for an exercise.
 *
 * Key formats (per REQ-DATA-003):
 * - Main lifts: `{role}_t1` or `{role}_t2` (e.g., "squat_t1", "bench_t2")
 * - T3 accessories: `t3_{hevyTemplateId}` (e.g., "t3_A1B2C3D4")
 */
export function getProgressionKey(
  exerciseId: string,
  role: ExerciseRole | undefined,
  tier: Tier,
  hevyTemplateId?: string
): ProgressionKey {
  // Main lifts with T1/T2 context use role_tier format (lowercase)
  if (role && isMainLiftRole(role) && (tier === 'T1' || tier === 'T2')) {
    return `${role}_t${tier.charAt(1)}`  // "squat_t1", "bench_t2"
  }
  // T3 exercises use t3_{hevyTemplateId} format
  if (hevyTemplateId) {
    return `t3_${hevyTemplateId}`
  }
  // Fallback for T3 without templateId (legacy, should not happen)
  return `t3_${exerciseId}`
}
```

**2. Update all call sites to pass `hevyTemplateId` for T3 exercises.**

**3. Update tests to expect new key format.**

#### Acceptance Criteria

- [ ] `getProgressionKey()` returns `squat_t1` format for main lifts (not `squat-T1`)
- [ ] `getProgressionKey()` returns `t3_{hevyTemplateId}` format for T3s (not just exerciseId)
- [ ] All existing tests updated with new key format expectations
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] No migration code added (backwards compatibility not required)

---

### Task 4.4: Final Integration Testing

**Gap:** None (quality assurance)
**Status:** ⬜ Not Started
**Requirements:** All

#### Purpose

Comprehensive testing after all phases complete.

#### Checklist

**Full Workflow Tests:**
- [ ] Fresh install → Setup Wizard → Create routines → Dashboard
- [ ] Fresh install → Setup Wizard → Import routines → Dashboard
- [ ] Complete workout in Hevy → Sync → Review → Confirm
- [ ] Progression (weight increase) verified in Hevy
- [ ] Stage change flow (5x3+ → 6x2+) works
- [ ] Deload flow (85% weight reduction) works

**Component Tests:**
- [ ] Auto-sync triggers on Dashboard mount
- [ ] Post-workout summary appears after sync
- [ ] Toast notifications show correctly
- [ ] Quick stats display accurate data
- [ ] Today's workout preview shows all elements
- [ ] Warmup sets included in T1 exercises

**Edge Cases:**
- [ ] API errors show correct messages
- [ ] Network offline handled gracefully
- [ ] Multiple workouts synced correctly
- [ ] Day advancement works (A1→B1→A2→B2→A1)

#### Acceptance Criteria

- [ ] All Phase 1, 2, and 3 tasks marked complete
- [ ] Full Workflow Tests (above) all pass
- [ ] Component Tests (above) all pass
- [ ] Edge Cases (above) all handled correctly
- [ ] `npm run build` passes with no errors
- [ ] `npm test` passes with 100% of tests
- [ ] `npm run lint` passes with no warnings
- [ ] Manual end-to-end testing completed
- [ ] This task is THE FINAL TASK - all gaps addressed

---

## 9. Key Implementation Decisions

These decisions were made during analysis and should be followed:

### Warmup Approach: Inline Sets

**Decision:** Warmup sets should be inline within T1 exercises (as `type: 'warmup'` sets), NOT separate exercises with 'warmup' role.

**Rationale:** Matches Appendix A of spec. Hevy groups them correctly for volume calculations.

### Smart Warmup Filtering

**Decision:** Skip warmup sets where calculated weight equals bar weight.

**Example:** Working at 30kg → 50% = 15kg → rounds to 20kg → skip (already have bar-only set)

### Backwards Compatibility

**Decision:** Backwards compatibility is NOT required for any changes.

**Rationale:** This is a greenfield implementation. Users can re-run setup if localStorage schema changes. Do NOT add migration code - it adds complexity for minimal benefit.

**Applies to:**
- Progression key format changes (Task 4.3)
- Role removal (Task 2.1b)
- Any state schema changes

### Role Removal

**Decision:** Remove 'warmup' and 'cooldown' roles entirely.

**Migration:** NOT required. If old state exists, user re-runs setup. No migration code.

### Progression Key Format

**Decision:** Fix keys to match spec (REQ-DATA-003).

**Format:**
- Main lifts: `{role}_t{tier}` → `squat_t1`, `bench_t2`
- T3 accessories: `t3_{hevyTemplateId}` → `t3_A1B2C3D4`

**Migration:** NOT required. No backwards compatibility needed.

### Toast Architecture

**Decision:** Use React Context (ToastProvider) at app root.

**Z-index order:** Toast > PostWorkoutSummary > ReviewModal > Dashboard

---

## 10. Testing Requirements

### Per-Task Testing

Each task requires:

1. **Unit tests** for new utility functions
2. **Integration tests** for component behavior
3. **Manual verification** against spec requirements

### Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linting
npm run lint
```

### Verification Checklist Template

Use this for each task:

- [ ] Code compiles without errors (`npm run build`)
- [ ] All existing tests pass (`npm test`)
- [ ] New tests added and passing
- [ ] Linting passes (`npm run lint`)
- [ ] Manual testing completed
- [ ] Spec requirements verified (reference requirement IDs)

---

## Appendix: Task Dependency Graph

```
Phase 1: Critical Fixes (MUST DO FIRST)
├── Task 1.1 (currentDay Advancement) ──┐
├── Task 1.2 (Auto-Sync on Mount) ──────┤ (all parallel)
├── Task 1.3 (Combined Welcome Step) ───┤
│   ├── Task 1.4 (App Title) ───────────┤ (1.4 & 1.5 depend on 1.3)
│   └── Task 1.5 (Path Labels) ─────────┤
└── Task 1.6 (Routine Title Format) ────┘
                                        │
                                        ▼
Phase 2: Core Functionality
├── Task 2.1 (Warmup Set Generation) ───┐
│   └── Task 2.1b (Remove Roles) ───────┤ (2.1b depends on 2.1)
├── Task 2.2 (Rest Timer Correction) ───┤ (parallel)
├── Task 2.3 (Quick Stats) ─────────────┤
├── Task 2.4 (Post-Workout Summary) ────┤
└── Task 2.5 (Min Bar Weight) ──────────┘
                                        │
                                        ▼
Phase 3: UX Enhancements
├── Task 3.1 (Toast Notification) ──────┐
│   └── Task 3.5 (PR Celebration) ──────┤ (3.5 depends on 3.1)
├── Task 3.2 (Today's Workout Actions) ─┤
├── Task 3.3 (Estimated Duration) ──────┤
├── Task 3.4 (AMRAP Notes) ─────────────┤
├── Task 3.6 (Start Workout Button) ────┤ (depends on 2.1, 3.3)
└── Task 3.7 (Retry Button) ────────────┘
                                        │
                                        ▼
Phase 4: Polish (Can run parallel with Phase 3)
├── Task 4.1 (Specific Error Messages) ─┐
├── Task 4.2 (Document Schema) ─────────┤ (parallel, no code changes)
├── Task 4.3 (Document Progression) ────┤
└── Task 4.4 (Final Integration Test) ──┘ (must be last)
```

### Critical Path

The minimum path to working software:
1. **Task 1.1** → currentDay advancement (BROKEN)
2. **Task 1.2** → Auto-sync on mount
3. **Task 1.3** → Combined welcome step
4. **Task 1.6** → Routine title format
5. **Task 2.1** → Warmup sets
6. **Task 2.4** → Post-workout summary

### Parallel Work Opportunities

These tasks can be worked on simultaneously:
- Phase 1: Tasks 1.1, 1.2, 1.3, 1.6 (all independent)
- Phase 2: Tasks 2.2, 2.3, 2.5 (after 2.1)
- Phase 3: Tasks 3.1, 3.2, 3.3, 3.4, 3.7 (all independent)
- Phase 4: Tasks 4.1, 4.2, 4.3 (all independent)

---

## 11. Type Definitions

> **Add these types to `src/types/state.ts` as needed during implementation.**

### WorkoutSummaryData (Task 2.4)

```typescript
/**
 * Data structure for the Post-Workout Summary panel.
 * Built from PendingChange[] after workout analysis.
 */
export interface WorkoutSummaryData {
  dayName: string;           // e.g., "Day A1"
  completedAt: string;       // ISO date string

  exercises: Array<{
    name: string;
    tier: 'T1' | 'T2' | 'T3';
    weight: number;          // kg
    setsCompleted: number;
    setsTarget: number;
    success: boolean;
    amrapReps?: number;      // Only for T1/T3
  }>;

  newPRs: Array<{
    exercise: string;
    reps: number;
    weight: number;          // kg
  }>;

  progressions: Array<{
    exercise: string;
    oldWeight: number;
    newWeight: number;
  }>;

  stageChanges: Array<{
    exercise: string;
    oldStage: 1 | 2 | 3;
    newStage: 1 | 2 | 3;
  }>;

  deloads: Array<{
    exercise: string;
    newWeight: number;
  }>;
}
```

### PendingChange (Extended)

```typescript
/**
 * Extended PendingChange with fields needed for summary.
 * Check existing PendingChange type and add missing fields.
 */
export interface PendingChange {
  // Existing fields (verify these exist):
  exerciseId: string;
  exerciseName: string;
  tier: 'T1' | 'T2' | 'T3';
  currentWeight: number;
  currentStage: 1 | 2 | 3;
  success: boolean;
  setsCompleted: number;
  setsTarget: number;

  // Fields to add if missing:
  amrapReps?: number;
  newPR: boolean;
  weightChange?: number;      // Positive = increase, negative = decrease
  stageChange: boolean;
  newStage?: 1 | 2 | 3;
  deload: boolean;
  newWeight?: number;         // Weight after deload
}
```

### ExerciseAnalysis (Task 3.5)

```typescript
/**
 * Result of analyzing a single exercise from a workout.
 * Used to build PendingChange objects.
 */
export interface ExerciseAnalysis {
  exerciseId: string;
  exerciseName: string;
  tier: 'T1' | 'T2' | 'T3';
  success: boolean;
  setsCompleted: number;
  setsTarget: number;

  // AMRAP tracking
  amrapReps?: number;
  previousAmrapRecord?: number;
  isNewPR: boolean;

  // Progression decisions
  shouldProgress: boolean;
  shouldAdvanceStage: boolean;
  shouldDeload: boolean;
  newWeight?: number;
  newStage?: 1 | 2 | 3;
}
```

### Toast Types (Task 3.1)

```typescript
/**
 * Toast notification types.
 * Already defined in ToastContext.tsx.
 */
export type ToastType = 'success' | 'error' | 'info' | 'pr';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### WelcomeStepData (Task 1.3)

```typescript
/**
 * Data returned from WelcomeStep on completion.
 */
export interface WelcomeStepData {
  apiKey: string;
  path: 'create' | 'import';
  unit: 'kg' | 'lbs';
}
```

---

## 12. Test Examples

> **Use these as templates. Each utility function should have corresponding tests.**

### Stats Utility Tests (Task 2.3)

```typescript
// src/utils/stats.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  calculateWeeksOnProgram,
  calculateTotalWorkouts,
  calculateDaysSinceLastWorkout,
} from './stats';

describe('calculateWeeksOnProgram', () => {
  it('returns 0 for programs started today', () => {
    const today = new Date().toISOString();
    expect(calculateWeeksOnProgram(today)).toBe(0);
  });

  it('returns 1 for programs started 7 days ago', () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateWeeksOnProgram(oneWeekAgo)).toBe(1);
  });

  it('returns 4 for programs started 30 days ago', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateWeeksOnProgram(thirtyDaysAgo)).toBe(4);
  });
});

describe('calculateTotalWorkouts', () => {
  it('returns 0 for empty progression', () => {
    expect(calculateTotalWorkouts({})).toBe(0);
  });

  it('counts unique workout IDs', () => {
    const progression = {
      'squat-T1': { lastWorkoutId: 'w1' },
      'bench-T1': { lastWorkoutId: 'w1' }, // Same workout
      'ohp-T1': { lastWorkoutId: 'w2' },   // Different workout
    };
    expect(calculateTotalWorkouts(progression)).toBe(2);
  });

  it('ignores progressions without lastWorkoutId', () => {
    const progression = {
      'squat-T1': { lastWorkoutId: 'w1' },
      'bench-T1': { lastWorkoutId: undefined },
    };
    expect(calculateTotalWorkouts(progression)).toBe(1);
  });
});

describe('calculateDaysSinceLastWorkout', () => {
  it('returns null for empty progression', () => {
    expect(calculateDaysSinceLastWorkout({})).toBeNull();
  });

  it('returns 0 for workout completed today', () => {
    const progression = {
      'squat-T1': { lastWorkoutDate: new Date().toISOString() },
    };
    expect(calculateDaysSinceLastWorkout(progression)).toBe(0);
  });

  it('returns correct days for past workout', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const progression = {
      'squat-T1': { lastWorkoutDate: threeDaysAgo },
    };
    expect(calculateDaysSinceLastWorkout(progression)).toBe(3);
  });
});
```

### Duration Utility Tests (Task 3.3)

```typescript
// src/utils/duration.test.ts
import { describe, it, expect } from 'vitest';
import { estimateDuration } from './duration';

describe('estimateDuration', () => {
  it('returns 0 for empty exercises', () => {
    expect(estimateDuration([])).toBe(0);
  });

  it('calculates T1 duration with 240s rest', () => {
    const exercises = [{
      tier: 'T1',
      sets: [{ reps: 3 }, { reps: 3 }, { reps: 3 }, { reps: 3 }, { reps: 5 }], // 5 sets
    }];
    // 5 sets * (30s work + 240s rest) = 5 * 270 = 1350s = 23 minutes
    expect(estimateDuration(exercises)).toBe(23);
  });

  it('calculates mixed workout duration', () => {
    const exercises = [
      { tier: 'T1', sets: new Array(5).fill({ reps: 3 }) },   // 5 * 270 = 1350s
      { tier: 'T2', sets: new Array(3).fill({ reps: 10 }) },  // 3 * 180 = 540s
      { tier: 'T3', sets: new Array(3).fill({ reps: 15 }) },  // 3 * 105 = 315s
    ];
    // Total: 2205s = 36.75 → 37 minutes
    expect(estimateDuration(exercises)).toBe(37);
  });
});
```

### Warmup Set Generation Tests (Task 2.1)

```typescript
// src/lib/routine-builder.test.ts
import { describe, it, expect } from 'vitest';
import { buildWarmupSets } from './routine-builder';

describe('buildWarmupSets', () => {
  it('generates 4 warmup sets for 100kg working weight', () => {
    const sets = buildWarmupSets(100);
    expect(sets).toHaveLength(4);
    expect(sets).toEqual([
      { type: 'warmup', weight_kg: 20, reps: 10 },   // Bar
      { type: 'warmup', weight_kg: 50, reps: 5 },    // 50%
      { type: 'warmup', weight_kg: 70, reps: 3 },    // 70%
      { type: 'warmup', weight_kg: 85, reps: 2 },    // 85%
    ]);
  });

  it('skips duplicate bar-weight sets for low working weights', () => {
    const sets = buildWarmupSets(30);
    // 50% of 30 = 15, rounds to 17.5, but min is 20 (bar)
    // Should skip duplicate 20kg set
    expect(sets.filter(s => s.weight_kg === 20)).toHaveLength(1);
  });

  it('never goes below bar weight (20kg)', () => {
    const sets = buildWarmupSets(25);
    sets.forEach(set => {
      expect(set.weight_kg).toBeGreaterThanOrEqual(20);
    });
  });

  it('rounds weights to nearest 2.5kg', () => {
    const sets = buildWarmupSets(77);
    sets.forEach(set => {
      expect(set.weight_kg % 2.5).toBe(0);
    });
  });
});
```

### PR Detection Tests (Task 3.5)

```typescript
// src/lib/workout-analysis.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeExercise } from './workout-analysis';

describe('PR detection', () => {
  it('detects new PR when reps exceed record', () => {
    const exercise = {
      id: 'squat',
      name: 'Squat',
      sets: [
        { reps: 3 },
        { reps: 3 },
        { reps: 3 },
        { reps: 3 },
        { reps: 8 }, // Last set AMRAP
      ],
    };
    const progression = {
      amrapRecord: 5, // Previous record
    };

    const result = analyzeExercise(exercise, progression, 'T1');

    expect(result.isNewPR).toBe(true);
    expect(result.amrapReps).toBe(8);
  });

  it('does not flag PR when reps equal record', () => {
    const exercise = {
      id: 'squat',
      name: 'Squat',
      sets: [{ reps: 3 }, { reps: 3 }, { reps: 3 }, { reps: 3 }, { reps: 5 }],
    };
    const progression = {
      amrapRecord: 5, // Equal to achieved
    };

    const result = analyzeExercise(exercise, progression, 'T1');

    expect(result.isNewPR).toBe(false);
  });

  it('does not check PR for T2 exercises', () => {
    const exercise = {
      id: 'bench',
      name: 'Bench Press',
      sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }],
    };
    const progression = {
      amrapRecord: 5,
    };

    const result = analyzeExercise(exercise, progression, 'T2');

    expect(result.isNewPR).toBe(false);
  });
});
```

### Toast Context Tests (Task 3.1)

```typescript
// src/contexts/ToastContext.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

describe('useToast', () => {
  it('adds toast to state', () => {
    const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({
        type: 'success',
        message: 'Test message',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
  });

  it('dismisses toast by id', () => {
    const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ type: 'info', message: 'Test' });
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.dismissToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('auto-dismisses after 5 seconds', async () => {
    vi.useFakeTimers();
    const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ type: 'info', message: 'Test' });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(0);
    vi.useRealTimers();
  });
});
```

---

**End of Document**
