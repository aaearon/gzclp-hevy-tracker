/**
 * Router Configuration
 *
 * Defines application routes using React Router v7's createBrowserRouter.
 * Replaces manual view switching with proper URL-based navigation.
 */

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/contexts/ToastContext'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { useProgram } from '@/hooks/useProgram'

// Lazy load main views
const Dashboard = lazy(() =>
  import('@/components/Dashboard').then((m) => ({ default: m.Dashboard }))
)
const Settings = lazy(() =>
  import('@/components/Settings').then((m) => ({ default: m.Settings }))
)
const SetupWizard = lazy(() =>
  import('@/components/SetupWizard').then((m) => ({ default: m.SetupWizard }))
)
const ProgressionChart = lazy(() =>
  import('@/components/ProgressionChart').then((m) => ({ default: m.ProgressionChartContainer }))
)

/**
 * Root layout component
 * Wraps all routes with providers and suspense boundary
 */
function RootLayout() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  )
}

/**
 * Setup guard component
 * Redirects to /setup if setup is required, otherwise renders outlet
 */
function SetupGuard() {
  const { isSetupRequired } = useProgram()

  if (isSetupRequired) {
    return <Navigate to="/setup" replace />
  }

  return <Outlet />
}

/**
 * Completed guard component
 * Redirects to / if setup is already complete
 */
function CompletedGuard() {
  const { isSetupRequired } = useProgram()

  if (!isSetupRequired) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

/**
 * Dashboard wrapper to handle navigation
 */
function DashboardPage() {
  return <Dashboard />
}

/**
 * Settings wrapper to handle back navigation
 */
function SettingsPage() {
  return <Settings />
}

/**
 * Setup wizard wrapper to handle completion
 */
function SetupPage() {
  // SetupWizard now uses program.importState() for atomic state updates.
  // CompletedGuard automatically redirects to / when isSetupRequired becomes false.
  // No reload needed - onComplete is now a no-op for backwards compatibility.
  return <SetupWizard onComplete={() => {
    // No-op: CompletedGuard handles navigation when isSetupRequired becomes false
  }} />
}

/**
 * Charts page wrapper
 * Provides program state to the ProgressionChartContainer
 */
function ChartsPage() {
  const { state } = useProgram()
  return (
    <ProgressionChart
      exercises={state.exercises}
      progression={state.progression}
      progressionHistory={state.progressionHistory}
      unit={state.settings.weightUnit}
      workoutsPerWeek={state.program.workoutsPerWeek}
    />
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Routes that require setup to be complete
      {
        element: <SetupGuard />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'charts',
            element: <ChartsPage />,
          },
        ],
      },
      // Setup route (only accessible if setup not complete)
      {
        path: 'setup',
        element: <CompletedGuard />,
        children: [
          {
            index: true,
            element: <SetupPage />,
          },
        ],
      },
    ],
  },
])
