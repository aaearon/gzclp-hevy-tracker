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

const changeTypeLabels: Record<string, string> = {
  progress: 'Progress',
  stage_change: 'Stage Change',
  deload: 'Deload',
  repeat: 'Repeat',
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

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{change.exerciseName}</h3>
          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {changeTypeLabels[change.type] ?? change.type}
          </span>
        </div>
        <span className="text-sm text-gray-500">{change.tier}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-gray-500">
          {change.currentWeight} {unit}
        </span>
        <span className="text-gray-400">-&gt;</span>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              role="spinbutton"
              value={editWeight}
              onChange={(e) => { setEditWeight(parseFloat(e.target.value)) }}
              className="w-20 rounded border px-2 py-1"
              step="2.5"
            />
            <button
              type="button"
              onClick={handleConfirmEdit}
              className="rounded bg-green-500 px-3 py-2 text-xs text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
            >
              Confirm
            </button>
          </div>
        ) : (
          <span className="font-medium text-gray-900">
            {change.newWeight} {unit}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">{change.reason}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApply}
          className="rounded bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => { setIsEditing(true) }}
          className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px]"
        >
          Edit
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
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6"
        onClick={(e) => { e.stopPropagation() }}
      >
        <div className="flex items-center justify-between border-b pb-4">
          <h2 id="review-modal-title" className="text-xl font-semibold text-gray-900">Review Changes</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            <p className="text-center text-gray-500">No pending changes</p>
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

              <div className="border-t pt-4">
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
