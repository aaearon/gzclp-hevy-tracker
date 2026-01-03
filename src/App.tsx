import { useState } from 'react'
import { SetupWizard } from '@/components/SetupWizard'
import { Dashboard } from '@/components/Dashboard'
import { Settings } from '@/components/Settings'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useProgram } from '@/hooks/useProgram'

type AppView = 'dashboard' | 'settings'

function AppContent() {
  const { isSetupRequired } = useProgram()
  const [showDashboard, setShowDashboard] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>('dashboard')

  // Show setup wizard if needed
  if (isSetupRequired && !showDashboard) {
    return <SetupWizard onComplete={() => { setShowDashboard(true) }} />
  }

  // Render current view
  if (currentView === 'settings') {
    return <Settings onBack={() => { setCurrentView('dashboard') }} />
  }

  return <Dashboard onNavigateToSettings={() => { setCurrentView('settings') }} />
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
