# gzclp-hevy-tracker Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-02

## Active Technologies
- TypeScript 5.9 (strict mode enabled) + React 18.3, Vite 5.4, Tailwind CSS 4.1 (002-routine-selection-wizard)
- Browser localStorage (key: `gzclp_state`) (002-routine-selection-wizard)
- Browser localStorage (key: `gzclp_state`, extended with classifications store) (003-exercise-classification)
- Chart.js 4.x + react-chartjs-2 for progression visualization (007-progression-charts)

- TypeScript 5.x (strict mode enabled) + React 18, Vite 5, Tailwind CSS 3.4 (001-gzclp-hevy-tracker)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode enabled): Follow standard conventions

## Recent Changes
- 008-selective-push: Added selective push/pull/skip per exercise when syncing with Hevy
- 007-progression-charts: Added Chart.js progression visualization with GZCLP-aware prediction algorithm
- 005-t1-t2-progression: Added TypeScript 5.9 (strict mode enabled) + React 18.3, Vite 5.4, Tailwind CSS 4.1
- 003-exercise-classification: Added TypeScript 5.9 (strict mode enabled) + React 18.3, Vite 5.4, Tailwind CSS 4.1
- 002-routine-selection-wizard: Added TypeScript 5.9 (strict mode enabled) + React 18.3, Vite 5.4, Tailwind CSS 4.1


<!-- MANUAL ADDITIONS START -->
## Architecture Documentation

For comprehensive technical architecture reference, see: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

This documentation covers:
- System overview with Mermaid diagrams
- State management patterns (split localStorage, React Context)
- Component hierarchy and responsibilities
- Business logic algorithms (T1/T2/T3 progression)
- Data flow and API integration patterns
- Key files reference for quick navigation

## Known Architectural Concerns

Priority improvements identified in architecture review:
1. **State Management** - ProgramContext exists but is underutilized; `useProgram` is a large orchestrator hook
2. **Dashboard Complexity** - `src/components/Dashboard/index.tsx` manages multiple concerns (348 lines)
3. **localStorage Scalability** - History data can grow unbounded; consider IndexedDB for future
4. **No Router** - Manual view switching in App.tsx; no deep linking support
5. **Schema Validation** - No runtime validation when hydrating from localStorage

## localStorage Keys
- `gzclp_config` - Program configuration (exercises, assignments, API key)
- `gzclp_progression` - Current progression state per exercise
- `gzclp_history` - Workout history and pending changes
<!-- MANUAL ADDITIONS END -->
