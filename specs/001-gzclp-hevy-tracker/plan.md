# Implementation Plan: GZCLP Hevy Progression Tracker

**Branch**: `001-gzclp-hevy-tracker` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-gzclp-hevy-tracker/spec.md`

## Summary

Build a web application that automatically tracks GZCLP weightlifting progression by integrating with Hevy. The app reads completed workouts from Hevy API, calculates progression recommendations following exact GZCLP rules (T1/T2/T3 stage transitions, deloads), and updates Hevy routines after user confirmation. All data stored locally in browser localStorage with no backend required.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: React 18, Vite 5, Tailwind CSS 3.4
**Storage**: Browser localStorage (no backend)
**Testing**: Vitest for unit/integration tests
**Target Platform**: Web (mobile-first responsive, desktop secondary)
**Project Type**: Single-page web application (SPA)
**Performance Goals**: <10s sync operation (≤100 workouts), <200KB gzipped bundle, 60fps UI interactions
**Constraints**: Mobile-first (44x44px tap targets), offline-capable (cached data viewing), HTTPS only
**Scale/Scope**: Single user per browser, ~20 exercises tracked, ~100 workout records cached

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Test-Driven Development | ✅ PASS | Vitest configured; all progression logic will have unit tests first |
| II. User Data Sovereignty | ✅ PASS | localStorage only; no analytics; export/import; delete all data option |
| III. Mobile-First Design | ✅ PASS | Tailwind responsive; 44px tap targets; 2-tap critical actions |
| IV. Hevy as Source of Truth | ✅ PASS | Read workouts from Hevy; user confirms before routine updates |
| V. Minimal Dependencies | ✅ PASS | React + Vite + Tailwind only; no state library; <200KB bundle target |
| VI. GZCLP Fidelity | ✅ PASS | Exact progression rules in spec; tests will verify protocol compliance |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-gzclp-hevy-tracker/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Hevy API types)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/          # React components
│   ├── Dashboard/       # Main dashboard view
│   ├── SetupWizard/     # Initial configuration flow
│   ├── ReviewModal/     # Pending changes confirmation
│   └── Settings/        # User preferences
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useHevyApi.ts
│   └── useProgression.ts
├── lib/                 # Core business logic (pure functions)
│   ├── progression.ts   # GZCLP progression calculator
│   ├── workout-analysis.ts  # Analyze Hevy workout data
│   ├── hevy-client.ts   # Hevy API client
│   └── routine-builder.ts   # Build Hevy routine payloads
├── types/               # TypeScript interfaces
│   ├── state.ts         # App state types
│   └── hevy.ts          # Hevy API types
├── utils/               # Utility functions
│   ├── validation.ts    # Input validation
│   └── formatting.ts    # Display formatting
├── App.tsx              # Root component
└── main.tsx             # Entry point

tests/
├── unit/                # Unit tests (progression logic)
├── integration/         # Integration tests (API mocking)
└── setup.ts             # Test configuration
```

**Structure Decision**: Single SPA structure chosen. No backend required - all API calls direct from browser to Hevy. Core business logic isolated in `src/lib/` for easy testing. Components organized by feature (Dashboard, SetupWizard, etc.).

## Complexity Tracking

No constitution violations requiring justification. All principles satisfied with chosen architecture.
