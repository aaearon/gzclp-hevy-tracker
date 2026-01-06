/**
 * Toast Notification System
 *
 * Provides global toast notification functionality for the app.
 * Supports success, error, info, and PR celebration toast types.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// =============================================================================
// Types
// =============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'pr'

export interface Toast {
  id: string
  type: ToastType
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

// =============================================================================
// Context
// =============================================================================

const ToastContext = createContext<ToastContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${String(Date.now())}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev, { ...toast, id }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// =============================================================================
// Components
// =============================================================================

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const bgColors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    pr: 'bg-yellow-500',
  }

  const icons: Record<ToastType, string> = {
    success: '\u2713',
    error: '\u2717',
    info: '\u2139',
    pr: '\uD83C\uDFC6',
  }

  return (
    <div
      className={`
        ${bgColors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg
        flex items-center gap-3 min-w-[300px] max-w-[400px]
        animate-slide-in-right
      `}
      role="alert"
      aria-live="polite"
    >
      <span className="text-xl">{icons[toast.type]}</span>
      <div className="flex-1">
        <p>{toast.message}</p>
      </div>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick()
            onDismiss(toast.id)
          }}
          className="px-2 py-1 bg-white/20 rounded text-sm hover:bg-white/30"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => { onDismiss(toast.id) }}
        className="text-white/60 hover:text-white"
        aria-label="Dismiss"
      >
        \u2715
      </button>
    </div>
  )
}
