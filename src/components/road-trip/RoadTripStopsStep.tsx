import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import DiscoverEventDetailPanel from '../DiscoverEventDetailPanel'
import GradientButton from '../GradientButton'
import RoadTripMap from './RoadTripMap'
import RoadTripStopList from './RoadTripStopList'
import SavedEventPicker from './SavedEventPicker'
import { appFieldClass } from '../../lib/formFieldClasses'
import type { DiscoverEvent } from '../../data/discoverEvents'
import { resolveEventFromAnySource } from '../../lib/bucketLists'
import { buildRoadTripMapStops } from '../../lib/roadTripMapModel'
import { getTripGoogleMapsDirectionsUrl } from '../../lib/roadTripRoute'
import { getSavedEventIdsForUser } from '../../lib/savedEvents'
import type { RoadTrip } from '../../lib/roadTrips'
import {
  addStopToRoadTrip,
  getRoadTripStops,
  removeStopFromRoadTrip,
} from '../../lib/roadTrips'

type RoadTripStopsStepProps = {
  trip: RoadTrip
  userEmail: string
  onRefresh: () => void
}

export default function RoadTripStopsStep({ trip, userEmail, onRefresh }: RoadTripStopsStepProps) {
  const navigate = useNavigate()
  const [savedSearch, setSavedSearch] = useState('')
  const [detailEvent, setDetailEvent] = useState<DiscoverEvent | null>(null)

  const stops = getRoadTripStops(trip)
  const mapStops = useMemo(() => buildRoadTripMapStops(trip, stops), [trip, stops])
  const directionsUrl = useMemo(
    () => getTripGoogleMapsDirectionsUrl(trip, stops),
    [trip, stops],
  )

  const savedEvents = useMemo(() => {
    return getSavedEventIdsForUser(userEmail)
      .map((id) => resolveEventFromAnySource(id))
      .filter(Boolean) as DiscoverEvent[]
  }, [userEmail, trip.stopEventIds])

  const selectedIds = useMemo(() => new Set(trip.stopEventIds), [trip.stopEventIds])

  function handleToggleSaved(eventId: string, selected: boolean) {
    if (selected) {
      if (trip.stopEventIds.length >= (trip.maxStops ?? 8)) return
      addStopToRoadTrip(trip.id, eventId)
    } else {
      removeStopFromRoadTrip(trip.id, eventId)
    }
    onRefresh()
  }

  function handleRemoveStop(eventId: string) {
    removeStopFromRoadTrip(trip.id, eventId)
    onRefresh()
  }

  return (
    <section className="space-y-5 pt-3">
      <RoadTripMap
        stops={mapStops}
        directionsUrl={directionsUrl}
        onEventSelect={(event) => setDetailEvent(event)}
      />

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brown-muted">
          Stops on this trip ({stops.length})
        </p>
        <RoadTripStopList stops={stops} onDeleteStop={handleRemoveStop} />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brown-muted">
          From your saved
        </p>
        <div className="relative mb-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted"
          />
          <input
            type="search"
            value={savedSearch}
            onChange={(e) => setSavedSearch(e.target.value)}
            placeholder="Search saved events..."
            className={`${appFieldClass} py-2.5 pl-9`}
          />
        </div>
        <SavedEventPicker
          events={savedEvents}
          searchQuery={savedSearch}
          selectedIds={selectedIds}
          onToggle={handleToggleSaved}
        />
      </div>

      <GradientButton
        type="button"
        fullWidth
        className="rounded-[14px] py-3 text-sm font-bold"
        onClick={() => navigate(`/road-trip/find-more/${trip.id}`)}
      >
        Find more stops near route
      </GradientButton>

      {detailEvent && (
        <DiscoverEventDetailPanel
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onSave={() => setDetailEvent(null)}
        />
      )}
    </section>
  )
}
