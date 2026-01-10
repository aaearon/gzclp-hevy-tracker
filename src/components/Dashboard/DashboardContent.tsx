/**
 * DashboardContent Component
 *
 * Main content area of the Dashboard containing stats, workout info,
 * lift cards, and progression charts.
 *
 * [Task 3.1] Extracted from Dashboard/index.tsx
 * [Task 3.4] Lazy loading for ProgressionChartContainer
 * [Task 4.3] React 18 optimization with useDeferredValue for chart data
 */

import { lazy, Suspense, useDeferredValue } from 'react'
import type { GZCLPState } from '@/types/state'
import { MAIN_LIFT_ROLES } from '@/types/state'
import { QuickStats } from './QuickStats'
import { CurrentWorkout } from './CurrentWorkout'
import { MainLiftCard } from './MainLiftCard'
import { T3Overview } from './T3Overview'
import { ChartSkeleton } from '@/components/common/ChartSkeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ErrorFallback } from '@/components/common/ErrorFallback'

// Lazy load chart component [Task 3.4]
const ProgressionChartContainer = lazy(() =>
  import('@/components/ProgressionChart').then((m) => ({ default: m.ProgressionChartContainer }))
)

export interface DashboardContentProps {
  /** Full application state */
  state: GZCLPState
}

export function DashboardContent({ state }: DashboardContentProps) {
  const { exercises, progression, settings, program, t3Schedule, progressionHistory } = state

  // Defer chart data updates to prevent blocking UI [Task 4.3]
  const deferredProgressionHistory = useDeferredValue(progressionHistory)
  const deferredProgression = useDeferredValue(progression)

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Quick Stats [REQ-DASH-003] */}
      <QuickStats state={state} />

      <div className="space-y-8">
        {/* Current Workout - Prominent display at top */}
        <CurrentWorkout
          day={program.currentDay}
          exercises={exercises}
          progression={progression}
          weightUnit={settings.weightUnit}
          t3Schedule={t3Schedule}
        />

        {/* Main Lifts Overview - T1/T2 Status [T036] */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Main Lifts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">T1 and T2 progression status for all main lifts</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {MAIN_LIFT_ROLES.map((role) => (
              <MainLiftCard
                key={role}
                role={role}
                progression={progression}
                weightUnit={settings.weightUnit}
                currentDay={program.currentDay}
              />
            ))}
          </div>
        </section>

        {/* T3 Overview - All accessories with schedule */}
        <T3Overview
          exercises={exercises}
          progression={progression}
          weightUnit={settings.weightUnit}
          t3Schedule={t3Schedule}
        />

        {/* Progression Charts [Feature 007] - Lazy loaded [Task 3.4], Error boundary [Task 3.5], Deferred [Task 4.3] */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Progression Charts</h2>
          <ErrorBoundary
            fallback={
              <ErrorFallback
                title="Chart Error"
                message="Failed to load progression charts."
              />
            }
          >
            <Suspense fallback={<ChartSkeleton />}>
              <ProgressionChartContainer
                exercises={exercises}
                progression={deferredProgression}
                progressionHistory={deferredProgressionHistory}
                unit={settings.weightUnit}
                workoutsPerWeek={program.workoutsPerWeek}
              />
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>
    </main>
  )
}
