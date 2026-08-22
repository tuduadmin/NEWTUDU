import { Link } from 'react-router-dom'
import { Car, MapPin } from 'lucide-react'
import { getRoadTripsForUser, type RoadTrip } from '../lib/roadTrips'
import { appFieldClass } from '../lib/formFieldClasses'

type AddToRoadTripModalProps = {
  eventIds: string[]
  userEmail: string
  onClose: () => void
  onSuccess: (trip: RoadTrip) => void
}

export default function AddToRoadTripModal({
  eventIds,
  userEmail,
  onClose,
  onSuccess,
}: AddToRoadTripModalProps) {
  const trips = getRoadTripsForUser(userEmail).filter((trip) => trip.status !== 'completed')

  function handleSelectTrip(trip: RoadTrip) {
    onSuccess(trip)
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/40 backdrop-blur-sm"
        aria-label="Close road trip picker"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="road-trip-picker-title"
        className="fixed inset-x-4 bottom-[calc(var(--app-bottom-nav-h)+1rem)] z-[calc(var(--z-modal)+1)] mx-auto max-w-lg overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-xl"
      >
        <div className="border-b border-app-subtle px-4 py-3">
          <h2 id="road-trip-picker-title" className="font-display text-sm font-bold text-brown">
            Add to road trip
          </h2>
          <p className="mt-0.5 text-xs text-brown-muted">
            {eventIds.length} event{eventIds.length === 1 ? '' : 's'} selected
          </p>
        </div>

        {trips.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Car size={28} className="mx-auto text-brown-muted" />
            <p className="mt-2 text-sm text-brown-muted">No active road trips yet.</p>
            <Link
              to="/road-trip"
              onClick={onClose}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[14px] bg-gradient-tudu px-6 py-2.5 font-display text-xs font-bold text-white no-underline shadow-md"
            >
              Start a road trip
            </Link>
          </div>
        ) : (
          <ul className="max-h-64 overflow-y-auto divide-y divide-app-subtle">
            {trips.map((trip) => (
              <li key={trip.id}>
                <button
                  type="button"
                  onClick={() => handleSelectTrip(trip)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-cream/60"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
                    <MapPin size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-brown">{trip.name}</span>
                    <span className="mt-0.5 block text-xs text-brown-muted">
                      {trip.stopEventIds.length} stop{trip.stopEventIds.length === 1 ? '' : 's'}
                      {trip.destination ? ` · ${trip.destination}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-app-subtle p-3">
          <button type="button" onClick={onClose} className={`${appFieldClass} w-full py-2.5 text-sm font-semibold`}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
