import { useState, lazy, Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/contexts/ToastContext'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { useProgram } from '@/hooks/useProgram'

// Lazy load main views [Task 3.4]
const Dashboard = lazy(() =>
  import('@/components/Dashboard').then((m) => ({ default: m.Dashboard }))
)
const Settings = lazy(() =>
  import('@/components/Settings').then((m) => ({ default: m.Settings }))
)
const SetupWizard = lazy(() =>
  import('@/components/SetupWizard').then((m) => ({ default: m.SetupWizard }))
)

type AppView = 'dashboard' | 'settings'

function AppContent() {
  const { isSetupRequired } = useProgram()
  const [showDashboard, setShowDashboard] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>('dashboard')

  // Determine which view to render
  let content: React.ReactNode
  if (isSetupRequired && !showDashboard) {
    content = <SetupWizard onComplete={() => { setShowDashboard(true) }} />
  } else if (currentView === 'settings') {
    content = <Settings onBack={() => { setCurrentView('dashboard') }} />
  } else {
    content = <Dashboard onNavigateToSettings={() => { setCurrentView('settings') }} />
  }

  // Wrap with Suspense for lazy loading [Task 3.4]
  return <Suspense fallback={<PageSkeleton />}>{content}</Suspense>
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
