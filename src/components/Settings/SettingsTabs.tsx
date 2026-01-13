/**
 * SettingsTabs Component
 *
 * Tab navigation for Settings page with URL hash persistence
 * and keyboard navigation support.
 *
 * IMPORTANT: Uses CSS `hidden` attribute instead of conditional rendering
 * to preserve ExerciseManager state across tab switches.
 */

import { useEffect, useState, useRef, useCallback } from 'react'

export type SettingsTab = 'preferences' | 'exercises' | 'data' | 'about'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'preferences', label: 'Preferences' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'data', label: 'Data' },
  { id: 'about', label: 'About' },
]

interface SettingsTabsProps {
  children: (activeTab: SettingsTab) => React.ReactNode
}

function getTabFromHash(): SettingsTab {
  const hash = window.location.hash.slice(1)
  if (TABS.some((tab) => tab.id === hash)) {
    return hash as SettingsTab
  }
  return 'preferences'
}

export function SettingsTabs({ children }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(getTabFromHash)
  const tabRefs = useRef<Record<SettingsTab, HTMLButtonElement | null>>({
    preferences: null,
    exercises: null,
    data: null,
    about: null,
  })

  // Sync with URL hash on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Update URL hash when tab changes
  const handleTabChange = useCallback((tab: SettingsTab) => {
    setActiveTab(tab)
    window.location.hash = tab
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, currentTab: SettingsTab) => {
    const currentIndex = TABS.findIndex((t) => t.id === currentTab)
    let newTab: (typeof TABS)[number] | undefined

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        newTab = TABS[currentIndex === 0 ? TABS.length - 1 : currentIndex - 1]
        if (newTab) {
          handleTabChange(newTab.id)
          tabRefs.current[newTab.id]?.focus()
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        newTab = TABS[currentIndex === TABS.length - 1 ? 0 : currentIndex + 1]
        if (newTab) {
          handleTabChange(newTab.id)
          tabRefs.current[newTab.id]?.focus()
        }
        break
      case 'Home':
        event.preventDefault()
        newTab = TABS[0]
        if (newTab) {
          handleTabChange(newTab.id)
          tabRefs.current[newTab.id]?.focus()
        }
        break
      case 'End':
        event.preventDefault()
        newTab = TABS[TABS.length - 1]
        if (newTab) {
          handleTabChange(newTab.id)
          tabRefs.current[newTab.id]?.focus()
        }
        break
    }
  }, [handleTabChange])

  return (
    <div>
      {/* Tab List */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex border-b border-gray-200 dark:border-gray-700 mb-6"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels - all rendered, hidden via CSS */}
      {children(activeTab)}
    </div>
  )
}

interface TabPanelProps {
  id: SettingsTab
  activeTab: SettingsTab
  children: React.ReactNode
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={activeTab !== id}
      tabIndex={0}
    >
      {children}
    </div>
  )
}
