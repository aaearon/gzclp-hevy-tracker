/**
 * DashboardHeader Component
 *
 * Header section of the Dashboard containing title, sync status,
 * pending changes indicator, and action buttons.
 *
 * [Task 3.1] Extracted from Dashboard/index.tsx
 */

import { Link } from 'react-router'
import { SyncStatus } from './SyncStatus'
import { PendingBadge } from './PendingBadge'
import { SyncButton } from './SyncButton'

export interface DashboardHeaderProps {
  /** Last sync timestamp in ISO format */
  lastSync: string | null
  /** Sync error message, if any */
  syncError: string | null
  /** Number of pending changes to review */
  pendingChangesCount: number
  /** Whether a sync is in progress */
  isSyncing: boolean
  /** Whether an update to Hevy is in progress */
  isUpdating: boolean
  /** Whether the app is offline */
  isOffline: boolean
  /** Whether the user has an API key configured */
  hasApiKey: boolean
  /** Whether local progression needs to be pushed to Hevy */
  needsPush: boolean
  /** Current training week number */
  currentWeek: number
  /** Workouts completed this week */
  weekCompleted: number
  /** Workouts per week target */
  weekTotal: number
  /** Callback to trigger a sync (fetch from Hevy) */
  onSync: () => void
  /** Callback to trigger a push (open push dialog) */
  onPush: () => void
  /** Callback to open the review modal */
  onOpenReviewModal: () => void
  /** Callback to dismiss sync error */
  onDismissError: () => void
}

export function DashboardHeader({
  lastSync,
  syncError,
  pendingChangesCount,
  isSyncing,
  isUpdating,
  isOffline,
  hasApiKey,
  needsPush,
  currentWeek,
  weekCompleted,
  weekTotal,
  onSync,
  onPush,
  onOpenReviewModal,
  onDismissError,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
        <div className="min-w-0 flex-shrink">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">GZCLP Tracker</h1>
            <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Week {currentWeek} - {weekCompleted}/{weekTotal}
            </span>
          </div>
          <SyncStatus lastSyncTime={lastSync} error={syncError} onDismissError={onDismissError} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Pending changes indicator */}
          {pendingChangesCount > 0 && (
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="flex items-center gap-2 rounded-md border border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[44px]"
            >
              <span>Review changes:</span>
              <PendingBadge count={pendingChangesCount} />
            </button>
          )}

          {/* Unified Sync/Push button */}
          <SyncButton
            onSync={onSync}
            onPush={onPush}
            isSyncing={isSyncing}
            isUpdating={isUpdating}
            needsPush={needsPush}
            disabled={!hasApiKey || isOffline}
          />

          {/* Settings button - using React Router Link */}
          <Link
            to="/settings"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}
