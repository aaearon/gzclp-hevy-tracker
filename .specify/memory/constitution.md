<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 0.0.0 → 1.0.0 (initial ratification)

  Modified principles: N/A (initial constitution)

  Added sections:
    - Core Principles (6 principles: TDD, Data Sovereignty, Mobile-First,
      Hevy Source of Truth, Minimal Dependencies, GZCLP Fidelity)
    - Technical Constraints
    - Development Workflow
    - Governance

  Removed sections: N/A (initial constitution)

  Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ compatible (Constitution Check section exists)
    - .specify/templates/spec-template.md: ✅ compatible (no changes needed)
    - .specify/templates/tasks-template.md: ✅ compatible (TDD flow supported)

  Follow-up TODOs: None
-->

# GZCLP Hevy Tracker Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)

TDD is mandatory for all code in this project. The Red-Green-Refactor cycle MUST be
strictly enforced without exception.

- Tests MUST be written before implementation code
- All tests MUST fail before implementation begins (Red phase)
- Implementation MUST be minimal to pass tests (Green phase)
- Refactoring MUST NOT change external behavior (Refactor phase)
- All progression logic (T1/T2/T3 calculations, stage transitions, deload rules) MUST
  have comprehensive unit tests with full coverage of edge cases
- Integration tests MUST be written for all Hevy API interactions
- No code may be merged without passing tests

### II. User Data Sovereignty

Users own their data. The application MUST NOT compromise user privacy or data control.

- All application data MUST be stored in browser localStorage
- No external analytics, tracking, or telemetry of any kind
- API keys MUST be stored locally and MUST NOT be transmitted except directly to Hevy API
- Export/import functionality MUST be provided for full data portability
- Users MUST be able to delete all their data with a single action
- No server-side storage or data collection

### III. Mobile-First Design

The primary use case is gym usage on a mobile phone. All design decisions MUST
prioritize mobile experience.

- All UI components MUST be touch-friendly with adequate tap targets (minimum 44x44px)
- Layouts MUST be responsive and optimized for mobile screens first
- Desktop support is required but secondary to mobile experience
- Performance MUST be optimized for mobile networks (minimize bundle size, lazy load)
- Critical actions MUST be accessible within 2 taps from the main screen
- Forms MUST work well with mobile keyboards

### IV. Hevy as Source of Truth

Hevy is the workout logger. This application reads from and writes to Hevy but MUST
NOT duplicate its core functionality.

- Completed workouts MUST be detected via Hevy API, not manual input
- This application MUST NOT implement workout logging functionality
- Progression suggestions MUST require explicit user confirmation before updating Hevy
- All routine updates MUST go through Hevy API
- Graceful degradation MUST be implemented for API failures (offline viewing of cached data)
- API rate limits MUST be respected with appropriate backoff strategies

### V. Minimal Dependencies

The project MUST maintain a minimal dependency footprint for long-term maintainability.

- Core stack: React + TypeScript + Vite + Tailwind CSS only
- No external state management library (localStorage + React state is sufficient)
- No backend required - static deployment only
- Every new dependency MUST be justified with a clear rationale
- Prefer browser APIs over external libraries when functionality is equivalent
- Bundle size MUST be monitored and kept under 200KB gzipped for initial load

### VI. GZCLP Fidelity

The progression rules MUST match the official GZCLP protocol exactly. No unauthorized
modifications to the program logic.

- T1 stage progression: 5x3+ → 6x2+ → 10x1+ → Deload
- T2 stage progression: 3x10 → 3x8 → 3x6 → Deload
- T3 progression: 3x15+ with 25+ total rep threshold for advancement
- Deload calculation: 85% of failed weight, rounded to nearest 2.5kg
- Weight increments: 5kg lower body, 2.5kg upper body
- No "improvements" or variations to the program logic without explicit user request
- Any deviation from official GZCLP rules MUST be documented and user-configurable

## Technical Constraints

The following technical standards MUST be maintained throughout development:

- TypeScript strict mode MUST be enabled (`"strict": true` in tsconfig.json)
- ESLint and Prettier MUST be configured for consistent code formatting
- No `any` types except where explicitly justified with a comment
- All API responses MUST be validated against TypeScript interfaces
- Error boundaries MUST wrap all major UI sections
- All async operations MUST have proper loading and error states

## Development Workflow

The following workflow MUST be followed for all development activities:

- Feature branch Git workflow MUST be used (no direct commits to main/master)
- Branch naming: `feature/description`, `fix/description`, `refactor/description`
- Documentation MUST be updated as part of each task (task not complete until docs updated)
- Each commit SHOULD represent a single logical change
- Pull requests MUST include test coverage for new functionality
- Code review is recommended before merging significant changes

## Governance

This constitution supersedes all other development practices and implementation
convenience. All decisions MUST be evaluated against these principles.

- Constitution amendments require:
  1. Clear documentation of the proposed change
  2. Rationale explaining why the change is necessary
  3. Impact assessment on existing code
  4. Version increment following semantic versioning
- Breaking changes to progression logic MUST include:
  1. Updated tests covering the new behavior
  2. Migration plan for existing user data
  3. User-facing documentation of the change
- Security requirements (NON-NEGOTIABLE):
  - No command injection vulnerabilities
  - No XSS vulnerabilities (sanitize all user input displayed in UI)
  - No API key exposure in logs, errors, or client-side code
  - HTTPS only for all API communications
- All PRs and code reviews MUST verify compliance with this constitution
- Complexity MUST be justified; prefer simple solutions over clever ones

**Version**: 1.0.0 | **Ratified**: 2026-01-02 | **Last Amended**: 2026-01-02
