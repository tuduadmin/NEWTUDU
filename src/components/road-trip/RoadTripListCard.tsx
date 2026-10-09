import { Eye, MapPin, Pencil, Trash2 } from 'lucide-react'
import { ModeActionTile } from '../mode/ModeActionTile'
import type { RoadTrip } from '../../lib/roadTrips'
import { getRoadTripProgress, getRoadTripStops } from '../../lib/roadTrips'
import RoadTripProgressBar from './RoadTripProgressBar'
import { formatPlannedCitiesDestination, getTripPlannedCities } from '../../lib/roadTripRoute'

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop'

type RoadTripListCardProps = {
  trip: RoadTrip
  readOnly?: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function getTripCoverImage(trip: RoadTrip): string {
  const cover = trip.coverImageUrl?.trim()
  if (cover) return cover
  const stops = getRoadTripStops(trip)
  return stops[0]?.image ?? DEFAULT_COVER
}

export function getTripLocation(trip: RoadTrip): string {
  const cities = getTripPlannedCities(trip)
  if (cities.length > 0) return formatPlannedCitiesDestination(cities)
  const destination = trip.destination?.trim()
  if (destination && destination !== 'Add stops to set route') {
    return destination
  }
  const stops = getRoadTripStops(trip)
  if (stops.length > 0) {
    const stopCities = [...new Set(stops.map((s) => s.city).filter(Boolean))]
    if (stopCities.length > 0) return stopCities.join(' → ')
  }
  return 'Route TBD'
}

export function getStatusBadge(status: RoadTrip['status']): { label: string; className: string } {
  switch (status) {
    case 'draft':
      return {
        label: 'DRAFT',
        className: 'bg-warm-yellow text-brown',
      }
    case 'active':
      return {
        label: 'ACTIVE',
        className: 'bg-success/90 text-white',
      }
    case 'completed':
      return {
        label: 'PAST',
        className: 'bg-brown-muted/80 text-white',
      }
    case 'planning':
    default:
      return {
        label: 'PLANNED',
        className: 'bg-orange/90 text-white',
      }
  }
}

export default function RoadTripListCard({
  trip,
  readOnly = false,
  onView,
  onEdit,
  onDelete,
}: RoadTripListCardProps) {
  const cover = getTripCoverImage(trip)
  const location = getTripLocation(trip)
  const badge = getStatusBadge(trip.status)
  const progress = getRoadTripProgress(trip)
  const showProgress =
    progress.totalStops > 0 &&
    (trip.status === 'active' || trip.status === 'completed' || progress.visitedCount > 0)

  return (
    <article className="overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm transition">
      <button
        type="button"
        onClick={onView}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-cream-dark text-left"
      >
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <div className="overlay-readability absolute inset-0" />

        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-[14px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
        >
          {(trip.status === 'draft' || !trip.status) && <Pencil size={11} aria-hidden />}
          {badge.label}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h2 className="font-display text-lg font-extrabold leading-tight text-white">{trip.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-white/80">
            <MapPin size={12} className="shrink-0 text-orange" aria-hidden />
            <span className="truncate">{location}</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/55">
            {showProgress
              ? `${progress.visitedCount}/${progress.totalStops} visited`
              : `${trip.stopEventIds.length} stop${trip.stopEventIds.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </button>

      {showProgress && (
        <div className="border-t border-app-subtle px-3 py-2">
          <RoadTripProgressBar
            visitedCount={progress.visitedCount}
            totalStops={progress.totalStops}
            percent={progress.percent}
            compact
          />
        </div>
      )}

      <div className={`grid gap-2 border-t border-app-subtle p-2.5 ${readOnly ? 'grid-cols-1' : 'grid-cols-3'}`}>
        <ModeActionTile label="View" tone="neutral" onClick={onView}>
          <Eye size={18} aria-hidden />
        </ModeActionTile>
        {!readOnly && (
          <>
            <ModeActionTile label="Edit" tone="edit" onClick={onEdit}>
              <Pencil size={18} aria-hidden />
            </ModeActionTile>
            <ModeActionTile label="Del" tone="danger" onClick={onDelete}>
              <Trash2 size={18} aria-hidden />
            </ModeActionTile>
          </>
        )}
      </div>
    </article>
  )
}
