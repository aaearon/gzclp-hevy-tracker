# gzclp-hevy-tracker Development Guidelines

**Last updated:** 2026-01-11

## Tech Stack
- **React** 18.3 + **TypeScript** 5.9 (strict mode)
- **Vite** 5.4 + **Tailwind CSS** 4.1
- **React Router** 7.x
- **Chart.js** 4.x + react-chartjs-2
- **Zod** 4.x for schema validation

## Project Structure

```text
src/
├── components/     # React components (59 files)
├── hooks/          # Custom hooks (19 files)
├── lib/            # Business logic (23 files)
├── contexts/       # React contexts (4 files)
├── types/          # TypeScript types (4 files)
├── utils/          # Utilities (5 files)
├── router.tsx      # App routing + providers
└── main.tsx        # Entry point

tests/              # Test files (86 files)
docs/               # Documentation
docs/archive/       # Completed implementation plans
```

## Commands

```bash
npm test           # Run tests (1250+ tests)
npm run lint       # Run ESLint
npm run build      # Production build
npm run dev        # Development server
```

## Architecture Documentation

**Primary reference:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (v2.4)

Key sections:
- State management (split localStorage with StorageContext)
- Component hierarchy and responsibilities
- Business logic algorithms (T1/T2/T3 progression)
- Data flow and API integration patterns

## localStorage Keys

| Key | Purpose | Size |
|-----|---------|------|
| `gzclp_config` | Program config, exercises, API key | ~2-10KB |
| `gzclp_progression` | Current weights, stages, pending changes | ~5-20KB |
| `gzclp_history` | Chart data (auto-pruned to 200/exercise) | ~50KB-500KB |
| `gzclp_theme` | Theme preference (light/dark/system) | ~10 bytes |

## Resolved Architectural Issues

All major architectural concerns from pre-release review have been addressed:

| Issue | Resolution |
|-------|------------|
| ProgramContext wiring | Now wired via AppProviders in router.tsx |
| Data migrations in Dashboard | Extracted to useDataMaintenance hook |
| localStorage quota | StorageContext with proactive monitoring |
| Data corruption | In-memory backup + DataRecoveryDialog |
| History unbounded growth | Auto-pruning to 200 entries/exercise |
| API request cancellation | AbortController on unmount |
| Role change orphan data | Automatic cleanup in useExerciseManagement |

## Documentation Index

### Active (docs/)
- `ARCHITECTURE.md` - Technical architecture (primary reference)
- `GZCLP-Progression-Spec.md` - GZCLP algorithm spec
- `PRE-RELEASE-REVIEW.md` - Release checklist

### Historical
- `SPEC.md` - Original spec (outdated, kept for reference)
- `GZCLP-Functional-Requirements-v2.md` - Requirements (largely superseded)
- `docs/archive/` - Completed implementation plans

## Weight Storage Convention

**IMPORTANT:** All weights stored internally in **kg**, matching Hevy API format.

```typescript
// INPUT: Convert user input to kg before storage
const storedWeight = toKg(userInput, userUnit)

// OUTPUT: Convert kg to user's unit for display
const displayValue = displayWeight(storedKg, userUnit)
```
