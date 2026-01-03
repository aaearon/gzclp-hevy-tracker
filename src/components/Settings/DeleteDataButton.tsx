/**
 * DeleteDataButton Component
 *
 * Button to delete all local data with confirmation.
 */

import { useState } from 'react'

interface DeleteDataButtonProps {
  onDelete: () => void
  className?: string
}

export function DeleteDataButton({ onDelete, className = '' }: DeleteDataButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDeleteClick = () => {
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    onDelete()
    setShowConfirm(false)
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDeleteClick}
        className={`
          min-h-[44px] min-w-[44px] px-4 py-2
          bg-red-600 hover:bg-red-700
          text-white font-medium rounded-lg
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          ${className}
        `}
      >
        Reset All Data
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2
              id="delete-dialog-title"
              className="text-lg font-semibold text-gray-900 mb-4"
            >
              Confirm Reset
            </h2>

            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Are you sure you want to delete all your data? This will
                remove all your exercise configurations, progression history, and settings. This
                action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-[44px] px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="min-h-[44px] px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Yes, Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
