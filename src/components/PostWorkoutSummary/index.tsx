/**
 * Post-Workout Summary Panel
 *
 * Slide-in panel that displays workout completion summary with:
 * - Exercise results (success/failure indicators)
 * - AMRAP reps for T1/T3
 * - New PR celebrations
 * - Weight progressions
 * - Stage changes
 * - Deloads (framed positively)
 *
 * [GAP-02] REQ-POST-001, REQ-POST-002, REQ-POST-003, REQ-POST-004
 */

import { useEffect } from 'react'
import type { WorkoutSummaryData, Tier } from '@/types/state'

interface PostWorkoutSummaryProps {
  isOpen: boolean
  onClose: () => void
  onReviewChanges: () => void
  summary: WorkoutSummaryData | null
  unit: 'kg' | 'lbs'
}

export function PostWorkoutSummary({
  isOpen,
  onClose,
  onReviewChanges,
  summary,
  unit,
}: PostWorkoutSummaryProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen || !summary) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close panel"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose()
        }}
      />

      {/* Slide-in Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out translate-x-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
      >
        {/* Header */}
        <div className="bg-green-600 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 id="summary-title" className="text-3xl font-bold mb-2">Workout Complete!</h2>
          <div className="text-green-100">
            {summary.dayName} &bull; {new Date(summary.completedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-200px)]">
          {/* Exercise Results */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Exercises
            </h3>
            {summary.exercises.map((ex, idx) => (
              <ExerciseResult key={`${ex.name}-${String(idx)}`} exercise={ex} unit={unit} />
            ))}
          </div>

          {/* PRs Section */}
          {summary.newPRs.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 font-bold text-yellow-800 mb-2">
                <span className="text-xl">&#127942;</span> New Personal Records!
              </div>
              {summary.newPRs.map((pr, idx) => (
                <div key={`${pr.exercise}-${String(idx)}`} className="text-yellow-700">
                  {pr.exercise}: {String(pr.reps)} reps @ {String(pr.weight)}{unit}
                </div>
              ))}
            </div>
          )}

          {/* Progressions */}
          {summary.progressions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="font-bold text-blue-800 mb-2">
                &#11014;&#65039; Weight Increases
              </div>
              {summary.progressions.map((p, idx) => (
                <div key={`${p.exercise}-${String(idx)}`} className="text-blue-700">
                  {p.exercise}: {String(p.oldWeight)}{unit} &rarr; {String(p.newWeight)}{unit}
                </div>
              ))}
            </div>
          )}

          {/* Stage Changes */}
          {summary.stageChanges.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="font-bold text-purple-800 mb-2">
                &#128260; Stage Changes
              </div>
              {summary.stageChanges.map((s, idx) => (
                <div key={`${s.exercise}-${String(idx)}`} className="text-purple-700">
                  {s.exercise}: Stage {String(s.oldStage + 1)} &rarr; Stage {String(s.newStage + 1)}
                </div>
              ))}
            </div>
          )}

          {/* Deloads (framed positively) */}
          {summary.deloads.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="font-bold text-orange-800 mb-2">
                &#128170; Deload &amp; Rebuild
              </div>
              <p className="text-sm text-orange-600 mb-2">
                Time to reset and come back stronger!
              </p>
              {summary.deloads.map((d, idx) => (
                <div key={`${d.exercise}-${String(idx)}`} className="text-orange-700">
                  {d.exercise}: Reset to {String(d.newWeight)}{unit}
                </div>
              ))}
            </div>
          )}

          {/* Motivational message if everything succeeded */}
          {summary.exercises.every(e => e.success) && summary.deloads.length === 0 && (
            <div className="text-center py-4 text-green-600">
              <div className="text-2xl mb-2">&#127881;</div>
              <div className="font-medium">Great job! All exercises completed successfully.</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
          <button
            onClick={onReviewChanges}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium mb-2 hover:bg-blue-700 transition-colors"
          >
            Review Changes
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  )
}

// Sub-component for exercise results
interface ExerciseResultProps {
  exercise: {
    name: string
    tier: Tier
    weight: number
    setsCompleted: number
    setsTarget: number
    success: boolean
    amrapReps?: number
  }
  unit: 'kg' | 'lbs'
}

function ExerciseResult({ exercise, unit }: ExerciseResultProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
        exercise.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {exercise.success ? '✓' : '✗'}
      </div>
      <div className="flex-1">
        <div className="font-medium">{exercise.name}</div>
        <div className="text-sm text-gray-500">
          {exercise.tier} &bull; {exercise.weight}{unit} &bull; {exercise.setsCompleted}/{exercise.setsTarget} sets
        </div>
        {exercise.amrapReps !== undefined && exercise.amrapReps > 0 && (
          <div className="text-sm text-blue-600">
            AMRAP: {exercise.amrapReps} reps
          </div>
        )}
      </div>
    </div>
  )
}
