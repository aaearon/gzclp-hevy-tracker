/**
 * ReviewModal Component
 *
 * Modal for reviewing and confirming pending progression changes.
 * [US3] User Story 3 - Review and Confirm Progression Changes
 * [T104] Keyboard navigation support
 * [Task 4.2] Undo reject functionality
 */

import { useState, useEffect, useRef } from 'react'
import type { PendingChange, WeightUnit } from '@/types/state'

interface ReviewModalProps {
  isOpen: boolean
  pendingChanges: PendingChange[]
  unit: WeightUnit
  onApply: (change: PendingChange) => void
  onApplyAll: () => void
  onReject: (changeId: string) => void
  onModify: (changeId: string, newWeight: number) => void
  onClose: () => void
  // Undo props [Task 4.2]
  recentlyRejected?: PendingChange | null
  onUndoReject?: () => void
}

// Change type display configuration with colors
const changeTypeConfig: Record<string, { label: string; bgClass: string; textClass: string }> = {
  progress: {
    label: 'Weight Increase',
    bgClass: 'bg-green-100 dark:bg-green-900',
    textClass: 'text-green-700 dark:text-green-300',
  },
  stage_change: {
    label: 'Stage Change',
    bgClass: 'bg-amber-100 dark:bg-amber-900',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  deload: {
    label: 'Deload',
    bgClass: 'bg-red-100 dark:bg-red-900',
    textClass: 'text-red-700 dark:text-red-300',
  },
  repeat: {
    label: 'Repeat Weight',
    bgClass: 'bg-gray-100 dark:bg-gray-700',
    textClass: 'text-gray-700 dark:text-gray-300',
  },
}

/**
 * Format workout date for display
 */
function formatWorkoutDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function PendingChangeCard({
  change,
  unit,
  onApply,
  onReject,
  onModify,
}: {
  change: PendingChange
  unit: WeightUnit
  onApply: () => void
  onReject: () => void
  onModify: (newWeight: number) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editWeight, setEditWeight] = useState(change.newWeight)

  const handleConfirmEdit = () => {
    onModify(editWeight)
    setIsEditing(false)
  }

  const typeConfig = changeTypeConfig[change.type] ?? {
    label: change.type,
    bgClass: 'bg-gray-100 dark:bg-gray-700',
    textClass: 'text-gray-700 dark:text-gray-300',
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      {/* Header with day badge and tier */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {/* Exercise name */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{change.exerciseName}</h3>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Change type badge - prominent */}
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${typeConfig.bgClass} ${typeConfig.textClass}`}>
              {typeConfig.label}
            </span>

            {/* Day badge */}
            {change.day && (
              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                {change.day}
              </span>
            )}

            {/* Tier badge */}
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
              {change.tier}
            </span>
          </div>
        </div>
      </div>

      {/* Discrepancy indicator - shown when actual weight differs from expected */}
      {change.discrepancy && (
        <div className="mt-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-yellow-500 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <span className="font-medium">Different weight used:</span>{' '}
              Lifted{' '}
              <span className={change.discrepancy.actualWeight > change.discrepancy.storedWeight ? 'text-green-600 dark:text-green-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                {change.discrepancy.actualWeight} {unit}
              </span>
              {' '}(expected {change.discrepancy.storedWeight} {unit})
            </p>
          </div>
        </div>
      )}

      {/* Weight change display */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center gap-2 text-lg">
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            {change.currentWeight} {unit}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                role="spinbutton"
                value={editWeight}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value)
                  setEditWeight(isNaN(parsed) ? 0 : parsed)
                }}
                className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-lg"
                step="2.5"
              />
              <button
                type="button"
                onClick={handleConfirmEdit}
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              >
                Confirm
              </button>
            </div>
          ) : (
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {change.newWeight} {unit}
            </span>
          )}
        </div>
      </div>

      {/* Reason */}
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{change.reason}</p>

      {/* Workout datetime */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Workout: {formatWorkoutDate(change.workoutDate)}</span>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => { setIsEditing(true) }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px]"
        >
          Edit Weight
        </button>
      </div>
    </div>
  )
}

export function ReviewModal({
  isOpen,
  pendingChanges,
  unit,
  onApply,
  onApplyAll,
  onReject,
  onModify,
  onClose,
  recentlyRejected,
  onUndoReject,
}: ReviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Handle Escape key to close modal [T104]
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown) }
  }, [isOpen, onClose])

  // Focus trap and initial focus [T104]
  useEffect(() => {
    if (!isOpen) return

    // Focus the close button when modal opens
    closeButtonRef.current?.focus()

    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement

    return () => {
      // Restore focus when modal closes
      previouslyFocused.focus()
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  // Handle backdrop click to close
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div
        ref={modalRef}
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white dark:bg-gray-900 p-6"
        onClick={(e) => { e.stopPropagation() }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 id="review-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">Review Changes</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {pendingChanges.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No pending changes</p>
          ) : (
            <>
              {pendingChanges.map((change) => (
                <PendingChangeCard
                  key={change.id}
                  change={change}
                  unit={unit}
                  onApply={() => { onApply(change) }}
                  onReject={() => { onReject(change.id) }}
                  onModify={(newWeight) => { onModify(change.id, newWeight) }}
                />
              ))}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={onApplyAll}
                  className="w-full rounded bg-green-600 py-3 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]"
                >
                  Apply All
                </button>
              </div>
            </>
          )}
        </div>

        {/* Undo Toast [Task 4.2] */}
        {recentlyRejected && onUndoReject && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-lg bg-gray-800 px-4 py-3 text-white shadow-lg">
            <span>Rejected {recentlyRejected.exerciseName}</span>
            <button
              type="button"
              onClick={onUndoReject}
              className="rounded bg-blue-500 px-3 py-1 text-sm hover:bg-blue-600 min-h-[36px]"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
