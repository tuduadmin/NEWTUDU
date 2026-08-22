import type { RoadTrip } from '../../lib/roadTrips'

type RoadTripProgressBarProps = {
  visitedCount: number
  totalStops: number
  percent: number
  compact?: boolean
}

export default function RoadTripProgressBar({
  visitedCount,
  totalStops,
  percent,
  compact = false,
}: RoadTripProgressBarProps) {
  if (totalStops === 0) {
    return (
      <p className="text-xs text-brown-muted">Add stops to track progress on the road.</p>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className={`font-semibold text-brown ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {visitedCount} of {totalStops} stop{totalStops === 1 ? '' : 's'} visited
        </p>
        <p className={`font-bold text-orange ${compact ? 'text-[11px]' : 'text-xs'}`}>{percent}%</p>
      </div>
      <div
        className={`mt-1.5 overflow-hidden rounded-full bg-cream-dark ${compact ? 'h-1.5' : 'h-2'}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${visitedCount} of ${totalStops} stops visited`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange to-teal-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function getRoadTripProgressLabel(trip: RoadTrip, visitedCount: number, totalStops: number): string {
  if (trip.status === 'completed') return 'Trip complete'
  if (trip.status === 'active') return `${visitedCount}/${totalStops} on the road`
  if (visitedCount > 0) return `${visitedCount}/${totalStops} visited so far`
  if (totalStops > 0) return `${totalStops} stop${totalStops === 1 ? '' : 's'} planned`
  return 'No stops yet'
}
