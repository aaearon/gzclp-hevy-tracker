/**
 * ChartSkeleton Component
 *
 * Loading placeholder for lazy-loaded chart components.
 * [Task 3.4] Code splitting implementation
 */

export function ChartSkeleton() {
  return (
    <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Loading chart...</span>
    </div>
  )
}
