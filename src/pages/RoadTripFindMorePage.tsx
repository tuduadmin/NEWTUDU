import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import RoadTripEventsCarousel from '../components/road-trip/RoadTripEventsCarousel'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import { BackIconButton } from '../components/NavActionButtons'
import DiscoverEventDetailPanel from '../components/DiscoverEventDetailPanel'
import RoadTripMap from '../components/road-trip/RoadTripMap'
import type { DiscoverEvent } from '../data/discoverEvents'
import RoadTripStopSettings from '../components/road-trip/RoadTripStopSettings'
import { getCurrentUser } from '../lib/auth'
import { buildRoadTripMapStops } from '../lib/roadTripMapModel'
import { filterEventsForRoadTrip, INTEREST_CATEGORIES } from '../lib/roadTripDiscover'
import CategoryIcon from '../components/CategoryIcon'
import {
  addStopToRoadTrip,
  getRoadTripById,
  getRoadTripStops,
  updateRoadTrip,
} from '../lib/roadTrips'
import { getTripDetourKm, getTripGoogleMapsDirectionsUrl } from '../lib/roadTripRoute'
import { appFieldClass } from '../lib/formFieldClasses'

export default function RoadTripFindMorePage() {
  const navigate = useNavigate()
  const { tripId } = useParams<{ tripId: string }>()
  const user = getCurrentUser()
  const [refresh, setRefresh] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [detailEvent, setDetailEvent] = useState<DiscoverEvent | null>(null)

  const trip = useMemo(() => {
    void refresh
    return tripId ? getRoadTripById(tripId) : undefined
  }, [tripId, refresh])

  const stops = trip ? getRoadTripStops(trip) : []
  const mapStops = useMemo(
    () => (trip ? buildRoadTripMapStops(trip, stops) : []),
    [trip, stops],
  )
  const directionsUrl = useMemo(
    () => (trip ? getTripGoogleMapsDirectionsUrl(trip, stops) : null),
    [trip, stops],
  )

  const detourKm = trip ? getTripDetourKm(trip) : 10
  const maxStops = trip?.maxStops ?? 8

  const results = useMemo(() => {
    if (!trip) return []
    return filterEventsForRoadTrip({
      query,
      category,
      trip,
      routeStops: stops,
      currentStopIds: trip.stopEventIds,
    })
  }, [trip, query, category, stops])

  function reload() {
    setRefresh((n) => n + 1)
  }

  function handleDetourChange(km: number) {
    if (!trip) return
    updateRoadTrip(trip.id, { detourKm: km })
    reload()
  }

  function handleMaxStopsChange(count: number) {
    if (!trip) return
    updateRoadTrip(trip.id, { maxStops: count })
    reload()
  }

  function handleAddStop(eventId: string) {
    if (!trip) return
    if (trip.stopEventIds.length >= maxStops) return
    addStopToRoadTrip(trip.id, eventId)
    reload()
  }

  if (!user || !trip) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/road-trip" />
        <main className="px-4 pt-10 text-center text-sm text-brown-muted">
          Trip not found.
        </main>
        <BottomNav />
      </div>
    )
  }

  const atCapacity = trip.stopEventIds.length >= maxStops

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/road-trip" />

      <main className="px-4 pb-4 pt-2">
        <BackIconButton
          variant="plain"
          onClick={() => navigate(`/road-trip/create/${trip.id}/stops`)}
        />

        <p className="text-tagline mt-2">Road Trip</p>
        <h1 className="font-display text-xl font-extrabold tracking-tight text-brown">
          Find more stops
        </h1>
        <p className="mt-1 text-sm text-brown-muted">
          Browse by category or search — only events near your route show up.
        </p>

        <div className="mt-4">
          <RoadTripMap
            stops={mapStops}
            directionsUrl={directionsUrl}
            onEventSelect={(event) => setDetailEvent(event)}
          />
        </div>

        <div className="mt-4">
          <RoadTripStopSettings
            detourKm={detourKm}
            maxStops={maxStops}
            currentStopCount={trip.stopEventIds.length}
            onDetourChange={handleDetourChange}
            onMaxStopsChange={handleMaxStopsChange}
          />
        </div>

        <div className="relative mt-4">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, keywords…"
            className={`${appFieldClass} w-full py-3 pl-11 pr-4`}
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {INTEREST_CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(category === cat.id ? null : cat.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-[14px] border px-3 py-1.5 text-xs font-semibold transition ${
                category === cat.id
                  ? 'border-orange bg-orange/10 text-orange'
                  : 'border-app-subtle bg-app-elevated text-brown-muted hover:border-orange/30'
              }`}
            >
              <CategoryIcon category={cat} size={14} />
              {cat.label}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brown-muted">
          {atCapacity
            ? `Trip is full (${maxStops} stops). Remove a stop to add more.`
            : results.length > 0
              ? `${results.length} events within ${detourKm} km — swipe the card`
              : `0 events within ${detourKm} km of your route`}
        </p>

        <div className="mt-3">
          <RoadTripEventsCarousel
            events={results}
            emptyMessage={
              atCapacity
                ? `Trip is full (${maxStops} stops). Remove a stop to add more.`
                : 'No events match. Try a wider radius or different category.'
            }
            renderSlideFooter={(event) => (
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <p className="text-[11px] text-brown-muted">
                  Swipe for more · {results.length} near your route
                </p>
                <button
                  type="button"
                  disabled={atCapacity}
                  onClick={() => handleAddStop(event.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[14px] border border-orange/30 bg-orange/10 px-3 py-1.5 text-[11px] font-bold text-orange transition hover:border-orange/50 disabled:opacity-40"
                >
                  <Plus size={14} />
                  Add stop
                </button>
              </div>
            )}
          />
        </div>

        <GradientButton
          type="button"
          fullWidth
          className="mt-6 px-4 py-2.5 text-sm"
          onClick={() => navigate(`/road-trip/create/${trip.id}/stops`)}
        >
          Back to trip ({trip.stopEventIds.length} stops)
        </GradientButton>
      </main>

      {detailEvent && (
        <DiscoverEventDetailPanel
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onSave={() => setDetailEvent(null)}
        />
      )}

      <BottomNav />
    </div>
  )
}
