# GZCLP Hevy Tracker

A web app that automates [GZCLP](https://saynotobroscience.com/gzclp-infographic/) (GZCL Linear Progression) tracking with [Hevy](https://hevy.com) integration. It reads your workout data from Hevy, calculates progression changes, and updates your routines automatically.

**[Live Demo](https://aaearon.github.io/gzclp-hevy-tracker/)**

## Why?

Hevy is great for logging workouts, but it doesn't support linear progression programs natively. This app fills that gap:

- **Reads** your completed workouts from Hevy
- **Calculates** weight increases, stage changes, and deloads based on GZCLP rules
- **Presents** recommendations for your review before applying
- **Updates** your Hevy routines with the new weights

No more manually calculating your next workout's weights.

## Features

- **Automatic progression** for T1, T2, and T3 exercises following GZCLP methodology
- **Smart import** from existing Hevy routines with weight/stage detection
- **Pending changes review** before applying any updates
- **Progression charts** with history visualization and predictions
- **Discrepancy detection** when logged weights don't match expected
- **Offline-aware** with localStorage persistence
- **Dark mode** support

## Getting Started

### Prerequisites

- A [Hevy](https://hevy.com) account with API access
- Your Hevy API key (found in Hevy app settings)

### Use the Hosted Version

Visit **[aaearon.github.io/gzclp-hevy-tracker](https://aaearon.github.io/gzclp-hevy-tracker/)** and enter your API key to get started.

### Run Locally

```bash
git clone https://github.com/aaearon/gzclp-hevy-tracker.git
cd gzclp-hevy-tracker
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech Stack

- **React 18** + **TypeScript 5.9** (strict mode)
- **Vite 5.4** + **Tailwind CSS 4.1**
- **React Router 7** for navigation
- **Chart.js** for progression visualization
- **Zod** for schema validation
- **localStorage** for persistence (no backend required)

## For Developers & AI Assistants

This codebase is designed to be navigable by both humans and LLMs.

| Resource | Purpose |
|----------|---------|
| [`CLAUDE.md`](CLAUDE.md) | Development guidelines, commands, project structure |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Comprehensive technical architecture (start here for deep understanding) |
| [`docs/GZCLP-Progression-Spec.md`](docs/GZCLP-Progression-Spec.md) | GZCLP algorithm specification and domain knowledge |

### Quick Reference

```bash
npm test           # Run 1250+ tests
npm run lint       # Run ESLint
npm run build      # Production build
npm run dev        # Development server
```

### Key Directories

```
src/
├── components/     # React components (59 files)
├── hooks/          # Custom hooks (19 files)
├── lib/            # Business logic (23 files)
├── contexts/       # React contexts (4 files)
├── types/          # TypeScript types
└── router.tsx      # App routing + providers
```

### Architecture Highlights

- **Frontend-only SPA** — no backend, user owns their data
- **Split localStorage** — config, progression, and history stored separately for performance
- **Role-based exercises** — main lifts have dual progression (T1 and T2 roles)
- **Pending changes pattern** — users review and approve all changes before applying

## Data Privacy

- Your Hevy API key is stored only in your browser's localStorage
- No data is sent to any server other than Hevy's API
- All processing happens client-side
- API key is excluded from data exports

## License

MIT

## Acknowledgments

- [GZCL Method](http://swoleateveryheight.blogspot.com/) by Cody Lefever
- [Hevy](https://hevy.com) for providing the API
