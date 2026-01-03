/**
 * LoadingSkeleton Components
 *
 * Skeleton loading states for various UI elements.
 */

interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton component with shimmer animation.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * Text line skeleton.
 */
interface TextSkeletonProps extends SkeletonProps {
  width?: 'full' | 'half' | 'third' | 'quarter'
}

export function TextSkeleton({ width = 'full', className = '' }: TextSkeletonProps) {
  const widthClasses = {
    full: 'w-full',
    half: 'w-1/2',
    third: 'w-1/3',
    quarter: 'w-1/4',
  }

  return <Skeleton className={`h-4 ${widthClasses[width]} ${className}`} />
}

/**
 * Card skeleton for exercise cards.
 */
export function CardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <TextSkeleton width="half" />
      </div>
      <TextSkeleton width="third" className="mb-2" />
      <TextSkeleton width="quarter" />
    </div>
  )
}

/**
 * Button skeleton.
 */
export function ButtonSkeleton({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-11 w-28 rounded-lg ${className}`} />
}

/**
 * List item skeleton.
 */
export function ListItemSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      <Skeleton className="h-10 w-10 rounded" />
      <div className="flex-1">
        <TextSkeleton width="half" className="mb-2" />
        <TextSkeleton width="quarter" />
      </div>
    </div>
  )
}

/**
 * Dashboard skeleton for initial loading state.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <TextSkeleton width="quarter" className="h-6" />
        <ButtonSkeleton />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Exercise list skeleton */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <TextSkeleton width="third" className="h-5" />
        </div>
        <div className="divide-y">
          <ListItemSkeleton className="px-4" />
          <ListItemSkeleton className="px-4" />
          <ListItemSkeleton className="px-4" />
        </div>
      </div>
    </div>
  )
}

/**
 * Settings skeleton for loading state.
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section skeleton */}
      <div className="bg-white rounded-lg shadow p-4">
        <TextSkeleton width="quarter" className="h-5 mb-4" />
        <div className="flex items-center justify-between">
          <TextSkeleton width="third" />
          <Skeleton className="h-10 w-32 rounded" />
        </div>
      </div>

      {/* Button group skeleton */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <TextSkeleton width="quarter" className="h-5" />
        <div className="space-y-3">
          <ButtonSkeleton className="w-full" />
          <ButtonSkeleton className="w-full" />
          <ButtonSkeleton className="w-full" />
        </div>
      </div>
    </div>
  )
}
