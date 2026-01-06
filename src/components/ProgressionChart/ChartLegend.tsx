/**
 * ChartLegend Component
 *
 * Legend showing the meaning of chart elements.
 */

interface ChartLegendProps {
  showPredictions: boolean
}

export function ChartLegend({ showPredictions }: ChartLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
      {/* Historical line */}
      <div className="flex items-center gap-1.5">
        <div className="h-0.5 w-6 bg-indigo-500" />
        <span>Actual</span>
      </div>

      {/* Predicted line */}
      {showPredictions && (
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-6 border-t-2 border-dashed border-indigo-300" />
          <span>Predicted</span>
        </div>
      )}

      {/* Event markers */}
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span>Deload</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <span>Stage Change</span>
      </div>
    </div>
  )
}
