/**
 * PendingBadge Component
 *
 * Visual indicator showing the number of pending progression changes.
 */

interface PendingBadgeProps {
  count: number
}

export function PendingBadge({ count }: PendingBadgeProps) {
  if (count === 0) {
    return null
  }

  return (
    <span
      data-testid="pending-badge"
      className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white"
    >
      {count}
    </span>
  )
}
