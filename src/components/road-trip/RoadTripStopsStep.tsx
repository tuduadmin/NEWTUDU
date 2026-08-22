import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import GradientButton from '../GradientButton'
import RoadTripMapHero from './RoadTripMapHero'
import RoadTripStopList from './RoadTripStopList'
import SavedEventPicker from './SavedEventPicker'
import { appFieldClass } from '../../lib/formFieldClasses'
import type { DiscoverEvent } from '../../data/discoverEvents'
import { resolveEventFromAnySource } from '../../lib/bucketLists'
import { projectTripRouteToMapPins, getRoadTripMapViewFromPoints } from '../../lib/roadTripGeo'
import { getTripPlannedCities, getTripRoutePoints } from '../../lib/roadTripRoute'
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

  const stops = getRoadTripStops(trip)
  const plannedCities = getTripPlannedCities(trip)
  const routePoints = getTripRoutePoints(trip, stops)
  const mapPins = useMemo(
    () => projectTripRouteToMapPins(plannedCities, stops),
    [plannedCities, stops],
  )
  const mapView = useMemo(
    () => getRoadTripMapViewFromPoints(routePoints),
    [routePoints],
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
      <RoadTripMapHero
        tripName={trip.name}
        destination={trip.destination}
        pins={mapPins}
        stopCount={mapPins.length || stops.length}
        mapView={mapView}
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
            placeholder="Search saved events…"
            className={`${appFieldClass} w-full py-2.5 pl-9 pr-3`}
          />
        </div>
        <SavedEventPicker
          events={savedEvents}
          selectedIds={selectedIds}
          onToggle={handleToggleSaved}
          searchQuery={savedSearch}
        />
      </div>

      <GradientButton
        type="button"
        fullWidth
        className="px-4 py-2.5 text-sm"
        onClick={() => navigate(`/road-trip/find-more/${trip.id}`)}
      >
        <Search size={16} className="mr-1 inline" />
        Find more stops
      </GradientButton>
    </section>
  )
}
