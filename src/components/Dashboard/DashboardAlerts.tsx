/**
 * DashboardAlerts Component
 *
 * Displays update status messages.
 * Note: Weight discrepancy alerts are now shown in the Review Modal
 * as part of the consolidated UX (feature/consolidate-discrepancy-ui).
 *
 * [Task 3.1] Extracted from Dashboard/index.tsx
 */

import { UpdateStatus } from './UpdateStatus'

export interface DashboardAlertsProps {
  /** Update error message, if any */
  updateError: string | null
  /** Whether the last update was successful */
  updateSuccess: boolean
  /** Callback to dismiss update status */
  onDismissUpdate: () => void
}

export function DashboardAlerts({
  updateError,
  updateSuccess,
  onDismissUpdate,
}: DashboardAlertsProps) {
  const hasUpdateAlert = updateError !== null || updateSuccess

  if (!hasUpdateAlert) {
    return null
  }

  return (
    <div className="container mx-auto px-4 pt-4 space-y-4">
      {/* Update Status */}
      {hasUpdateAlert && (
        <UpdateStatus
          status={updateError ? 'error' : updateSuccess ? 'success' : 'idle'}
          error={updateError}
          onDismiss={onDismissUpdate}
        />
      )}
    </div>
  )
}
