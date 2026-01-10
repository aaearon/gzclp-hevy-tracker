/**
 * PageSkeleton Component
 *
 * Loading placeholder for lazy-loaded pages.
 * [Task 3.4] Code splitting implementation
 */

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
      <div className="h-16 bg-gray-200 dark:bg-gray-800" />
      <div className="container mx-auto px-4 py-8 space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
    </div>
  )
}
