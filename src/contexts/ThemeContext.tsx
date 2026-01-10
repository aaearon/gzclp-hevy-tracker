/**
 * Theme Context
 *
 * Provides dark mode support with three modes:
 * - light: Force light theme
 * - dark: Force dark theme
 * - system: Follow system preference (default)
 *
 * Persists preference to localStorage and applies 'dark' class to document.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// =============================================================================
// Types
// =============================================================================

export type Theme = 'light' | 'dark'
export type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  /** The currently applied theme (resolved from preference) */
  theme: Theme
  /** The user's stored preference */
  preference: ThemePreference
  /** Update the theme preference */
  setPreference: (pref: ThemePreference) => void
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'gzclp_theme'

// =============================================================================
// Helpers
// =============================================================================

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === 'system') {
    return getSystemTheme()
  }
  return preference
}

// =============================================================================
// Context
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference)
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(preference))

  // Update localStorage and state when preference changes
  const setPreference = (pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref)
    setPreferenceState(pref)
  }

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') {
      setTheme(preference)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    // Set initial value
    setTheme(mediaQuery.matches ? 'dark' : 'light')

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    return () => { mediaQuery.removeEventListener('change', handleChange); }
  }, [preference])

  // Apply dark class to document
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
