/**
 * DashboardAlerts Component
 *
 * Displays update status messages and discrepancy alerts.
 *
 * [Task 3.1] Extracted from Dashboard/index.tsx
 */

import type { WeightUnit, Tier } from '@/types/state'
import { UpdateStatus } from './UpdateStatus'
import { DiscrepancyAlert, type DiscrepancyInfo } from './DiscrepancyAlert'

export interface DashboardAlertsProps {
  /** Update error message, if any */
  updateError: string | null
  /** Whether the last update was successful */
  updateSuccess: boolean
  /** List of weight discrepancies to display */
  discrepancies: DiscrepancyInfo[]
  /** Weight unit for display */
  weightUnit: WeightUnit
  /** Callback to dismiss update status */
  onDismissUpdate: () => void
  /** Callback when user chooses to use actual weight from Hevy */
  onUseActualWeight: (exerciseId: string, actualWeight: number, tier: Tier) => void
  /** Callback when user chooses to keep stored weight */
  onKeepStoredWeight: (exerciseId: string, actualWeight: number, tier: Tier) => void
  /** Callback to dismiss all discrepancies */
  onDismissDiscrepancies: () => void
}

export function DashboardAlerts({
  updateError,
  updateSuccess,
  discrepancies,
  weightUnit,
  onDismissUpdate,
  onUseActualWeight,
  onKeepStoredWeight,
  onDismissDiscrepancies,
}: DashboardAlertsProps) {
  const hasUpdateAlert = updateError !== null || updateSuccess
  const hasDiscrepancies = discrepancies.length > 0

  if (!hasUpdateAlert && !hasDiscrepancies) {
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

      {/* Discrepancy Alert */}
      {hasDiscrepancies && (
        <DiscrepancyAlert
          discrepancies={discrepancies}
          unit={weightUnit}
          onUseActualWeight={onUseActualWeight}
          onKeepStoredWeight={onKeepStoredWeight}
          onDismiss={onDismissDiscrepancies}
        />
      )}
    </div>
  )
}
