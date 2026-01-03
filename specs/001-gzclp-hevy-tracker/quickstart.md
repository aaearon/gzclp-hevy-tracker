# Quickstart: GZCLP Hevy Tracker

This guide walks through setting up and running the GZCLP Hevy Tracker locally.

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **Hevy Pro subscription** (required for API access)
- **Hevy API key** from https://hevy.com/settings?developer

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd gzclp-hevy-tracker
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. First Run Setup

1. **Enter API Key**: Paste your Hevy API key
2. **Select Exercises**: Choose exercises for each GZCLP slot (T1/T2/T3)
3. **Set Starting Weights**: Enter your current working weights
4. **Create Routines**: App will create A1/B1/A2/B2 routines in Hevy

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check code quality |
| `npm run typecheck` | Check TypeScript types |

## Project Structure

```
src/
├── components/       # React components
│   ├── Dashboard/    # Main view
│   ├── SetupWizard/  # Initial setup flow
│   ├── ReviewModal/  # Confirm progression changes
│   └── Settings/     # User preferences
├── hooks/            # Custom React hooks
├── lib/              # Core business logic
│   ├── progression.ts      # GZCLP progression calculator
│   ├── workout-analysis.ts # Analyze Hevy workout data
│   ├── hevy-client.ts      # Hevy API client
│   └── routine-builder.ts  # Build routine payloads
├── types/            # TypeScript interfaces
└── utils/            # Utility functions

tests/
├── unit/             # Unit tests (progression logic)
└── integration/      # Integration tests (mocked API)
```

## Usage Flow

### Daily Use

1. Complete workout in Hevy (log sets/reps as normal)
2. Open GZCLP Tracker
3. Click **Sync** to fetch completed workouts
4. Review progression recommendations
5. **Confirm** changes to update local state
6. Click **Update Hevy** to push changes to routines

### Progression Rules

**T1 (Main Lifts)**:
- 5x3+ → succeed → add weight
- 5x3+ → fail → advance to 6x2+
- 6x2+ → fail → advance to 10x1+
- 10x1+ → fail → deload to 85%, restart at 5x3+

**T2 (Secondary)**:
- 3x10 → 3x8 → 3x6 → deload

**T3 (Accessories)**:
- 3x15+ → add weight when total reps ≥ 25

### Weight Increments

| Unit | Lower Body | Upper Body |
|------|------------|------------|
| kg | 5 kg | 2.5 kg |
| lbs | 10 lb | 5 lb |

## Data & Privacy

- All data stored in browser **localStorage**
- No data sent to servers except Hevy API
- **Export**: Settings → Export Data → Download JSON
- **Import**: Settings → Import Data → Select file
- **Delete**: Settings → Delete All Data

## Troubleshooting

### "Invalid API Key" Error
- Verify key at https://hevy.com/settings?developer
- Ensure Hevy Pro subscription is active
- Check for extra spaces when pasting

### "No Workouts Found"
- Complete at least one workout in Hevy first
- Ensure workout uses exercises assigned in GZCLP setup
- Try syncing again after a few minutes

### "Failed to Update Routine"
- Check internet connection
- Hevy may be temporarily unavailable
- Pending changes are preserved; retry later

### Reset Everything
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete `gzclp_state` key
4. Refresh the page

## Settings

Access Settings by clicking the gear icon in the top-right corner of the Dashboard.

### Preferences
- **Weight Unit**: Toggle between kilograms (kg) and pounds (lbs)

### Data Management
- **Export Data**: Download a JSON backup of all program data
- **Import Data**: Restore from a previously exported backup
- **Reset All Data**: Delete all data and restart setup wizard

### About
- View app version and sync status

## Development Notes

### Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Type Checking

```bash
npm run typecheck
```

### Building for Production

```bash
npm run build
npm run preview  # Test the build locally
```

The `dist/` folder contains static files ready for deployment to any static host.

### Bundle Size

The production build is optimized for size:
- **JavaScript**: ~58 KB gzipped
- **CSS**: ~6 KB gzipped
- **Total**: ~64 KB gzipped (well under 200KB target)
